import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, MapPin, FileText } from 'lucide-react';
import { Sheet } from '../../ui/Sheet';
import { useCreateEventMutation } from '../../../hooks/queries/useCalendarQueries';
import type { CalendarEvent } from '../../../types';
import { toast } from 'react-hot-toast';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStartTime?: number;
  defaultEndTime?: number;
}

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  eventType: z.enum(['meeting', 'appointment', 'task', 'reminder', 'break', 'personal', 'work']),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return new Date(data.endTime) > new Date(data.startTime);
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

type EventFormData = z.infer<typeof eventSchema>;

const EventForm: React.FC<EventFormProps> = ({
  isOpen,
  onClose,
  defaultStartTime,
  defaultEndTime,
}) => {
  const createEventMutation = useCreateEventMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      eventType: 'appointment',
      startTime: '',
      endTime: '',
    },
  });

  // Set default times when form opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const start = defaultStartTime ? new Date(defaultStartTime) : now;
      const end = defaultEndTime ? new Date(defaultEndTime) : new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hour

      reset({
        title: '',
        description: '',
        location: '',
        eventType: 'appointment',
        startTime: start.toISOString().slice(0, 16),
        endTime: end.toISOString().slice(0, 16),
      });
    }
  }, [isOpen, defaultStartTime, defaultEndTime, reset]);

  const onSubmit = async (data: EventFormData) => {
    try {
      const eventData: Partial<CalendarEvent> = {
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        eventType: data.eventType,
        startTime: new Date(data.startTime).getTime(),
        endTime: new Date(data.endTime).getTime(),
        status: 'confirmed',
      };

      await createEventMutation.mutateAsync(eventData);
      onClose();
      reset();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  // Time validation is handled by zod schema

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Create Event"
      className="p-6"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Event Title *
            </label>
            <p className="text-xs text-foreground-secondary mb-2">Give your event a clear, descriptive name</p>
            <input
              {...register('title')}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              placeholder="e.g., Team Meeting, Doctor Appointment, Project Review"
            />
            {errors.title && (
              <p className="text-error text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Event Type
            </label>
            <p className="text-xs text-foreground-secondary mb-2">What type of event is this?</p>
            <select
              {...register('eventType')}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              <option value="meeting">Meeting</option>
              <option value="appointment">Appointment</option>
              <option value="task">Task</option>
              <option value="reminder">Reminder</option>
              <option value="break">Break</option>
              <option value="personal">Personal</option>
              <option value="work">Work</option>
            </select>
            {errors.eventType && (
              <p className="text-error text-sm mt-1">{errors.eventType.message}</p>
            )}
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Start Time *
            </label>
            <p className="text-xs text-foreground-secondary mb-2">When does this event start?</p>
            <input
              {...register('startTime')}
              type="datetime-local"
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            {errors.startTime && (
              <p className="text-error text-sm mt-1">{errors.startTime.message}</p>
            )}
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              End Time *
            </label>
            <p className="text-xs text-foreground-secondary mb-2">When does this event end?</p>
            <input
              {...register('endTime')}
              type="datetime-local"
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            {errors.endTime && (
              <p className="text-error text-sm mt-1">{errors.endTime.message}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <p className="text-xs text-foreground-secondary mb-2">Where will this event take place?</p>
            <input
              {...register('location')}
              type="text"
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              placeholder="e.g., Conference Room A, Zoom, Office"
              maxLength={200}
            />
            {errors.location && (
              <p className="text-error text-sm mt-1">{errors.location.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Description
            </label>
            <p className="text-xs text-foreground-secondary mb-2">Add details, notes, or agenda for this event</p>
            <textarea
              {...register('description')}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground h-24 resize-none"
              placeholder="e.g., Agenda items, meeting notes, or any additional context..."
            />
            {errors.description && (
              <p className="text-error text-sm mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Sheet>
  );
};

export default EventForm;

