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
    
    console.log(`Total sessions to schedule: ${allSessions.length}`);
    
    // Track scheduled days per subject to spread across week
    const subjectScheduledDays: Record<string, Set<string>> = {};
    
    // Schedule sessions using round-robin across days
    let totalSessionsScheduled = 0;
    const totalSessionsNeeded = allSessions.length;
    
    // Create a queue of sessions, sorted to prioritize spreading
    const sessionQueue = [...allSessions];
    
    // Keep trying until all sessions are scheduled or no progress
    let lastScheduledCount = -1;
    
    while (sessionQueue.length > 0 && totalSessionsScheduled !== lastScheduledCount) {
      lastScheduledCount = totalSessionsScheduled;
      
      // For each day, try to schedule one session per subject (round-robin)
      for (const day of days) {
        const daySlots = slotsByDay[day] || [];
        if (daySlots.length === 0) continue;
        
        // Get sessions that haven't been scheduled on this day yet
        const sessionsForDay = sessionQueue.filter(s => {
          const scheduledDays = subjectScheduledDays[s.subject.id] || new Set();
          // Prioritize subjects not yet scheduled on this day
          return !scheduledDays.has(day);
        });
        
        // Also include sessions that need to be scheduled but all days are taken
        const fallbackSessions = sessionQueue.filter(s => {
          const scheduledDays = subjectScheduledDays[s.subject.id] || new Set();
          return scheduledDays.has(day);
        });
        
        const orderedSessions = [...sessionsForDay, ...fallbackSessions];
        
        for (const session of orderedSessions) {
          const subject = session.subject;
          
          // Filter rooms by type
          const requiredRoomType = subject.type === 'theory' ? 'lecture' : 'lab';
          const compatibleRooms = rooms.filter(r => r.type === requiredRoomType);
          
          if (compatibleRooms.length === 0) continue;
          
          // Try each time slot in this day
          for (const timeSlot of daySlots) {
            // Check professor conflict
            const profKey = `${subject.professor_id}-${timeSlot.id}`;
            if (occupiedProfessorSlots.has(profKey)) continue;
            
            // Check group conflict
            const groupKey = `${subject.group_id}-${timeSlot.id}`;
            if (occupiedGroupSlots.has(groupKey)) continue;
            
            // Find least used available room
            const sortedRooms = [...compatibleRooms].sort((a, b) => roomUsage[a.id] - roomUsage[b.id]);
            
            let scheduled = false;
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
              console.log(`Scheduled subject ${subject.id} on ${day} (${totalSessionsScheduled}/${totalSessionsNeeded})`);
              
              scheduled = true;
              break;
            }
            
            if (scheduled) break;
          }
        }
      }
    }
    
    // Log unscheduled sessions
    if (sessionQueue.length > 0) {
      console.warn(`Could not schedule ${sessionQueue.length} sessions:`);
      for (const s of sessionQueue) {
        const requiredRoomType = s.subject.type === 'theory' ? 'lecture' : 'lab';
        console.warn(`- Subject ${s.subject.id} (needs ${requiredRoomType} room)`);
      }
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
