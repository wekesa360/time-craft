// React Query hooks for calendar and meeting scheduling
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import type { CalendarEvent, MeetingRequest, TimeSlot } from '../../types';
import { toast } from 'react-hot-toast';

// Query keys
export const calendarKeys = {
  all: ['calendar'] as const,
  events: () => [...calendarKeys.all, 'events'] as const,
  eventsList: (filters: Record<string, any>) => [...calendarKeys.events(), { filters }] as const,
  event: (id: string) => [...calendarKeys.events(), id] as const,
  meetings: () => [...calendarKeys.all, 'meetings'] as const,
  meetingRequests: () => [...calendarKeys.meetings(), 'requests'] as const,
  availability: (id: string, timeSlot: TimeSlot) => [...calendarKeys.meetings(), id, 'availability', timeSlot] as const,
};

// Calendar events query
export const useCalendarEventsQuery = (params?: {
  start?: number;
  end?: number;
  type?: string;
}) => {
  return useQuery({
    queryKey: calendarKeys.eventsList(params || {}),
    queryFn: () => apiClient.getEvents(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Meeting requests query
export const useMeetingRequestsQuery = () => {
  return useQuery({
    queryKey: calendarKeys.meetingRequests(),
    queryFn: () => apiClient.getMeetingRequests(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Check availability query
export const useCheckAvailabilityQuery = (id: string, timeSlot: TimeSlot) => {
  return useQuery({
    queryKey: calendarKeys.availability(id, timeSlot),
    queryFn: () => apiClient.checkAvailability(id, timeSlot),
    enabled: !!id && !!timeSlot.start && !!timeSlot.end,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Create event mutation
export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CalendarEvent>) => apiClient.createEvent(data),
    onSuccess: () => {
      toast.success('📅 Event created!');
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() });
    },
    onError: () => {
      toast.error('Failed to create event');
    },
  });
};

// Update event mutation
export const useUpdateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CalendarEvent> }) =>
      apiClient.updateEvent(id, data),
    onSuccess: () => {
      toast.success('Event updated!');
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() });
    },
    onError: () => {
      toast.error('Failed to update event');
    },
  });
};

// Delete event mutation
export const useDeleteEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteEvent(id),
    onSuccess: () => {
      toast.success('Event deleted');
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() });
    },
    onError: () => {
      toast.error('Failed to delete event');
    },
  });
};

// Create meeting request mutation
export const useCreateMeetingRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<MeetingRequest, 'id' | 'suggestedSlots' | 'status' | 'createdBy' | 'createdAt'>) =>
      apiClient.createMeetingRequest(data),
    onSuccess: () => {
      toast.success('🤝 Meeting request sent!');
      queryClient.invalidateQueries({ queryKey: calendarKeys.meetingRequests() });
    },
    onError: () => {
      toast.error('Failed to create meeting request');
    },
  });
};

// Respond to meeting mutation
export const useRespondToMeetingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { response: 'accept' | 'decline'; selectedSlot?: TimeSlot } }) =>
      apiClient.respondToMeeting(id, data),
    onSuccess: (_, { data }) => {
      const message = data.response === 'accept' ? '✅ Meeting accepted!' : '❌ Meeting declined';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: calendarKeys.meetingRequests() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() });
    },
    onError: () => {
      toast.error('Failed to respond to meeting');
    },
  });
};

// Reschedule meeting mutation
export const useRescheduleMeetingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newTimeSlot }: { id: string; newTimeSlot: TimeSlot }) =>
      apiClient.rescheduleMeeting(id, newTimeSlot),
    onSuccess: () => {
      toast.success('📅 Meeting rescheduled!');
      queryClient.invalidateQueries({ queryKey: calendarKeys.meetingRequests() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() });
    },
    onError: () => {
      toast.error('Failed to reschedule meeting');
    },
  });
};

// Cancel meeting mutation
export const useCancelMeetingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.cancelMeeting(id),
    onSuccess: () => {
      toast.info('Meeting cancelled');
      queryClient.invalidateQueries({ queryKey: calendarKeys.meetingRequests() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() });
    },
    onError: () => {
      toast.error('Failed to cancel meeting');
    },
  });
};

// Composite export for convenience
export const useCalendarQueries = () => ({
  useCalendarEventsQuery,
  useMeetingRequestsQuery,
  useCheckAvailabilityQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useCreateMeetingRequestMutation,
  useRespondToMeetingMutation,
  useRescheduleMeetingMutation,
  useCancelMeetingMutation,
});