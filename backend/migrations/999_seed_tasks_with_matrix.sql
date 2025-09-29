-- Seed data for Tasks with Eisenhower Matrix fields
-- This script adds comprehensive task data with proper urgency/importance values

-- First, let's add the specific user if they don't exist
INSERT OR IGNORE INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    timezone,
    preferred_language,
    subscription_type,
    is_student,
    created_at,
    updated_at
) VALUES (
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'michaelwekesa@kabarak.ac.ke',
    '$2a$10$example_hash_michael',
    'Michael',
    'Wekesa',
    'Africa/Nairobi',
    'en',
    'free',
    true,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
);

-- Clear existing task data for our test user
DELETE FROM tasks WHERE user_id = 'user_f3d010bdc39642f9a550ca47cad8079e';

-- Insert comprehensive task data with Eisenhower Matrix fields
INSERT INTO tasks (
    id,
    user_id,
    title,
    description,
    priority,
    status,
    due_date,
    estimated_duration,
    ai_priority_score,
    context_type,
    urgency,
    importance,
    eisenhower_quadrant,
    matrix_notes,
    energy_level_required,
    created_at,
    updated_at
) VALUES 
-- Q1: DO FIRST (High Urgency + High Importance)
(
    'task_urgent_1',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Fix critical bug in production',
    'Customer reported payment processing issue that needs immediate attention',
    4,
    'pending',
    (strftime('%s', 'now') + 3600) * 1000, -- Due in 1 hour
    120,
    0.95,
    'work',
    4, -- High urgency
    4, -- High importance
    'do',
    'Critical production issue - must be fixed immediately',
    8,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'task_urgent_2',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Prepare for board meeting',
    'Finalize presentation and prepare talking points for quarterly board meeting',
    4,
    'pending',
    (strftime('%s', 'now') + 7200) * 1000, -- Due in 2 hours
    90,
    0.9,
    'work',
    4, -- High urgency
    4, -- High importance
    'do',
    'Board meeting is today - high priority',
    7,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'task_urgent_3',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Visit doctor for checkup',
    'Annual health checkup appointment',
    3,
    'pending',
    (strftime('%s', 'now') + 10800) * 1000, -- Due in 3 hours
    60,
    0.8,
    'health',
    4, -- High urgency
    4, -- High importance
    'do',
    'Appointment is today - cannot be rescheduled',
    6,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),

-- Q2: SCHEDULE (Low Urgency + High Importance)
(
    'task_important_1',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Plan team retreat',
    'Research venues and activities for annual team building retreat',
    3,
    'pending',
    (strftime('%s', 'now') + 604800) * 1000, -- Due in 1 week
    180,
    0.7,
    'work',
    2, -- Low urgency
    4, -- High importance
    'decide',
    'Important for team morale - schedule time for this',
    5,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'task_important_2',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Learn new programming language',
    'Complete online course for Python advanced features',
    2,
    'pending',
    (strftime('%s', 'now') + 1209600) * 1000, -- Due in 2 weeks
    300,
    0.6,
    'learning',
    1, -- Low urgency
    4, -- High importance
    'decide',
    'Career development - schedule regular study time',
    4,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'task_important_3',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Write technical blog post',
    'Document the new architecture patterns we implemented',
    2,
    'pending',
    (strftime('%s', 'now') + 2592000) * 1000, -- Due in 1 month
    240,
    0.5,
    'work',
    1, -- Low urgency
    3, -- Medium-high importance
    'decide',
    'Good for personal brand - schedule writing time',
    5,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),

-- Q3: DELEGATE (High Urgency + Low Importance)
(
    'task_delegate_1',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Order office supplies',
    'Restock printer paper, pens, and other office materials',
    2,
    'pending',
    (strftime('%s', 'now') + 1800) * 1000, -- Due in 30 minutes
    15,
    0.3,
    'work',
    4, -- High urgency
    2, -- Low importance
    'delegate',
    'Can be delegated to admin assistant',
    2,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'task_delegate_2',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Book restaurant for team lunch',
    'Find and book a restaurant for next week team lunch',
    1,
    'pending',
    (strftime('%s', 'now') + 3600) * 1000, -- Due in 1 hour
    20,
    0.2,
    'work',
    3, -- Medium urgency
    1, -- Low importance
    'delegate',
    'Can be delegated to team coordinator',
    2,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'task_delegate_3',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Update social media posts',
    'Post company updates on LinkedIn and Twitter',
    1,
    'pending',
    (strftime('%s', 'now') + 7200) * 1000, -- Due in 2 hours
    30,
    0.2,
    'work',
    3, -- Medium urgency
    2, -- Low importance
    'delegate',
    'Can be delegated to marketing team',
    3,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),

-- Q4: ELIMINATE (Low Urgency + Low Importance)
(
    'task_eliminate_1',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Check social media notifications',
    'Browse through Instagram and Facebook notifications',
    1,
    'pending',
    (strftime('%s', 'now') + 86400) * 1000, -- Due in 1 day
    30,
    0.1,
    'social',
    1, -- Low urgency
    1, -- Low importance
    'delete',
    'Time waster - consider eliminating',
    1,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'task_eliminate_2',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Organize old emails',
    'Sort through emails from 6 months ago',
    1,
    'pending',
    (strftime('%s', 'now') + 172800) * 1000, -- Due in 2 days
    60,
    0.1,
    'work',
    1, -- Low urgency
    1, -- Low importance
    'delete',
    'Low value activity - consider eliminating',
    2,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'task_eliminate_3',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Watch random YouTube videos',
    'Browse through recommended videos',
    1,
    'pending',
    (strftime('%s', 'now') + 259200) * 1000, -- Due in 3 days
    45,
    0.05,
    'personal',
    1, -- Low urgency
    1, -- Low importance
    'delete',
    'Pure time waster - eliminate',
    1,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),

-- Some completed tasks for better statistics
(
    'task_completed_1',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Submit monthly report',
    'Complete and submit Q4 monthly performance report',
    3,
    'done',
    (strftime('%s', 'now') - 86400) * 1000, -- Completed yesterday
    90,
    0.8,
    'work',
    4, -- High urgency
    4, -- High importance
    'do',
    'Successfully completed on time',
    6,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'task_completed_2',
    'user_f3d010bdc39642f9a550ca47cad8079e',
    'Review code changes',
    'Code review for pull request #123',
    2,
    'done',
    (strftime('%s', 'now') - 3600) * 1000, -- Completed 1 hour ago
    30,
    0.6,
    'work',
    3, -- Medium urgency
    3, -- Medium importance
    'decide',
    'Completed code review',
    4,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),

-- Tasks for user_2 to show different user data
(
    'task_user2_1',
    'user_2',
    'Prepare presentation for client',
    'Create slides for tomorrow client meeting',
    4,
    'pending',
    (strftime('%s', 'now') + 14400) * 1000, -- Due in 4 hours
    120,
    0.9,
    'work',
    4, -- High urgency
    4, -- High importance
    'do',
    'Client meeting tomorrow - critical',
    8,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'task_user2_2',
    'user_2',
    'Plan vacation',
    'Research destinations and book flights for summer vacation',
    2,
    'pending',
    (strftime('%s', 'now') + 1814400) * 1000, -- Due in 3 weeks
    180,
    0.4,
    'personal',
    1, -- Low urgency
    3, -- Medium importance
    'decide',
    'Important for work-life balance',
    4,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
),
(
    'task_user2_3',
    'user_2',
    'Update project documentation',
    'Document recent changes to the API endpoints',
    2,
    'pending',
    (strftime('%s', 'now') + 259200) * 1000, -- Due in 3 days
    60,
    0.5,
    'work',
    2, -- Low urgency
    3, -- Medium importance
    'decide',
    'Important for team knowledge',
    5,
    strftime('%s', 'now') * 1000,
    strftime('%s', 'now') * 1000
);

-- Update matrix_last_reviewed for all tasks
UPDATE tasks 
SET matrix_last_reviewed = strftime('%s', 'now') * 1000
WHERE user_id = 'user_f3d010bdc39642f9a550ca47cad8079e';
