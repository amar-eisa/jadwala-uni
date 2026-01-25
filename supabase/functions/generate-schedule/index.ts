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

    // Sort time slots by day order and start time (start from first period)
    const dayOrder: Record<string, number> = {
      'saturday': 0,
      'sunday': 1,
      'monday': 2,
      'tuesday': 3,
      'wednesday': 4,
      'thursday': 5,
      'friday': 6
    };
    
    const sortedTimeSlots = [...timeSlots].sort((a, b) => {
      const dayDiff = dayOrder[a.day] - dayOrder[b.day];
      if (dayDiff !== 0) return dayDiff;
      return a.start_time.localeCompare(b.start_time);
    });
    
    console.log('Time slots order:', sortedTimeSlots.map(s => `${s.day} ${s.start_time}`));

    // Schedule each subject for the required number of sessions
    let totalSessionsScheduled = 0;
    let totalSessionsNeeded = 0;

    for (const { subject, sessionsNeeded } of sessionsPerSubject) {
      let scheduledCount = 0;
      totalSessionsNeeded += sessionsNeeded;

      console.log(`Scheduling subject ${subject.id}: need ${sessionsNeeded} sessions`);

      for (const timeSlot of sortedTimeSlots) {
        if (scheduledCount >= sessionsNeeded) break;

        // Check professor conflict
        const profKey = `${subject.professor_id}-${timeSlot.id}`;
        if (occupiedProfessorSlots.has(profKey)) continue;

        // Check group conflict
        const groupKey = `${subject.group_id}-${timeSlot.id}`;
        if (occupiedGroupSlots.has(groupKey)) continue;

        // Filter rooms by type: theory → lecture, practical → lab
        const requiredRoomType = subject.type === 'theory' ? 'lecture' : 'lab';
        const compatibleRooms = rooms.filter(r => r.type === requiredRoomType);
        
        // Find least used available room (Load Balancing)
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

          scheduledCount++;
          totalSessionsScheduled++;
          
          console.log(`Scheduled session ${scheduledCount}/${sessionsNeeded} for subject ${subject.id}`);
          break;
        }
      }

      if (scheduledCount < sessionsNeeded) {
        const requiredRoomType = subject.type === 'theory' ? 'lecture' : 'lab';
        console.warn(`Could only schedule ${scheduledCount}/${sessionsNeeded} sessions for subject ${subject.id} (type: ${subject.type}, needs: ${requiredRoomType} rooms)`);
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
