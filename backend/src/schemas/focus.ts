// Focus Sessions Schema Validation
// Zod schemas for validating focus session API requests

import { z } from 'zod';

// Session Types
export const SessionTypeSchema = z.enum(['pomodoro', 'deep_work', 'custom', 'sprint', 'flow', 'meditation', 'exercise', 'break']);

export const DistractionTypeSchema = z.enum([
  'notification', 'phone_call', 'interruption', 'internal_thought', 
  'external_noise', 'website', 'social_media', 'other'
]);

export const UserResponseSchema = z.enum(['ignored', 'addressed', 'postponed', 'gave_in']);

export const ReminderTypeSchema = z.enum([
  'pomodoro_break', 'long_break', 'eye_rest', 'movement', 'hydration', 'posture'
]);

export const LocationTypeSchema = z.enum([
  'home', 'office', 'cafe', 'library', 'coworking', 'outdoor', 'other'
]);

// Start Session Schema
export const StartSessionSchema = z.object({
  session_type: SessionTypeSchema,
  session_name: z.string().min(1).max(100).optional(),
  planned_duration: z.number().int().min(1).max(480), // 1 minute to 8 hours
  task_id: z.string().optional(),
  planned_task_count: z.number().int().min(1).max(20).optional().default(1),
  environment_data: z.record(z.any()).optional(),
  mood_before: z.number().int().min(1).max(10).optional(),
  energy_before: z.number().int().min(1).max(10).optional(),
  session_tags: z.array(z.string().max(50)).max(10).optional()
});

// Complete Session Schema
export const CompleteSessionSchema = z.object({
  actual_duration: z.number().int().min(1).max(480),
  completed_task_count: z.number().int().min(0).max(20).optional().default(0),
  break_duration: z.number().int().min(0).max(120).optional().default(0),
  mood_after: z.number().int().min(1).max(10).optional(),
  energy_after: z.number().int().min(1).max(10).optional(),
  focus_quality: z.number().int().min(1).max(10).optional(),
  productivity_rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
  is_successful: z.boolean().optional().default(true)
});

// Cancel Session Schema
export const CancelSessionSchema = z.object({
  reason: z.string().min(1).max(200)
});

// Record Distraction Schema
export const RecordDistractionSchema = z.object({
  distraction_type: DistractionTypeSchema,
  distraction_source: z.string().max(100).optional(),
  duration_seconds: z.number().int().min(1).max(3600).optional(), // up to 1 hour
  impact_level: z.number().int().min(1).max(5),
  user_response: UserResponseSchema.optional(),
  notes: z.string().max(200).optional()
});

// Update Break Reminder Schema
export const UpdateBreakReminderSchema = z.object({
  is_enabled: z.boolean().optional(),
  frequency_minutes: z.number().int().min(1).max(480).optional(),
  reminder_text_en: z.string().min(1).max(200).optional(),
  reminder_text_de: z.string().min(1).max(200).optional()
});

// Create Environment Schema
export const CreateEnvironmentSchema = z.object({
  environment_name: z.string().min(1).max(100),
  location_type: LocationTypeSchema,
  noise_level: z.number().int().min(1).max(5),
  lighting_quality: z.number().int().min(1).max(5),
  temperature_comfort: z.number().int().min(1).max(5),
  ergonomics_rating: z.number().int().min(1).max(5),
  distraction_level: z.number().int().min(1).max(5),
  is_favorite: z.boolean().optional().default(false)
});

// Update Environment Schema
export const UpdateEnvironmentSchema = z.object({
  environment_name: z.string().min(1).max(100).optional(),
  location_type: LocationTypeSchema.optional(),
  noise_level: z.number().int().min(1).max(5).optional(),
  lighting_quality: z.number().int().min(1).max(5).optional(),
  temperature_comfort: z.number().int().min(1).max(5).optional(),
  ergonomics_rating: z.number().int().min(1).max(5).optional(),
  distraction_level: z.number().int().min(1).max(5).optional(),
  is_favorite: z.boolean().optional()
});

// Query Parameters Schema
export const SessionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  session_type: SessionTypeSchema.optional(),
  start_date: z.coerce.number().int().optional(),
  end_date: z.coerce.number().int().optional()
});

export const AnalyticsQuerySchema = z.object({
  start_date: z.coerce.number().int().optional(),
  end_date: z.coerce.number().int().optional(),
  metric_type: z.enum([
    'productivity_score', 'focus_duration', 'distraction_rate', 
    'completion_rate', 'mood_improvement', 'energy_change'
  ]).optional()
});

// Template Query Schema
export const TemplateQuerySchema = z.object({
  language: z.enum(['en', 'de']).optional().default('en'),
  session_type: SessionTypeSchema.optional()
});

// Response Schemas (for documentation)
export const FocusSessionResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  session_type: SessionTypeSchema,
  session_name: z.string().optional(),
  planned_duration: z.number(),
  actual_duration: z.number().optional(),
  task_id: z.string().optional(),
  planned_task_count: z.number(),
  completed_task_count: z.number(),
  break_duration: z.number(),
  interruptions: z.number(),
  distraction_count: z.number(),
  distraction_details: z.record(z.any()).optional(),
  environment_data: z.record(z.any()).optional(),
  mood_before: z.number().optional(),
  mood_after: z.number().optional(),
  energy_before: z.number().optional(),
  energy_after: z.number().optional(),
  focus_quality: z.number().optional(),
  session_tags: z.array(z.string()).optional(),
  productivity_rating: z.number().optional(),
  notes: z.string().optional(),
  is_successful: z.boolean(),
  cancellation_reason: z.string().optional(),
  started_at: z.number(),
  completed_at: z.number().optional(),
  created_at: z.number(),
  updated_at: z.number()
});

export const FocusTemplateResponseSchema = z.object({
  id: z.string(),
  template_key: z.string(),
  name_en: z.string(),
  name_de: z.string(),
  description_en: z.string().optional(),
  description_de: z.string().optional(),
  session_type: SessionTypeSchema,
  default_duration: z.number(),
  break_duration: z.number(),
  long_break_duration: z.number(),
  cycles_before_long_break: z.number(),
  suggested_tasks: z.array(z.string()),
  productivity_tips_en: z.array(z.string()),
  productivity_tips_de: z.array(z.string()),
  environment_suggestions: z.record(z.any()),
  is_active: z.boolean(),
  created_at: z.number()
});

export const FocusDashboardResponseSchema = z.object({
  total_sessions: z.number(),
  successful_sessions: z.number(),
  total_focus_minutes: z.number(),
  avg_productivity_rating: z.number(),
  avg_session_duration: z.number(),
  total_interruptions: z.number(),
  avg_interruptions_per_session: z.number(),
  last_session_at: z.number().optional(),
  today_sessions: z.number(),
  today_minutes: z.number(),
  current_streaks: z.array(z.object({
    id: z.string(),
    streak_type: z.string(),
    current_streak: z.number(),
    longest_streak: z.number(),
    last_session_date: z.number().optional(),
    streak_start_date: z.number().optional(),
    streak_data: z.record(z.any()).optional(),
    is_active: z.boolean()
  })),
  productivity_trends: z.array(z.object({
    date: z.string(),
    metric_type: z.string(),
    avg_value: z.number()
  }))
});

export const BreakReminderResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  reminder_type: ReminderTypeSchema,
  trigger_condition: z.record(z.any()),
  reminder_text_en: z.string(),
  reminder_text_de: z.string(),
  is_enabled: z.boolean(),
  frequency_minutes: z.number().optional(),
  last_triggered: z.number().optional(),
  trigger_count: z.number(),
  user_response_rate: z.number(),
  created_at: z.number(),
  updated_at: z.number()
});

export const ProductivityPatternResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  pattern_type: z.enum(['optimal_duration', 'best_time_of_day', 'productive_environment', 'effective_breaks', 'task_types']),
  pattern_data: z.record(z.any()),
  confidence_score: z.number(),
  sample_size: z.number(),
  effectiveness_score: z.number().optional(),
  last_validated: z.number().optional(),
  is_active: z.boolean(),
  created_at: z.number(),
  updated_at: z.number()
});

// Type exports for use in other files
export type StartSessionRequest = z.infer<typeof StartSessionSchema>;
export type CompleteSessionRequest = z.infer<typeof CompleteSessionSchema>;
export type CancelSessionRequest = z.infer<typeof CancelSessionSchema>;
export type RecordDistractionRequest = z.infer<typeof RecordDistractionSchema>;
export type UpdateBreakReminderRequest = z.infer<typeof UpdateBreakReminderSchema>;
export type CreateEnvironmentRequest = z.infer<typeof CreateEnvironmentSchema>;
export type UpdateEnvironmentRequest = z.infer<typeof UpdateEnvironmentSchema>;
export type SessionsQuery = z.infer<typeof SessionsQuerySchema>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type TemplateQuery = z.infer<typeof TemplateQuerySchema>;