import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user_id and optional group_id from request body
    const { user_id, group_id } = await req.json();
    if (!user_id) {
      throw new Error('user_id is required');
    }

    console.log(`Generating schedule for user: ${user_id}${group_id ? `, group: ${group_id}` : ' (all groups)'}`);

    // Fetch all required data for this user
    // Build subjects query - filter by group_id if specified
    let subjectsQuery = supabase.from('subjects').select('*').eq('user_id', user_id);
    if (group_id) {
      subjectsQuery = subjectsQuery.eq('group_id', group_id);
    }

    const [roomsRes, timeSlotsRes, subjectsRes, unavailabilityRes] = await Promise.all([
      supabase.from('rooms').select('*').eq('user_id', user_id),
      supabase.from('time_slots').select('*').eq('user_id', user_id),
      subjectsQuery,
      supabase.from('professor_unavailability').select('*').eq('user_id', user_id),
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
    if (group_id) {
      console.log(`Generating for specific group: ${group_id}`);
    }

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

    // Clear existing schedule for this user (and group if specified)
    let deleteQuery = supabase.from('schedule_entries').delete().eq('user_id', user_id);
    if (group_id) {
      deleteQuery = deleteQuery.eq('group_id', group_id);
    }
    await deleteQuery;

    // Track usage for load balancing
    const roomUsage: Record<string, number> = {};
    rooms.forEach(r => roomUsage[r.id] = 0);

    // Track occupied slots
    const occupiedRoomSlots = new Set<string>();
    const occupiedProfessorSlots = new Set<string>();
    const occupiedGroupSlots = new Set<string>();

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

    // Group time slots by day
    const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
    const slotsByDay: Record<string, TimeSlot[]> = {};
    
    for (const day of days) {
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
    
    const totalSessionsNeeded = allSessions.length;
    console.log(`Total sessions to schedule: ${totalSessionsNeeded}`);
    
    const targetPerDay = Math.ceil(totalSessionsNeeded / days.length);
    console.log(`Target sessions per day: ${targetPerDay} (${totalSessionsNeeded} sessions / ${days.length} days)`);
    
    const sessionsPerDay: Record<string, number> = {};
    days.forEach(d => sessionsPerDay[d] = 0);
    
    const subjectScheduledDays: Record<string, Set<string>> = {};
    
    const sessionQueue = [...allSessions];
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
              
              // Schedule the class with user_id and group_id
              scheduleEntries.push({
                room_id: room.id,
                time_slot_id: timeSlot.id,
                subject_id: subject.id,
                user_id: user_id,
                group_id: subject.group_id,
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
      if (error) throw error;
    }

    console.log(`Schedule generation complete: ${totalSessionsScheduled}/${totalSessionsNeeded} sessions scheduled`);

    return new Response(
      JSON.stringify({
        success: true,
        scheduled: scheduleEntries.length,
        total: totalSessionsNeeded,
        subjects: subjects.length,
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
