import React, { useState } from 'react';
import type { AvailabilitySlot } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Availability Settings
        </h2>
        <p className="text-lg text-muted-foreground">
          Set your weekly availability for AI-powered meeting scheduling
        </p>
      </div>

      {/* Timezone Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Timezone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedTimezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full md:w-auto px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>
                {tz.replace('_', ' ')}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {daysOfWeek.map(day => {
              const availability = getAvailabilityForDay(day.value);
              const isAvailable = !!availability;

              return (
                <div key={day.value} className="flex items-center gap-4 p-4 bg-muted/50 border border-border/50 rounded-xl">
                  {/* Day Toggle */}
                  <div className="flex items-center gap-3 w-32">
                    <button
                      onClick={() => toggleDayAvailability(day.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                        isAvailable
                          ? 'bg-primary shadow-lg'
                          : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          isAvailable ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`font-medium ${
                      isAvailable 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      {day.label}
                    </span>
                  </div>

                  {/* Time Selection */}
                  {isAvailable && availability && (
                    <div className="flex items-center gap-6 flex-1">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-foreground min-w-[40px]">From:</label>
                        <select
                          value={availability.startTime}
                          onChange={(e) => updateAvailability(day.value, 'startTime', e.target.value)}
                          className="px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors min-w-[120px]"
                        >
                          {timeSlots.map(slot => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-foreground min-w-[25px]">To:</label>
                        <select
                          value={availability.endTime}
                          onChange={(e) => updateAvailability(day.value, 'endTime', e.target.value)}
                          className="px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors min-w-[120px]"
                        >
                          {timeSlots.map(slot => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="px-3 py-2 bg-primary/10 text-primary text-sm font-bold rounded-xl border border-primary/20">
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
                    <div className="flex-1 text-muted-foreground text-sm">
                      Not available
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Quick Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              className="p-4 border border-border rounded-xl hover:bg-muted hover:border-primary/50 transition-all hover:scale-105 text-left"
            >
              <div className="font-bold text-foreground mb-2">Business Hours</div>
              <div className="text-sm text-muted-foreground">
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
              className="p-4 border border-border rounded-xl hover:bg-muted hover:border-primary/50 transition-all hover:scale-105 text-left"
            >
              <div className="font-bold text-foreground mb-2">Core Hours</div>
              <div className="text-sm text-muted-foreground">
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
              className="p-4 border border-border rounded-xl hover:bg-muted hover:border-primary/50 transition-all hover:scale-105 text-left"
            >
              <div className="font-bold text-foreground mb-2">Extended Hours</div>
              <div className="text-sm text-muted-foreground">
                7 days, flexible hours
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-bold text-primary mb-4 text-lg">
            Availability Summary
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{availabilitySlots.length}</div>
              <div className="text-primary font-medium">Available Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{getTotalHoursPerWeek()}</div>
              <div className="text-primary font-medium">Total Hours/Week</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-primary mb-1">{selectedTimezone.replace('_', ' ')}</div>
              <div className="text-primary font-medium">Timezone</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all hover:scale-105 font-semibold shadow-lg disabled:hover:scale-100"
        >
          Save Availability
        </button>
        
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="px-8 py-3 bg-muted text-muted-foreground rounded-2xl hover:bg-muted/80 disabled:bg-muted/50 transition-all hover:scale-105 font-semibold disabled:hover:scale-100"
        >
          Reset to Default
        </button>
      </div>

      {hasChanges && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-sm text-amber-700">
              You have unsaved changes. Don't forget to save your availability settings!
            </p>
          </CardContent>
        </Card>
      )}


    </div>
  );
};