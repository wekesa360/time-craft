import React, { useState, useRef, useEffect } from 'react';
import { useUploadVoiceNoteMutation } from '../../../hooks/queries/useVoiceQueries';
import { useVoiceStore } from '../../../stores/voice';

export const VoiceRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const uploadMutation = useUploadVoiceNoteMutation();
  const { settings } = useVoiceStore();

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: settings.noiseReduction,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;

      // Set up audio analysis for visual feedback
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Start visual feedback
      updateAudioLevel();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
          type: 'audio/webm'
        });
        
        if (settings.autoTranscribe) {
          uploadMutation.mutate({ 
            audioFile, 
            language: settings.language 
          });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  const updateAudioLevel = () => {
    if (analyserRef.current && isRecording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255);
      
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Voice Recorder
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Record voice notes that will be automatically transcribed and analyzed
        </p>
      </div>

      {/* Recording Interface */}
      <div className="bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-8 mb-6">
        {/* Audio Level Visualizer */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div 
              className={`w-32 h-32 rounded-full border-4 transition-all duration-200 ${
                isRecording 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              }`}
              style={{
                transform: `scale(${1 + audioLevel * 0.3})`,
                boxShadow: isRecording ? `0 0 ${20 + audioLevel * 30}px rgba(239, 68, 68, 0.4)` : 'none'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">
                  {isRecording ? '🔴' : '🎤'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recording Timer */}
        {isRecording && (
          <div className="text-center mb-6">
            <div className="text-3xl font-mono font-bold text-red-600 dark:text-red-400">
              {formatTime(recordingTime)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Recording in progress...
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={uploadMutation.isPending}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"
            >
              <span>🎤</span>
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"
            >
              <span>⏹️</span>
              Stop Recording
            </button>
          )}
        </div>
      </div>

      {/* Upload Status */}
      {uploadMutation.isPending && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-blue-800 dark:text-blue-200">
              Processing voice note...
            </span>
          </div>
        </div>
      )}

      {/* Settings Quick Access */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          Quick Settings
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Language:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {settings.language.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Auto Transcribe:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {settings.autoTranscribe ? '✅' : '❌'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Commands:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {settings.commandsEnabled ? '✅' : '❌'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Noise Reduction:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {settings.noiseReduction ? '✅' : '❌'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};