import React, { useState } from 'react';
import { 
  useMeetingRequestsQuery, 
  useRespondToMeetingMutation, 
  useRescheduleMeetingMutation,
  useCancelMeetingMutation 
} from '../../../hooks/queries/useCalendarQueries';
import type { MeetingRequest, TimeSlot } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';

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
        return 'bg-warning-light text-warning dark:bg-warning/20 dark:text-warning-light';
      case 'confirmed':
        return 'bg-success-light text-success dark:bg-success/20 dark:text-success-light';
      case 'cancelled':
        return 'bg-error-light text-error dark:bg-error/20 dark:text-error-light';
      default:
        return 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_responses':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getMeetingTypeText = (type: string) => {
    switch (type) {
      case 'video_conference':
        return 'Video Conference';
      case 'phone_conference':
        return 'Phone Conference';
      case 'appointment':
        return 'Appointment';
      case 'default':
        return 'Meeting';
      default:
        return 'Meeting';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-muted-foreground dark:text-muted-foreground">Loading meeting requests...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Meeting Requests
        </h2>
        <p className="text-lg text-muted-foreground">
          Manage your incoming and outgoing meeting requests
        </p>
      </div>

      {/* Requests List */}
      <div className="space-y-6">
        {requests && requests.length > 0 ? (
          requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-all hover:scale-[1.02]">
              <CardContent className="p-6">
                {/* Request Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-foreground">
                        {request.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                      <span className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                        {getMeetingTypeText(request.meetingType)}
                      </span>
                    </div>
                    
                    {request.description && (
                      <p className="text-muted-foreground mb-3">
                        {request.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>{request.duration} minutes</span>
                      <span>{request.participants.length} participants</span>
                      <span>Created {formatDateTime(request.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 ml-4">
                    {request.status === 'pending_responses' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRescheduleModal(true);
                          }}
                          className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all hover:scale-105 text-sm font-medium"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(request.id)}
                          disabled={cancelMutation.isPending}
                          className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl transition-all hover:scale-105 text-sm font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Participants */}
                <div className="mb-6">
                  <div className="text-sm font-medium text-foreground mb-3">
                    Participants ({request.participants.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {request.participants.map((participant, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border/50 rounded-xl text-sm"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium text-xs">
                            {participant.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-foreground">{participant}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Time Slots */}
                {request.suggestedSlots && request.suggestedSlots.length > 0 && (
                  <div className="mb-6">
                    <div className="text-sm font-medium text-foreground mb-3">
                      Suggested Time Slots:
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {request.suggestedSlots.map((slot, index) => (
                        <Card
                          key={index}
                          className="p-4 hover:shadow-md transition-all hover:scale-105"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-foreground">
                              Option {index + 1}
                            </span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                              {Math.round(slot.score * 100)}% match
                            </span>
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-3">
                            {formatDateTime(slot.start)} - {formatDateTime(slot.end)}
                          </div>
                          
                          {slot.conflicts.length > 0 && (
                            <div className="text-xs text-destructive mb-3">
                              {slot.conflicts.length} conflict(s)
                            </div>
                          )}

                          {request.status === 'pending_responses' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespond(request.id, 'accept', slot)}
                                disabled={respondMutation.isPending}
                                className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs hover:bg-primary/90 transition-all hover:scale-105 font-medium"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRespond(request.id, 'decline')}
                                disabled={respondMutation.isPending}
                                className="flex-1 px-3 py-2 bg-destructive text-destructive-foreground rounded-xl text-xs hover:bg-destructive/90 transition-all hover:scale-105 font-medium"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferred Time Slots */}
                {request.preferredTimeSlots && request.preferredTimeSlots.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-foreground mb-3">
                      Preferred Time Slots:
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {request.preferredTimeSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium border border-primary/20"
                        >
                          {formatDateTime(slot.start)} - {formatDateTime(slot.end)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                No meeting requests
              </h3>
              <p className="text-muted-foreground text-lg">
                Create a new meeting request to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Reschedule Meeting</CardTitle>
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedRequest(null);
                    setNewTimeSlot({ date: '', time: '' });
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                >
                  ✕
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Reschedule "{selectedRequest.title}"
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={newTimeSlot.date}
                    onChange={(e) => setNewTimeSlot(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Time
                  </label>
                  <input
                    type="time"
                    value={newTimeSlot.time}
                    onChange={(e) => setNewTimeSlot(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleReschedule(selectedRequest.id)}
                  disabled={rescheduleMutation.isPending || !newTimeSlot.date || !newTimeSlot.time}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all hover:scale-105 font-medium"
                >
                  {rescheduleMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      Rescheduling...
                    </div>
                  ) : (
                    'Reschedule'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedRequest(null);
                    setNewTimeSlot({ date: '', time: '' });
                  }}
                  className="px-4 py-3 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all hover:scale-105 font-medium"
                >
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};