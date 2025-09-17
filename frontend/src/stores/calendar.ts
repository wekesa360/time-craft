// Calendar and meeting scheduling store with Zustand
import { create } from 'zustand';
import { apiClient } from '../lib/api';
import type { CalendarEvent, MeetingRequest, TimeSlot } from '../types';

interface CalendarState {
  events: CalendarEvent[];
  meetingRequests: MeetingRequest[];
  isLoading: boolean;
  error: string | null;
}

interface CalendarStore extends CalendarState {
  // Actions
  fetchEvents: (params?: any) => Promise<void>;
  createEvent: (event: Partial<CalendarEvent>) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  createMeetingRequest: (request: Omit<MeetingRequest, 'id' | 'suggestedSlots' | 'status' | 'createdBy' | 'createdAt'>) => Promise<void>;
  fetchMeetingRequests: () => Promise<void>;
  respondToMeeting: (id: string, response: 'accept' | 'decline', selectedSlot?: TimeSlot) => Promise<void>;
  rescheduleMeeting: (id: string, newTimeSlot: TimeSlot) => Promise<void>;
  cancelMeeting: (id: string) => Promise<void>;
  checkAvailability: (id: string, timeSlot: TimeSlot) => Promise<{ available: boolean; conflicts: string[] }>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  // Initial state
  events: [],
  meetingRequests: [],
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchEvents: async (params) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.getEvents(params);
      set({ events: response.data || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch events',
        isLoading: false,
      });
    }
  },

  createEvent: async (eventData) => {
    try {
      set({ isLoading: true, error: null });
      const event = await apiClient.createEvent(eventData);
      const { events } = get();
      set({
        events: [...events, event],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create event',
        isLoading: false,
      });
      throw error;
    }
  },

  updateEvent: async (id, eventData) => {
    try {
      set({ isLoading: true, error: null });
      const event = await apiClient.updateEvent(id, eventData);
      const { events } = get();
      set({
        events: events.map(e => e.id === id ? event : e),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update event',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteEvent: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.deleteEvent(id);
      const { events } = get();
      set({
        events: events.filter(e => e.id !== id),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete event',
        isLoading: false,
      });
      throw error;
    }
  },

  createMeetingRequest: async (requestData) => {
    try {
      set({ isLoading: true, error: null });
      const meetingRequest = await apiClient.createMeetingRequest(requestData);
      const { meetingRequests } = get();
      set({
        meetingRequests: [...meetingRequests, meetingRequest],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create meeting request',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchMeetingRequests: async () => {
    try {
      set({ isLoading: true, error: null });
      const meetingRequests = await apiClient.getMeetingRequests();
      set({ meetingRequests, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch meeting requests',
        isLoading: false,
      });
    }
  },

  respondToMeeting: async (id, response, selectedSlot) => {
    try {
      set({ isLoading: true, error: null });
      const result = await apiClient.respondToMeeting(id, { response, selectedSlot });
      
      // Update meeting request status
      const { meetingRequests } = get();
      set({
        meetingRequests: meetingRequests.map(req => 
          req.id === id 
            ? { ...req, status: result.meetingStatus as any }
            : req
        ),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to respond to meeting',
        isLoading: false,
      });
      throw error;
    }
  },

  rescheduleMeeting: async (id, newTimeSlot) => {
    try {
      set({ isLoading: true, error: null });
      const meeting = await apiClient.rescheduleMeeting(id, newTimeSlot);
      const { meetingRequests } = get();
      set({
        meetingRequests: meetingRequests.map(req => 
          req.id === id ? meeting : req
        ),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reschedule meeting',
        isLoading: false,
      });
      throw error;
    }
  },

  cancelMeeting: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.cancelMeeting(id);
      const { meetingRequests } = get();
      set({
        meetingRequests: meetingRequests.filter(req => req.id !== id),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to cancel meeting',
        isLoading: false,
      });
      throw error;
    }
  },

  checkAvailability: async (id, timeSlot) => {
    try {
      const result = await apiClient.checkAvailability(id, timeSlot);
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to check availability',
      });
      throw error;
    }
  },
}));