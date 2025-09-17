import React, { useState } from 'react';
import type { AvailabilitySlot } from '../../../types';

export const AvailabilityPicker: React.FC = () => {
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([
    // Default business hours
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', timezone: 'America/New_York' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', timezone: 'America/New_York' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', timezone: 'America/New_York' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', timezone: 'America/New_York' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', timezone: 'America/New_York' },
  ]);

  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [hasChanges, setHasChanges] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
  ];

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const time = `${hour.toString().padStart(2, '0')}:${minute}`;
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return {
      value: time,
      label: `${displayHour}:${minute} ${ampm}`
    };
  });

  const updateAvailability = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailabilitySlots(prev => {
      const existing = prev.find(slot => slot.dayOfWeek === dayOfWeek);
      if (existing) {
        return prev.map(slot =>
          slot.dayOfWeek === dayOfWeek
            ? { ...slot, [field]: value }
            : slot
        );
      } else {
        return [...prev, {
          dayOfWeek,
          startTime: field === 'startTime' ? value : '09:00',
          endTime: field === 'endTime' ? value : '17:00',
          timezone: selectedTimezone
        }];
      }
    });
    setHasChanges(true);
  };

  const toggleDayAvailability = (dayOfWeek: number) => {
    setAvailabilitySlots(prev => {
      const existing = prev.find(slot => slot.dayOfWeek === dayOfWeek);
      if (existing) {
        return prev.filter(slot => slot.dayOfWeek !== dayOfWeek);
      } else {
        return [...prev, {
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
          timezone: selectedTimezone
        }];
      }
    });
    setHasChanges(true);
  };

  const handleTimezoneChange = (newTimezone: string) => {
    setSelectedTimezone(newTimezone);
    setAvailabilitySlots(prev =>
      prev.map(slot => ({ ...slot, timezone: newTimezone }))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    // In a real app, this would save to the backend
    console.log('Saving availability:', availabilitySlots);
    setHasChanges(false);
    alert('Availability settings saved!');
  };

  const handleReset = () => {
    setAvailabilitySlots([
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', timezone: selectedTimezone },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', timezone: selectedTimezone },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', timezone: selectedTimezone },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', timezone: selectedTimezone },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', timezone: selectedTimezone },
    ]);
    setHasChanges(false);
  };

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return availabilitySlots.find(slot => slot.dayOfWeek === dayOfWeek);
  };

  const getTotalHoursPerWeek = () => {
    return availabilitySlots.reduce((total, slot) => {
      const start = new Date(`2000-01-01T${slot.startTime}:00`);
      const end = new Date(`2000-01-01T${slot.endTime}:00`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Availability Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Set your weekly availability for AI-powered meeting scheduling
        </p>
      </div>

      {/* Timezone Selection */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🌍 Timezone
        </h3>
        <select
          value={selectedTimezone}
          onChange={(e) => handleTimezoneChange(e.target.value)}
          className="w-full md:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {timezones.map(tz => (
            <option key={tz} value={tz}>
              {tz.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📅 Weekly Schedule
        </h3>
        
        <div className="space-y-4">
          {daysOfWeek.map(day => {
            const availability = getAvailabilityForDay(day.value);
            const isAvailable = !!availability;

            return (
              <div key={day.value} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                {/* Day Toggle */}
                <div className="flex items-center gap-3 w-32">
                  <button
                    onClick={() => toggleDayAvailability(day.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isAvailable
                        ? 'bg-blue-600'
                        : 'bg-gray-200 dark:bg-gray-500'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isAvailable ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`font-medium ${
                    isAvailable 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {day.label}
                  </span>
                </div>

                {/* Time Selection */}
                {isAvailable && availability && (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-300">From:</label>
                      <select
                        value={availability.startTime}
                        onChange={(e) => updateAvailability(day.value, 'startTime', e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      >
                        {timeSlots.map(slot => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-300">To:</label>
                      <select
                        value={availability.endTime}
                        onChange={(e) => updateAvailability(day.value, 'endTime', e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      >
                        {timeSlots.map(slot => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {(() => {
                        const start = new Date(`2000-01-01T${availability.startTime}:00`);
                        const end = new Date(`2000-01-01T${availability.endTime}:00`);
                        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        return `${hours}h`;
                      })()}
                    </div>
                  </div>
                )}

                {!isAvailable && (
                  <div className="flex-1 text-gray-500 dark:text-gray-400 text-sm">
                    Not available
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ⚡ Quick Presets
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setAvailabilitySlots([
                { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', timezone: selectedTimezone },
                { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', timezone: selectedTimezone },
                { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', timezone: selectedTimezone },
                { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', timezone: selectedTimezone },
                { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', timezone: selectedTimezone },
              ]);
              setHasChanges(true);
            }}
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
          >
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              🏢 Business Hours
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Mon-Fri, 9 AM - 5 PM
            </div>
          </button>

          <button
            onClick={() => {
              setAvailabilitySlots([
                { dayOfWeek: 1, startTime: '10:00', endTime: '14:00', timezone: selectedTimezone },
                { dayOfWeek: 2, startTime: '10:00', endTime: '14:00', timezone: selectedTimezone },
                { dayOfWeek: 3, startTime: '10:00', endTime: '14:00', timezone: selectedTimezone },
                { dayOfWeek: 4, startTime: '10:00', endTime: '14:00', timezone: selectedTimezone },
                { dayOfWeek: 5, startTime: '10:00', endTime: '14:00', timezone: selectedTimezone },
              ]);
              setHasChanges(true);
            }}
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
          >
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              ⏰ Core Hours
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Mon-Fri, 10 AM - 2 PM
            </div>
          </button>

          <button
            onClick={() => {
              setAvailabilitySlots([
                { dayOfWeek: 1, startTime: '08:00', endTime: '20:00', timezone: selectedTimezone },
                { dayOfWeek: 2, startTime: '08:00', endTime: '20:00', timezone: selectedTimezone },
                { dayOfWeek: 3, startTime: '08:00', endTime: '20:00', timezone: selectedTimezone },
                { dayOfWeek: 4, startTime: '08:00', endTime: '20:00', timezone: selectedTimezone },
                { dayOfWeek: 5, startTime: '08:00', endTime: '20:00', timezone: selectedTimezone },
                { dayOfWeek: 6, startTime: '10:00', endTime: '16:00', timezone: selectedTimezone },
                { dayOfWeek: 0, startTime: '10:00', endTime: '16:00', timezone: selectedTimezone },
              ]);
              setHasChanges(true);
            }}
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
          >
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              🌟 Extended Hours
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              7 days, flexible hours
            </div>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          📊 Availability Summary
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-blue-800 dark:text-blue-200 font-medium">Available Days</div>
            <div className="text-blue-600 dark:text-blue-300">{availabilitySlots.length} days</div>
          </div>
          <div>
            <div className="text-blue-800 dark:text-blue-200 font-medium">Total Hours/Week</div>
            <div className="text-blue-600 dark:text-blue-300">{getTotalHoursPerWeek()} hours</div>
          </div>
          <div>
            <div className="text-blue-800 dark:text-blue-200 font-medium">Timezone</div>
            <div className="text-blue-600 dark:text-blue-300">{selectedTimezone.replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          💾 Save Availability
        </button>
        
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 disabled:bg-gray-200 dark:disabled:bg-gray-700 transition-colors"
        >
          🔄 Reset to Default
        </button>
      </div>

      {hasChanges && (
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ You have unsaved changes. Don't forget to save your availability settings!
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          💡 Availability Tips
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Set realistic availability windows to avoid scheduling conflicts</li>
          <li>• Consider buffer time between meetings for preparation and breaks</li>
          <li>• Update your availability regularly to reflect schedule changes</li>
          <li>• The AI will use these settings to suggest optimal meeting times</li>
        </ul>
      </div>
    </div>
  );
};