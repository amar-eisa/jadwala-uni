import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Subject {
  id: string;
  professor_id: string;
  group_id: string;
  weekly_hours: number;
  type: 'theory' | 'practical';
  user_id: string;
}

interface TimeSlot {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  user_id: string;
}

interface Room {
  id: string;
  name: string;
  type: 'lab' | 'lecture';
  user_id: string;
}

interface ProfessorUnavailability {
  id: string;
  professor_id: string;
  day: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  user_id: string;
}

interface ScheduleEntry {
  room_id: string;
  time_slot_id: string;
  subject_id: string;
  user_id: string;
  group_id: string;
  schedule_id: string | null;
}

interface ExistingEntry {
  room_id: string;
  time_slot_id: string;
  subject: {
    professor_id: string;
    group_id: string;
  }[] | null;
}

// Utility function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from Authorization header (JWT)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to validate
    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseWithAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    
    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get optional group_id and schedule_id from request body
    const { group_id, schedule_id } = await req.json();

    console.log(`Generating schedule for user: ${userId}${group_id ? `, group: ${group_id}` : ' (all groups)'}${schedule_id ? `, schedule: ${schedule_id}` : ' (draft)'}`);

    // Fetch all required data for this user
    let subjectsQuery = supabase.from('subjects').select('*').eq('user_id', userId);
    if (group_id) {
      subjectsQuery = subjectsQuery.eq('group_id', group_id);
    }

    const [roomsRes, timeSlotsRes, subjectsRes, unavailabilityRes] = await Promise.all([
      supabase.from('rooms').select('*').eq('user_id', userId),
      supabase.from('time_slots').select('*').eq('user_id', userId),
      subjectsQuery,
      supabase.from('professor_unavailability').select('*').eq('user_id', userId),
    ]);

    if (roomsRes.error) throw roomsRes.error;
    if (timeSlotsRes.error) throw timeSlotsRes.error;
    if (subjectsRes.error) throw subjectsRes.error;
    if (unavailabilityRes.error) throw unavailabilityRes.error;

    const rooms: Room[] = roomsRes.data;
    const timeSlots: TimeSlot[] = timeSlotsRes.data;
    const subjects: Subject[] = subjectsRes.data;
    const unavailabilities: ProfessorUnavailability[] = unavailabilityRes.data;

    console.log(`Starting schedule generation: ${subjects.length} subjects, ${timeSlots.length} time slots, ${rooms.length} rooms`);
    console.log(`Professor unavailability entries: ${unavailabilities.length}`);

    // Build professor unavailability lookup
    const professorUnavailabilityMap: Record<string, ProfessorUnavailability[]> = {};
    for (const unavail of unavailabilities) {
      if (!professorUnavailabilityMap[unavail.professor_id]) {
        professorUnavailabilityMap[unavail.professor_id] = [];
      }
      professorUnavailabilityMap[unavail.professor_id].push(unavail);
    }

    // Helper function to check if professor is available at a given time slot
    function isProfessorAvailable(professorId: string, timeSlot: TimeSlot): boolean {
      const unavailRules = professorUnavailabilityMap[professorId];
      if (!unavailRules || unavailRules.length === 0) return true;

      for (const rule of unavailRules) {
        if (rule.day !== timeSlot.day) continue;

        if (rule.all_day) {
          console.log(`Professor ${professorId} unavailable all day on ${rule.day}`);
          return false;
        }

        if (rule.start_time && rule.end_time) {
          const slotStart = timeSlot.start_time;
          const slotEnd = timeSlot.end_time;
          const unavailStart = rule.start_time;
          const unavailEnd = rule.end_time;

          const hasOverlap = slotStart < unavailEnd && slotEnd > unavailStart;
          
          if (hasOverlap) {
            console.log(`Professor ${professorId} unavailable at ${slotStart}-${slotEnd} on ${rule.day} (conflicts with ${unavailStart}-${unavailEnd})`);
            return false;
          }
        }
      }

      return true;
    }

    // CRITICAL FIX: Delete entries only for the specific schedule_id or drafts
    // This prevents deleting entries from other saved schedules
    let deleteQuery = supabase.from('schedule_entries').delete().eq('user_id', userId);
    
    if (schedule_id) {
      // Delete only entries belonging to this specific saved schedule
      deleteQuery = deleteQuery.eq('schedule_id', schedule_id);
    } else {
      // Delete only draft entries (schedule_id IS NULL)
      deleteQuery = deleteQuery.is('schedule_id', null);
    }
    
    if (group_id) {
      deleteQuery = deleteQuery.eq('group_id', group_id);
    }
    
    const { error: deleteError } = await deleteQuery;
    if (deleteError) {
      console.error('Error deleting existing entries:', deleteError);
      throw deleteError;
    }

    console.log(`Deleted existing entries for ${schedule_id ? `schedule ${schedule_id}` : 'drafts'}${group_id ? ` and group ${group_id}` : ''}`);

    // === FIX: Fetch remaining entries to avoid conflicts ===
    // Only consider entries within the SAME schedule context for conflicts
    const occupiedRoomSlots = new Set<string>();
    const occupiedProfessorSlots = new Set<string>();
    const occupiedGroupSlots = new Set<string>();

    // Build existing entries query - fetch entries from the SAME schedule context
    let existingQuery = supabase
      .from('schedule_entries')
      .select('room_id, time_slot_id, subject:subjects(professor_id, group_id)')
      .eq('user_id', userId);
    
    if (schedule_id) {
      existingQuery = existingQuery.eq('schedule_id', schedule_id);
    } else {
      existingQuery = existingQuery.is('schedule_id', null);
    }

    const { data: existingEntries, error: existingError } = await existingQuery;

    if (existingError) {
      console.error('Error fetching existing entries:', existingError);
      throw existingError;
    }

    // Pre-fill occupied slots from existing entries (other groups within same schedule)
    for (const entry of (existingEntries as ExistingEntry[]) || []) {
      occupiedRoomSlots.add(`${entry.room_id}-${entry.time_slot_id}`);
      const subject = Array.isArray(entry.subject) ? entry.subject[0] : entry.subject;
      if (subject?.professor_id) {
        occupiedProfessorSlots.add(`${subject.professor_id}-${entry.time_slot_id}`);
      }
      if (subject?.group_id) {
        occupiedGroupSlots.add(`${subject.group_id}-${entry.time_slot_id}`);
      }
    }

    console.log(`Pre-filled occupied slots - Rooms: ${occupiedRoomSlots.size}, Professors: ${occupiedProfessorSlots.size}, Groups: ${occupiedGroupSlots.size}`);

    // Track usage for load balancing
    const roomUsage: Record<string, number> = {};
    rooms.forEach(r => roomUsage[r.id] = 0);

    const scheduleEntries: ScheduleEntry[] = [];

    // Calculate sessions needed per subject based on weekly_hours
    const sessionsPerSubject: { subject: Subject; sessionsNeeded: number }[] = subjects.map(subject => ({
      subject,
      sessionsNeeded: Math.ceil((subject.weekly_hours || 2) / 2)
    }));

    console.log('Sessions needed:', sessionsPerSubject.map(s => ({ 
      id: s.subject.id, 
      weekly_hours: s.subject.weekly_hours, 
      sessions: s.sessionsNeeded 
    })));

    // Group time slots by day - shuffle days for variety but keep slots in chronological order
    const days = shuffleArray(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday']);
    const slotsByDay: Record<string, TimeSlot[]> = {};
    
    for (const day of days) {
      // Sort slots chronologically to fill from morning first (no gaps)
      slotsByDay[day] = timeSlots
        .filter(s => s.day === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    
    console.log('Slots per day:', Object.entries(slotsByDay).map(([day, slots]) => `${day}: ${slots.length}`));

    interface SessionToSchedule {
      subject: Subject;
      sessionIndex: number;
      totalSessions: number;
    }
    
    const allSessions: SessionToSchedule[] = [];
    for (const { subject, sessionsNeeded } of sessionsPerSubject) {
      for (let i = 0; i < sessionsNeeded; i++) {
        allSessions.push({
          subject,
          sessionIndex: i,
          totalSessions: sessionsNeeded
        });
      }
    }
    
    // Shuffle sessions for variety - this ensures different order each generation
    const shuffledSessions = shuffleArray(allSessions);
    
    const totalSessionsNeeded = shuffledSessions.length;
    console.log(`Total sessions to schedule: ${totalSessionsNeeded}`);
    
    const targetPerDay = Math.ceil(totalSessionsNeeded / days.length);
    console.log(`Target sessions per day: ${targetPerDay} (${totalSessionsNeeded} sessions / ${days.length} days)`);
    
    const sessionsPerDay: Record<string, number> = {};
    days.forEach(d => sessionsPerDay[d] = 0);
    
    const subjectScheduledDays: Record<string, Set<string>> = {};
    
    const sessionQueue = [...shuffledSessions];
    let totalSessionsScheduled = 0;
    
    for (let round = 0; round < 20 && sessionQueue.length > 0; round++) {
      const sortedDays = [...days].sort((a, b) => sessionsPerDay[a] - sessionsPerDay[b]);
      
      let scheduledThisRound = 0;
      
      for (const day of sortedDays) {
        if (round < 10 && sessionsPerDay[day] >= targetPerDay) continue;
        
        const daySlots = slotsByDay[day] || [];
        if (daySlots.length === 0) continue;
        
        const candidateSessions = sessionQueue
          .map((session, index) => {
            const scheduledDays = subjectScheduledDays[session.subject.id] || new Set();
            return {
              session,
              index,
              alreadyOnThisDay: scheduledDays.has(day),
              daysScheduled: scheduledDays.size
            };
          })
          .sort((a, b) => {
            if (a.alreadyOnThisDay !== b.alreadyOnThisDay) {
              return a.alreadyOnThisDay ? 1 : -1;
            }
            return a.daysScheduled - b.daysScheduled;
          });
        
        for (const candidate of candidateSessions) {
          const session = candidate.session;
          const subject = session.subject;
          
          const requiredRoomType = subject.type === 'theory' ? 'lecture' : 'lab';
          const compatibleRooms = rooms.filter(r => r.type === requiredRoomType);
          
          if (compatibleRooms.length === 0) continue;
          
          let scheduled = false;
          for (const timeSlot of daySlots) {
            if (!isProfessorAvailable(subject.professor_id, timeSlot)) {
              continue;
            }
            
            const profKey = `${subject.professor_id}-${timeSlot.id}`;
            if (occupiedProfessorSlots.has(profKey)) continue;
            
            const groupKey = `${subject.group_id}-${timeSlot.id}`;
            if (occupiedGroupSlots.has(groupKey)) continue;
            
            const sortedRooms = [...compatibleRooms].sort((a, b) => roomUsage[a.id] - roomUsage[b.id]);
            
            for (const room of sortedRooms) {
              const roomKey = `${room.id}-${timeSlot.id}`;
              if (occupiedRoomSlots.has(roomKey)) continue;
              
              // Schedule the class with user_id, group_id, and schedule_id
              scheduleEntries.push({
                room_id: room.id,
                time_slot_id: timeSlot.id,
                subject_id: subject.id,
                user_id: userId,
                group_id: subject.group_id,
                schedule_id: schedule_id || null,  // Use provided schedule_id or null for draft
              });
              
              occupiedRoomSlots.add(roomKey);
              occupiedProfessorSlots.add(profKey);
              occupiedGroupSlots.add(groupKey);
              roomUsage[room.id]++;
              sessionsPerDay[day]++;
              
              if (!subjectScheduledDays[subject.id]) {
                subjectScheduledDays[subject.id] = new Set();
              }
              subjectScheduledDays[subject.id].add(day);
              
              const queueIndex = sessionQueue.indexOf(session);
              if (queueIndex > -1) {
                sessionQueue.splice(queueIndex, 1);
              }
              
              totalSessionsScheduled++;
              scheduledThisRound++;
              scheduled = true;
              break;
            }
            
            if (scheduled) break;
          }
          
          if (scheduled) break;
        }
      }
      
      if (scheduledThisRound === 0) {
        console.log(`Round ${round + 1}: No progress, breaking`);
        break;
      }
      
      console.log(`Round ${round + 1}: Scheduled ${scheduledThisRound} sessions`);
    }
    
    console.log('=== Final Distribution ===');
    for (const day of days) {
      console.log(`${day}: ${sessionsPerDay[day]} sessions`);
    }
    
    if (sessionQueue.length > 0) {
      console.warn(`Could not schedule ${sessionQueue.length} sessions`);
    }

    // Insert all entries
    if (scheduleEntries.length > 0) {
      const { error } = await supabase.from('schedule_entries').insert(scheduleEntries);
      if (error) {
        console.error('Error inserting schedule entries:', error);
        throw error;
      }
    }

    console.log(`Schedule generation complete: ${totalSessionsScheduled}/${totalSessionsNeeded} sessions scheduled`);

    return new Response(
      JSON.stringify({
        success: true,
        scheduled: scheduleEntries.length,
        total: totalSessionsNeeded,
        subjects: subjects.length,
        schedule_id: schedule_id || null,
        message: `تم جدولة ${scheduleEntries.length} من ${totalSessionsNeeded} محاضرة`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating schedule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
