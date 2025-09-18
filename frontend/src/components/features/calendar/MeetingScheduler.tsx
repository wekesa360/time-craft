import React, { useState } from 'react';
import { useCreateMeetingRequestMutation } from '../../../hooks/queries/useCalendarQueries';
import type { MeetingRequest, TimeSlot } from '../../../types';

const MeetingScheduler: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    participants: [] as string[],
    preferredTimeSlots: [] as TimeSlot[],
    meetingType: 'video_call' as const,
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
        meetingType: 'video_call',
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AI Meeting Scheduler
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Create smart meeting requests with AI-powered time slot suggestions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meeting Details */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📋 Meeting Details
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Project Review Meeting"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {getDurationOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Meeting agenda and details..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meeting Type
            </label>
            <div className="flex gap-4">
              {[
                { value: 'video_call', label: '📹 Video Call', icon: '📹' },
                { value: 'phone_call', label: '📞 Phone Call', icon: '📞' },
                { value: 'in_person', label: '🏢 In Person', icon: '🏢' },
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, meetingType: type.value as any }))}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.meetingType === type.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            👥 Participants
          </h3>
          
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              value={participantEmail}
              onChange={(e) => setParticipantEmail(e.target.value)}
              placeholder="Enter participant email"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddParticipant}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>

          {formData.participants.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Added Participants:
              </div>
              {formData.participants.map((email, index) => (
                <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <span className="text-gray-900 dark:text-white">{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(email)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preferred Time Slots */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ⏰ Preferred Time Slots
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddTimeSlot}
                disabled={!selectedDate || !selectedTime}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                Add Slot
              </button>
            </div>
          </div>

          {formData.preferredTimeSlots.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Preferred Time Slots:
              </div>
              {formData.preferredTimeSlots.map((slot, index) => (
                <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <span className="text-gray-900 dark:text-white">
                    {formatDateTime(slot.start)} - {formatDateTime(slot.end)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTimeSlot(index)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createMeetingMutation.isPending || !formData.title || formData.participants.length === 0 || formData.preferredTimeSlots.length === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-semibold"
          >
            {createMeetingMutation.isPending ? 'Creating...' : '🚀 Create Meeting Request'}
          </button>
        </div>
      </form>

      {/* AI Tips */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          🤖 AI Scheduling Tips
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Provide multiple time slot options for better AI optimization</li>
          <li>• The AI will analyze all participants' availability and suggest the best times</li>
          <li>• Conflict detection helps avoid scheduling overlaps</li>
          <li>• Meeting type affects suggested locations and preparation time</li>
        </ul>
      </div>
    </div>
  );
};

export default MeetingScheduler;