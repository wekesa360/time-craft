import React, { useState } from 'react';
import { useCreateMeetingRequestMutation } from '../../../hooks/queries/useCalendarQueries';
import type { MeetingRequest, TimeSlot } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';

const MeetingScheduler: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    participants: [] as string[],
    preferredTimeSlots: [] as TimeSlot[],
    meetingType: 'default' as const,
  });
  const [participantEmail, setParticipantEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const createMeetingMutation = useCreateMeetingRequestMutation();

  const handleAddParticipant = () => {
    if (participantEmail && !formData.participants.includes(participantEmail)) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, participantEmail]
      }));
      setParticipantEmail('');
    }
  };

  const handleRemoveParticipant = (email: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== email)
    }));
  };

  const handleAddTimeSlot = () => {
    if (selectedDate && selectedTime) {
      const date = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      
      const start = date.getTime();
      const end = start + (formData.duration * 60 * 1000);
      
      const newSlot: TimeSlot = { start, end };
      
      setFormData(prev => ({
        ...prev,
        preferredTimeSlots: [...prev.preferredTimeSlots, newSlot]
      }));
      
      setSelectedDate('');
      setSelectedTime('');
    }
  };

  const handleRemoveTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      preferredTimeSlots: prev.preferredTimeSlots.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || formData.participants.length === 0 || formData.preferredTimeSlots.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createMeetingMutation.mutateAsync(formData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        duration: 60,
        participants: [],
        preferredTimeSlots: [],
        meetingType: 'default',
      });
    } catch (error) {
      console.error('Error creating meeting request:', error);
    }
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDurationOptions = () => [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Schedule Meeting
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Create meeting requests and find the best time for everyone
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Meeting Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Meeting Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Project Review Meeting"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Duration
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  {getDurationOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Meeting agenda and details..."
                rows={4}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Meeting Type
              </label>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { value: 'default', label: 'Meeting' },
                  { value: 'video_conference', label: 'Video Conference' },
                  { value: 'phone_conference', label: 'Phone Conference' },
                  { value: 'appointment', label: 'Appointment' },
                ].map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, meetingType: type.value as any }))}
                    className={`px-4 py-3 rounded-xl border font-medium transition-all hover:scale-105 ${
                      formData.meetingType === type.value
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-2 ring-primary/20'
                        : 'bg-card text-foreground border-border hover:bg-muted hover:border-primary/50'
                    }`}
                  >
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <input
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder="Enter participant email"
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleAddParticipant}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all hover:scale-105 shadow-md"
              >
                Add
              </button>
            </div>

            {formData.participants.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">
                  Added Participants ({formData.participants.length}):
                </div>
                {formData.participants.map((email, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/50 p-4 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium text-sm">
                          {email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-foreground font-medium">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(email)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all hover:scale-110"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferred Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Preferred Time Slots</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddTimeSlot}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all hover:scale-105 shadow-md disabled:hover:scale-100"
                >
                  Add Slot
                </button>
              </div>
            </div>

            {formData.preferredTimeSlots.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">
                  Preferred Time Slots ({formData.preferredTimeSlots.length}):
                </div>
                {formData.preferredTimeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/50 p-4 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">{index + 1}</span>
                      </div>
                      <span className="text-foreground font-medium">
                        {formatDateTime(slot.start)} - {formatDateTime(slot.end)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTimeSlot(index)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all hover:scale-110"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={createMeetingMutation.isPending || !formData.title || formData.participants.length === 0 || formData.preferredTimeSlots.length === 0}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all hover:scale-105 shadow-lg disabled:hover:scale-100"
          >
            {createMeetingMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                Creating...
              </div>
            ) : (
              'Create Meeting Request'
            )}
          </button>
        </div>
      </form>


    </div>
  );
};

export default MeetingScheduler;