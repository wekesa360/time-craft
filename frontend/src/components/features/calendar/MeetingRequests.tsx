import React, { useState } from 'react';
import { 
  useMeetingRequestsQuery, 
  useRespondToMeetingMutation, 
  useRescheduleMeetingMutation,
  useCancelMeetingMutation 
} from '../../../hooks/queries/useCalendarQueries';
import type { MeetingRequest, TimeSlot } from '../../../types';

export const MeetingRequests: React.FC = () => {
  const { data: requests, isLoading } = useMeetingRequestsQuery();
  const respondMutation = useRespondToMeetingMutation();
  const rescheduleMutation = useRescheduleMeetingMutation();
  const cancelMutation = useCancelMeetingMutation();

  const [selectedRequest, setSelectedRequest] = useState<MeetingRequest | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState<{ date: string; time: string }>({
    date: '',
    time: ''
  });

  const handleRespond = async (requestId: string, response: 'accept' | 'decline', selectedSlot?: TimeSlot) => {
    try {
      await respondMutation.mutateAsync({
        id: requestId,
        data: { response, selectedSlot }
      });
    } catch (error) {
      console.error('Error responding to meeting:', error);
    }
  };

  const handleReschedule = async (requestId: string) => {
    if (!newTimeSlot.date || !newTimeSlot.time) {
      alert('Please select a new date and time');
      return;
    }

    const date = new Date(newTimeSlot.date);
    const [hours, minutes] = newTimeSlot.time.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);

    const start = date.getTime();
    const duration = selectedRequest?.duration || 60;
    const end = start + (duration * 60 * 1000);

    try {
      await rescheduleMutation.mutateAsync({
        id: requestId,
        newTimeSlot: { start, end }
      });
      setShowRescheduleModal(false);
      setSelectedRequest(null);
      setNewTimeSlot({ date: '', time: '' });
    } catch (error) {
      console.error('Error rescheduling meeting:', error);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (confirm('Are you sure you want to cancel this meeting?')) {
      try {
        await cancelMutation.mutateAsync(requestId);
      } catch (error) {
        console.error('Error cancelling meeting:', error);
      }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_responses':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_responses':
        return '⏳';
      case 'confirmed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📅';
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video_call':
        return '📹';
      case 'phone_call':
        return '📞';
      case 'in_person':
        return '🏢';
      default:
        return '🤝';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading meeting requests...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Meeting Requests
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your incoming and outgoing meeting requests
        </p>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests && requests.length > 0 ? (
          requests.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Request Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {request.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)} {request.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {getMeetingTypeIcon(request.meetingType)} {request.meetingType.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {request.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {request.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>⏱️ {request.duration} minutes</span>
                    <span>👥 {request.participants.length} participants</span>
                    <span>📅 Created {formatDateTime(request.createdAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  {request.status === 'pending_responses' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRescheduleModal(true);
                        }}
                        className="px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm"
                      >
                        📅 Reschedule
                      </button>
                      <button
                        onClick={() => handleCancel(request.id)}
                        disabled={cancelMutation.isPending}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                      >
                        ❌ Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Participants:
                </div>
                <div className="flex flex-wrap gap-2">
                  {request.participants.map((participant, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                    >
                      {participant}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggested Time Slots */}
              {request.suggestedSlots && request.suggestedSlots.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI Suggested Time Slots:
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {request.suggestedSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-500"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Option {index + 1}
                          </span>
                          <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                            {Math.round(slot.score * 100)}% match
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {formatDateTime(slot.start)} - {formatDateTime(slot.end)}
                        </div>
                        
                        {slot.conflicts.length > 0 && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            ⚠️ {slot.conflicts.length} conflict(s)
                          </div>
                        )}

                        {request.status === 'pending_responses' && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleRespond(request.id, 'accept', slot)}
                              disabled={respondMutation.isPending}
                              className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              ✅ Accept
                            </button>
                            <button
                              onClick={() => handleRespond(request.id, 'decline')}
                              disabled={respondMutation.isPending}
                              className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                            >
                              ❌ Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Time Slots */}
              {request.preferredTimeSlots && request.preferredTimeSlots.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Time Slots:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {request.preferredTimeSlots.map((slot, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-sm"
                      >
                        {formatDateTime(slot.start)} - {formatDateTime(slot.end)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📬</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No meeting requests
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create a new meeting request to get started
            </p>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedRequest && (
        <div className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Reschedule Meeting
              </h3>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedRequest(null);
                  setNewTimeSlot({ date: '', time: '' });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Reschedule "{selectedRequest.title}"
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={newTimeSlot.date}
                    onChange={(e) => setNewTimeSlot(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Time
                  </label>
                  <input
                    type="time"
                    value={newTimeSlot.time}
                    onChange={(e) => setNewTimeSlot(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleReschedule(selectedRequest.id)}
                disabled={rescheduleMutation.isPending || !newTimeSlot.date || !newTimeSlot.time}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {rescheduleMutation.isPending ? 'Rescheduling...' : 'Reschedule'}
              </button>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedRequest(null);
                  setNewTimeSlot({ date: '', time: '' });
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};