// AI Meeting Scheduling Service for Time & Wellness Application
import type { Env } from './env';
import { DatabaseService } from './db';
import type { SupportedLanguage } from '../types/database';

export interface MeetingRequest {
  id: string;
  organizer_id: string;
  title: string;
  participants: string[]; // email addresses
  duration_minutes: number;
  meeting_type: 'one_on_one' | 'team' | 'interview' | 'presentation' | 'workshop' | 'standup';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location_type: 'in_person' | 'video_call' | 'phone' | 'hybrid';
  location_details?: string;
  agenda?: string;
  preparation_time?: number;
  buffer_time?: number;
  preferences?: MeetingPreferences;
}

export interface MeetingPreferences {
  preferred_times?: Array<{ start: string; end: string }>; // "09:00", "17:00"
  avoid_times?: Array<{ start: string; end: string }>;
  preferred_days?: number[]; // 0-6, Sunday-Saturday
  avoid_days?: number[];
  timezone?: string;
  max_participants?: number;
  require_all_participants?: boolean;
}

export interface Participant {
  email: string;
  name?: string;
  role: 'organizer' | 'required' | 'optional' | 'presenter' | 'observer';
  timezone?: string;
  availability?: AvailabilitySlot[];
  constraints?: ParticipantConstraints;
}

export interface AvailabilitySlot {
  start: number; // timestamp
  end: number; // timestamp
  status: 'free' | 'busy' | 'tentative' | 'out_of_office';
}

export interface ParticipantConstraints {
  no_meetings_before?: string; // "09:00"
  no_meetings_after?: string; // "17:00"
  max_meetings_per_day?: number;
  preferred_meeting_length?: number;
  break_between_meetings?: number; // minutes
}

export interface MeetingTimeSlot {
  id: string;
  start_time: number;
  end_time: number;
  ai_score: number; // 0-100
  confidence_level: number; // 0-1
  reasoning: string;
  participant_conflicts: string[];
  availability_summary: {
    total_participants: number;
    available_participants: number;
    busy_participants: number;
    tentative_participants: number;
  };
  optimal_factors: string[];
}

export interface SchedulingResult {
  meeting_request_id: string;
  suggested_slots: MeetingTimeSlot[];
  analysis: {
    total_slots_analyzed: number;
    best_score: number;
    average_score: number;
    scheduling_difficulty: 'easy' | 'moderate' | 'difficult' | 'very_difficult';
    recommendations: string[];
  };
  participant_feedback: {
    [email: string]: {
      availability_rate: number;
      constraints_met: boolean;
      suggested_alternatives?: string[];
    };
  };
}

export class MeetingScheduler {
  private db: DatabaseService;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.db = new DatabaseService(env);
  }

  // Main scheduling method
  async scheduleMeeting(request: MeetingRequest): Promise<SchedulingResult> {
    try {
      // 1. Store the meeting request
      const meetingRequestId = await this.storeMeetingRequest(request);

      // 2. Get participant availability
      const participants = await this.getParticipantAvailability(request.participants);

      // 3. Generate potential time slots
      const potentialSlots = await this.generatePotentialSlots(request, participants);

      // 4. Score each slot using AI
      const scoredSlots = await this.scoreTimeSlots(potentialSlots, request, participants);

      // 5. Store the results
      await this.storeTimeSlotsResults(meetingRequestId, scoredSlots);

      // 6. Generate analysis and recommendations
      const analysis = this.generateSchedulingAnalysis(scoredSlots, participants);

      // 7. Create participant feedback
      const participantFeedback = this.generateParticipantFeedback(participants, scoredSlots);

      return {
        meeting_request_id: meetingRequestId,
        suggested_slots: scoredSlots.slice(0, 5), // Top 5 suggestions
        analysis,
        participant_feedback: participantFeedback
      };
    } catch (error) {
      console.error('Meeting scheduling failed:', error);
      throw new Error('Failed to schedule meeting');
    }
  }

  // Get participant availability from various sources
  private async getParticipantAvailability(participantEmails: string[]): Promise<Participant[]> {
    const participants: Participant[] = [];

    for (const email of participantEmails) {
      // Check if participant is a registered user
      const user = await this.db.query(`
        SELECT id, first_name, last_name, timezone FROM users WHERE email = ?
      `, [email]);

      const participant: Participant = {
        email,
        name: user.results?.[0] ? `${user.results[0].first_name} ${user.results[0].last_name}` : undefined,
        role: 'required', // Default, can be overridden
        timezone: user.results?.[0]?.timezone || 'UTC',
        availability: [],
        constraints: {}
      };

      // Get availability from calendar integrations
      if (user.results?.[0]) {
        const availability = await this.getUserAvailability(user.results[0].id);
        participant.availability = availability;

        // Get learned constraints/patterns
        const patterns = await this.getUserAvailabilityPatterns(user.results[0].id);
        participant.constraints = this.extractConstraintsFromPatterns(patterns);
      } else {
        // For external participants, use default business hours
        participant.availability = this.generateDefaultAvailability();
        participant.constraints = this.getDefaultConstraints();
      }

      participants.push(participant);
    }

    return participants;
  }

  // Generate potential meeting time slots
  private async generatePotentialSlots(
    request: MeetingRequest, 
    participants: Participant[]
  ): Promise<Array<{ start: number; end: number }>> {
    const slots: Array<{ start: number; end: number }> = [];
    const now = Date.now();
    const oneWeekFromNow = now + (7 * 24 * 60 * 60 * 1000);
    
    // Generate slots for the next 7 days
    for (let day = 0; day < 7; day++) {
      const dayStart = new Date(now + (day * 24 * 60 * 60 * 1000));
      dayStart.setHours(8, 0, 0, 0); // Start at 8 AM
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(18, 0, 0, 0); // End at 6 PM
      
      // Skip weekends unless specifically requested
      if (dayStart.getDay() === 0 || dayStart.getDay() === 6) {
        if (!request.preferences?.preferred_days?.includes(dayStart.getDay())) {
          continue;
        }
      }

      // Generate 30-minute slots throughout the day
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(dayStart);
          slotStart.setHours(hour, minute, 0, 0);
          
          const slotEnd = new Date(slotStart);
          slotEnd.setTime(slotStart.getTime() + (request.duration_minutes * 60 * 1000));
          
          // Don't suggest slots that end after business hours
          if (slotEnd.getHours() > 18) continue;
          
          slots.push({
            start: slotStart.getTime(),
            end: slotEnd.getTime()
          });
        }
      }
    }

    return slots;
  }

  // Score time slots using AI and availability analysis
  private async scoreTimeSlots(
    slots: Array<{ start: number; end: number }>,
    request: MeetingRequest,
    participants: Participant[]
  ): Promise<MeetingTimeSlot[]> {
    const scoredSlots: MeetingTimeSlot[] = [];

    for (const slot of slots) {
      const score = await this.calculateSlotScore(slot, request, participants);
      
      if (score.ai_score > 20) { // Only include slots with reasonable scores
        scoredSlots.push({
          id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          start_time: slot.start,
          end_time: slot.end,
          ...score
        });
      }
    }

    // Sort by AI score (highest first)
    return scoredSlots.sort((a, b) => b.ai_score - a.ai_score);
  }

  // Calculate AI score for a specific time slot
  private async calculateSlotScore(
    slot: { start: number; end: number },
    request: MeetingRequest,
    participants: Participant[]
  ): Promise<{
    ai_score: number;
    confidence_level: number;
    reasoning: string;
    participant_conflicts: string[];
    availability_summary: any;
    optimal_factors: string[];
  }> {
    let score = 100; // Start with perfect score
    const conflicts: string[] = [];
    const optimalFactors: string[] = [];
    const reasoning: string[] = [];
    
    let availableCount = 0;
    let busyCount = 0;
    let tentativeCount = 0;

    // Check each participant's availability
    for (const participant of participants) {
      const availability = this.getParticipantAvailabilityForSlot(participant, slot);
      
      switch (availability.status) {
        case 'free':
          availableCount++;
          score += 5; // Bonus for available participants
          break;
        case 'busy':
          busyCount++;
          conflicts.push(participant.email);
          score -= 30; // Heavy penalty for conflicts
          break;
        case 'tentative':
          tentativeCount++;
          score -= 10; // Light penalty for tentative
          break;
        case 'out_of_office':
          conflicts.push(participant.email);
          score -= 50; // Very heavy penalty
          break;
      }

      // Check constraints
      if (participant.constraints) {
        const constraintScore = this.checkParticipantConstraints(participant, slot);
        score += constraintScore.score;
        if (constraintScore.violations.length > 0) {
          reasoning.push(`${participant.email}: ${constraintScore.violations.join(', ')}`);
        }
      }
    }

    // Time-of-day preferences
    const hour = new Date(slot.start).getHours();
    if (hour >= 9 && hour <= 11) {
      score += 10;
      optimalFactors.push('Morning slot (high productivity)');
    } else if (hour >= 14 && hour <= 16) {
      score += 5;
      optimalFactors.push('Afternoon slot (good for collaboration)');
    } else if (hour < 9 || hour > 17) {
      score -= 15;
      reasoning.push('Outside typical business hours');
    }

    // Day of week preferences
    const dayOfWeek = new Date(slot.start).getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Monday-Thursday
      score += 5;
      optimalFactors.push('Weekday (better attendance)');
    } else if (dayOfWeek === 5) { // Friday
      score -= 5;
      reasoning.push('Friday meetings have lower engagement');
    }

    // Meeting type considerations
    switch (request.meeting_type) {
      case 'standup':
        if (hour === 9) {
          score += 15;
          optimalFactors.push('Perfect time for standup');
        }
        break;
      case 'presentation':
        if (hour >= 10 && hour <= 15) {
          score += 10;
          optimalFactors.push('Good time for presentations');
        }
        break;
      case 'interview':
        if (hour >= 10 && hour <= 16) {
          score += 8;
          optimalFactors.push('Professional interview hours');
        }
        break;
    }

    // Priority adjustments
    if (request.priority === 'urgent' && conflicts.length > 0) {
      score += 20; // Boost urgent meetings even with some conflicts
      optimalFactors.push('Urgent priority override');
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Calculate confidence based on data quality
    let confidence = 0.8; // Base confidence
    if (participants.every(p => p.availability && p.availability.length > 0)) {
      confidence += 0.1; // Higher confidence with real availability data
    }
    if (conflicts.length === 0) {
      confidence += 0.1; // Higher confidence with no conflicts
    }

    return {
      ai_score: Math.round(score),
      confidence_level: Math.min(1, confidence),
      reasoning: reasoning.length > 0 ? reasoning.join('; ') : 'Good availability for all participants',
      participant_conflicts: conflicts,
      availability_summary: {
        total_participants: participants.length,
        available_participants: availableCount,
        busy_participants: busyCount,
        tentative_participants: tentativeCount
      },
      optimal_factors: optimalFactors
    };
  }

  // Helper methods
  private getParticipantAvailabilityForSlot(
    participant: Participant, 
    slot: { start: number; end: number }
  ): { status: 'free' | 'busy' | 'tentative' | 'out_of_office' } {
    if (!participant.availability || participant.availability.length === 0) {
      return { status: 'free' }; // Assume free if no data
    }

    // Check if slot overlaps with any busy periods
    for (const availability of participant.availability) {
      if (this.slotsOverlap(slot, { start: availability.start, end: availability.end })) {
        return { status: availability.status };
      }
    }

    return { status: 'free' };
  }

  private slotsOverlap(
    slot1: { start: number; end: number }, 
    slot2: { start: number; end: number }
  ): boolean {
    return slot1.start < slot2.end && slot2.start < slot1.end;
  }

  private checkParticipantConstraints(
    participant: Participant, 
    slot: { start: number; end: number }
  ): { score: number; violations: string[] } {
    let score = 0;
    const violations: string[] = [];

    if (!participant.constraints) return { score, violations };

    const startHour = new Date(slot.start).getHours();
    const startMinute = new Date(slot.start).getMinutes();
    const startTime = startHour + (startMinute / 60);

    // Check time constraints
    if (participant.constraints.no_meetings_before) {
      const [hour, minute] = participant.constraints.no_meetings_before.split(':').map(Number);
      const minTime = hour + (minute / 60);
      if (startTime < minTime) {
        score -= 20;
        violations.push(`Prefers no meetings before ${participant.constraints.no_meetings_before}`);
      }
    }

    if (participant.constraints.no_meetings_after) {
      const [hour, minute] = participant.constraints.no_meetings_after.split(':').map(Number);
      const maxTime = hour + (minute / 60);
      if (startTime > maxTime) {
        score -= 20;
        violations.push(`Prefers no meetings after ${participant.constraints.no_meetings_after}`);
      }
    }

    return { score, violations };
  }

  // Database operations
  private async storeMeetingRequest(request: MeetingRequest): Promise<string> {
    const id = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.query(`
      INSERT INTO meeting_requests (
        id, organizer_id, title, participants, duration_minutes, meeting_type,
        priority, location_type, location_details, agenda, preparation_time,
        buffer_time, preferences, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, request.organizer_id, request.title, JSON.stringify(request.participants),
      request.duration_minutes, request.meeting_type, request.priority,
      request.location_type, request.location_details, request.agenda,
      request.preparation_time || 0, request.buffer_time || 15,
      JSON.stringify(request.preferences || {}), 'pending', Date.now()
    ]);

    return id;
  }

  private async storeTimeSlotsResults(meetingRequestId: string, slots: MeetingTimeSlot[]): Promise<void> {
    for (const slot of slots) {
      await this.db.query(`
        INSERT INTO meeting_time_slots (
          id, meeting_request_id, start_time, end_time, ai_score, confidence_level,
          reasoning, participant_conflicts, availability_summary, optimal_factors, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        slot.id, meetingRequestId, slot.start_time, slot.end_time, slot.ai_score,
        slot.confidence_level, slot.reasoning, JSON.stringify(slot.participant_conflicts),
        JSON.stringify(slot.availability_summary), JSON.stringify(slot.optimal_factors),
        Date.now()
      ]);
    }
  }

  // Placeholder methods for external integrations
  private async getUserAvailability(userId: string): Promise<AvailabilitySlot[]> {
    // TODO: Integrate with Google Calendar, Outlook, etc.
    // For now, return empty array (will use default business hours)
    return [];
  }

  private async getUserAvailabilityPatterns(userId: string): Promise<any> {
    const result = await this.db.query(`
      SELECT pattern_data FROM availability_patterns WHERE user_id = ?
    `, [userId]);

    return result.results?.[0]?.pattern_data ? JSON.parse(result.results[0].pattern_data) : {};
  }

  private extractConstraintsFromPatterns(patterns: any): ParticipantConstraints {
    return {
      no_meetings_before: patterns.preferred_hours?.start ? `${patterns.preferred_hours.start}:00` : '09:00',
      no_meetings_after: patterns.preferred_hours?.end ? `${patterns.preferred_hours.end}:00` : '17:00',
      break_between_meetings: patterns.buffer_minutes || 15
    };
  }

  private generateDefaultAvailability(): AvailabilitySlot[] {
    // Generate default business hours availability for external participants
    const slots: AvailabilitySlot[] = [];
    const now = Date.now();
    
    for (let day = 0; day < 7; day++) {
      const dayStart = new Date(now + (day * 24 * 60 * 60 * 1000));
      
      // Skip weekends
      if (dayStart.getDay() === 0 || dayStart.getDay() === 6) continue;
      
      dayStart.setHours(9, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(17, 0, 0, 0);
      
      slots.push({
        start: dayStart.getTime(),
        end: dayEnd.getTime(),
        status: 'free'
      });
    }
    
    return slots;
  }

  private getDefaultConstraints(): ParticipantConstraints {
    return {
      no_meetings_before: '09:00',
      no_meetings_after: '17:00',
      break_between_meetings: 15
    };
  }

  private generateSchedulingAnalysis(slots: MeetingTimeSlot[], participants: Participant[]): any {
    const scores = slots.map(s => s.ai_score);
    const bestScore = Math.max(...scores);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    let difficulty: 'easy' | 'moderate' | 'difficult' | 'very_difficult' = 'easy';
    if (bestScore < 30) difficulty = 'very_difficult';
    else if (bestScore < 50) difficulty = 'difficult';
    else if (bestScore < 70) difficulty = 'moderate';

    const recommendations: string[] = [];
    if (bestScore < 50) {
      recommendations.push('Consider reducing the number of participants');
      recommendations.push('Try scheduling for next week when availability might be better');
    }
    if (participants.length > 5) {
      recommendations.push('Large meetings are harder to schedule - consider breaking into smaller groups');
    }

    return {
      total_slots_analyzed: slots.length,
      best_score: bestScore,
      average_score: Math.round(averageScore),
      scheduling_difficulty: difficulty,
      recommendations
    };
  }

  private generateParticipantFeedback(participants: Participant[], slots: MeetingTimeSlot[]): any {
    const feedback: any = {};
    
    for (const participant of participants) {
      const availableSlots = slots.filter(slot => 
        !slot.participant_conflicts.includes(participant.email)
      );
      
      feedback[participant.email] = {
        availability_rate: availableSlots.length / slots.length,
        constraints_met: true, // Simplified for now
        suggested_alternatives: availableSlots.length < 3 ? 
          ['Consider flexible timing', 'Check availability for next week'] : undefined
      };
    }
    
    return feedback;
  }
}