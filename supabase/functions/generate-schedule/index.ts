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
}

interface TimeSlot {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
}

interface Room {
  id: string;
  name: string;
  type: 'lab' | 'lecture';
}

interface ScheduleEntry {
  room_id: string;
  time_slot_id: string;
  subject_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all required data
    const [roomsRes, timeSlotsRes, subjectsRes] = await Promise.all([
      supabase.from('rooms').select('*'),
      supabase.from('time_slots').select('*'),
      supabase.from('subjects').select('*'),
    ]);

    if (roomsRes.error) throw roomsRes.error;
    if (timeSlotsRes.error) throw timeSlotsRes.error;
    if (subjectsRes.error) throw subjectsRes.error;

    const rooms: Room[] = roomsRes.data;
    const timeSlots: TimeSlot[] = timeSlotsRes.data;
    const subjects: Subject[] = subjectsRes.data;

    console.log(`Starting schedule generation: ${subjects.length} subjects, ${timeSlots.length} time slots, ${rooms.length} rooms`);

    // Clear existing schedule
    await supabase.from('schedule_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Track usage for load balancing
    const roomUsage: Record<string, number> = {};
    rooms.forEach(r => roomUsage[r.id] = 0);

    // Track occupied slots
    const occupiedRoomSlots = new Set<string>(); // room_id + time_slot_id
    const occupiedProfessorSlots = new Set<string>(); // professor_id + time_slot_id
    const occupiedGroupSlots = new Set<string>(); // group_id + time_slot_id

    const scheduleEntries: ScheduleEntry[] = [];

    // Calculate sessions needed per subject based on weekly_hours
    // Assuming each session is 2 hours
    const sessionsPerSubject: { subject: Subject; sessionsNeeded: number }[] = subjects.map(subject => ({
      subject,
      sessionsNeeded: Math.ceil((subject.weekly_hours || 2) / 2)
    }));

    console.log('Sessions needed:', sessionsPerSubject.map(s => ({ 
      id: s.subject.id, 
      weekly_hours: s.subject.weekly_hours, 
      sessions: s.sessionsNeeded 
    })));

    // Day order for scheduling
    const dayOrder: Record<string, number> = {
      'saturday': 0,
      'sunday': 1,
      'monday': 2,
      'tuesday': 3,
      'wednesday': 4,
      'thursday': 5,
      'friday': 6
    };
    
    // Group time slots by day
    const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
    const slotsByDay: Record<string, TimeSlot[]> = {};
    
    for (const day of days) {
      slotsByDay[day] = timeSlots
        .filter(s => s.day === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    
    console.log('Slots per day:', Object.entries(slotsByDay).map(([day, slots]) => `${day}: ${slots.length}`));

    // Build a list of all sessions needed with their subject info
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
    
    // Calculate target sessions per day for even distribution
    const targetPerDay = Math.ceil(totalSessionsNeeded / days.length);
    console.log(`Target sessions per day: ${targetPerDay} (${totalSessionsNeeded} sessions / ${days.length} days)`);
    
    // Track sessions per day for balancing
    const sessionsPerDay: Record<string, number> = {};
    days.forEach(d => sessionsPerDay[d] = 0);
    
    // Track scheduled days per subject to spread across week
    const subjectScheduledDays: Record<string, Set<string>> = {};
    
    // Create session queue
    const sessionQueue = [...allSessions];
    let totalSessionsScheduled = 0;
    
    // Multiple passes to ensure all sessions are scheduled evenly
    for (let round = 0; round < 20 && sessionQueue.length > 0; round++) {
      // Sort days by current load (least loaded first) for balanced distribution
      const sortedDays = [...days].sort((a, b) => sessionsPerDay[a] - sessionsPerDay[b]);
      
      let scheduledThisRound = 0;
      
      for (const day of sortedDays) {
        // In early rounds, skip days that already reached target to force distribution
        if (round < 10 && sessionsPerDay[day] >= targetPerDay) continue;
        
        const daySlots = slotsByDay[day] || [];
        if (daySlots.length === 0) continue;
        
        // Find best session to schedule on this day
        // Prioritize sessions whose subjects haven't been scheduled on this day yet
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
            // First: prefer sessions not yet on this day
            if (a.alreadyOnThisDay !== b.alreadyOnThisDay) {
              return a.alreadyOnThisDay ? 1 : -1;
            }
            // Then: prefer sessions with fewer days scheduled (spread them out)
            return a.daysScheduled - b.daysScheduled;
          });
        
        // Try to schedule ONE session on this day per round
        for (const candidate of candidateSessions) {
          const session = candidate.session;
          const subject = session.subject;
          
          // Filter rooms by type
          const requiredRoomType = subject.type === 'theory' ? 'lecture' : 'lab';
          const compatibleRooms = rooms.filter(r => r.type === requiredRoomType);
          
          if (compatibleRooms.length === 0) continue;
          
          // Try each time slot in this day
          let scheduled = false;
          for (const timeSlot of daySlots) {
            // Check professor conflict
            const profKey = `${subject.professor_id}-${timeSlot.id}`;
            if (occupiedProfessorSlots.has(profKey)) continue;
            
            // Check group conflict
            const groupKey = `${subject.group_id}-${timeSlot.id}`;
            if (occupiedGroupSlots.has(groupKey)) continue;
            
            // Find least used available room
            const sortedRooms = [...compatibleRooms].sort((a, b) => roomUsage[a.id] - roomUsage[b.id]);
            
            for (const room of sortedRooms) {
              const roomKey = `${room.id}-${timeSlot.id}`;
              if (occupiedRoomSlots.has(roomKey)) continue;
              
              // Schedule the class
              scheduleEntries.push({
                room_id: room.id,
                time_slot_id: timeSlot.id,
                subject_id: subject.id,
              });
              
              // Mark as occupied
              occupiedRoomSlots.add(roomKey);
              occupiedProfessorSlots.add(profKey);
              occupiedGroupSlots.add(groupKey);
              roomUsage[room.id]++;
              sessionsPerDay[day]++;
              
              // Track scheduled day for this subject
              if (!subjectScheduledDays[subject.id]) {
                subjectScheduledDays[subject.id] = new Set();
              }
              subjectScheduledDays[subject.id].add(day);
              
              // Remove from queue
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
          
          // Only schedule ONE session per day per round for maximum distribution
          if (scheduled) break;
        }
      }
      
      // If no progress was made, break
      if (scheduledThisRound === 0) {
        console.log(`Round ${round + 1}: No progress, breaking`);
        break;
      }
      
      console.log(`Round ${round + 1}: Scheduled ${scheduledThisRound} sessions`);
    }
    
    // Log distribution summary
    console.log('=== Final Distribution ===');
    for (const day of days) {
      console.log(`${day}: ${sessionsPerDay[day]} sessions`);
    }
    
    // Log unscheduled sessions
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
