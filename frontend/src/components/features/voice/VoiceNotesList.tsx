import React, { useState } from 'react';
import { useVoiceNotesQuery } from '../../../hooks/queries/useVoiceQueries';
import type { VoiceNote } from '../../../types';

export const VoiceNotesList: React.FC = () => {
  const [filters, setFilters] = useState({
    limit: 20,
    offset: 0,
    startDate: undefined as number | undefined,
    endDate: undefined as number | undefined,
  });
  const [selectedNote, setSelectedNote] = useState<VoiceNote | null>(null);

  const { data, isLoading, error } = useVoiceNotesQuery(filters);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error-light text-error dark:bg-error/20 dark:text-error-light';
      case 'medium':
        return 'bg-warning-light text-warning dark:bg-warning/20 dark:text-warning-light';
      case 'low':
        return 'bg-success-light text-success dark:bg-success/20 dark:text-success-light';
      default:
        return 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😔';
      default:
        return '😐';
    }
  };

  const playAudio = async (note: VoiceNote) => {
    try {
      const audio = new Audio(note.audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-muted-foreground dark:text-muted-foreground">Loading voice notes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-error dark:text-error-light mb-2">❌ Error loading voice notes</div>
        <p className="text-muted-foreground dark:text-muted-foreground">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground dark:text-white">
            Voice Notes
          </h2>
          <p className="text-muted-foreground dark:text-muted-foreground">
            {data?.total || 0} notes found
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex gap-2">
          <input
            type="date"
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              startDate: e.target.value ? new Date(e.target.value).getTime() : undefined 
            }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white"
          />
          <input
            type="date"
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              endDate: e.target.value ? new Date(e.target.value).getTime() : undefined 
            }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white"
          />
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.notes.map((note) => (
          <div
            key={note.id}
            className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => setSelectedNote(note)}
          >
            {/* Note Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getSentimentEmoji(note.analysis.sentiment)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(note.analysis.priority)}`}>
                  {note.analysis.priority}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(note);
                }}
                className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              >
                ▶️
              </button>
            </div>

            {/* Transcription Preview */}
            <div className="mb-3">
              <p className="text-foreground dark:text-white text-sm line-clamp-3">
                {note.transcription}
              </p>
            </div>

            {/* Confidence & Duration */}
            <div className="flex justify-between items-center text-xs text-muted-foreground dark:text-muted-foreground mb-3">
              <span>Confidence: {Math.round(note.confidence * 100)}%</span>
              <span>{formatDuration(note.duration)}</span>
            </div>

            {/* Action Items */}
            {note.analysis.actionItems.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-muted-foreground dark:text-muted-foreground mb-1">
                  Action Items:
                </div>
                <div className="flex flex-wrap gap-1">
                  {note.analysis.actionItems.slice(0, 2).map((item, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-info-light dark:bg-info/20 text-info dark:text-info-light text-xs rounded"
                    >
                      {item}
                    </span>
                  ))}
                  {note.analysis.actionItems.length > 2 && (
                    <span className="px-2 py-1 bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground text-xs rounded">
                      +{note.analysis.actionItems.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Date */}
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">
              {formatDate(note.createdAt)}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data?.notes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎤</div>
          <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
            No voice notes yet
          </h3>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Start recording to see your voice notes here
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > filters.limit && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
            disabled={filters.offset === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:bg-muted hover:bg-purple-700 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-muted-foreground dark:text-muted-foreground">
            {Math.floor(filters.offset / filters.limit) + 1} of {Math.ceil(data.total / filters.limit)}
          </span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
            disabled={filters.offset + filters.limit >= data.total}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:bg-muted hover:bg-purple-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-muted rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-foreground dark:text-white">
                  Voice Note Details
                </h3>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-muted-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                    Transcription
                  </label>
                  <p className="text-foreground dark:text-white bg-muted dark:bg-muted p-3 rounded-lg">
                    {selectedNote.transcription}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">
                      Confidence
                    </label>
                    <p className="text-foreground dark:text-white">
                      {Math.round(selectedNote.confidence * 100)}%
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">
                      Duration
                    </label>
                    <p className="text-foreground dark:text-white">
                      {formatDuration(selectedNote.duration)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                    Analysis
                  </label>
                  <div className="bg-muted dark:bg-muted p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Sentiment:</span>
                      <span className="flex items-center gap-1">
                        {getSentimentEmoji(selectedNote.analysis.sentiment)}
                        {selectedNote.analysis.sentiment}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Priority:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(selectedNote.analysis.priority)}`}>
                        {selectedNote.analysis.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedNote.analysis.actionItems.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                      Action Items
                    </label>
                    <ul className="space-y-1">
                      {selectedNote.analysis.actionItems.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-foreground dark:text-white">
                          <span className="w-2 h-2 bg-info-light0 rounded-full"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => playAudio(selectedNote)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    ▶️ Play Audio
                  </button>
                  <button
                    onClick={() => setSelectedNote(null)}
                    className="px-4 py-2 bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};