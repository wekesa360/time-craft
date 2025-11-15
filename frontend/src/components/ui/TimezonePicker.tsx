import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Clock, ChevronDown } from 'lucide-react';

interface TimezonePickerProps {
  value: string;
  onChange: (timezone: string) => void;
  className?: string;
}

// Get all available timezones
const getAllTimezones = (): string[] => {
  try {
    // Use Intl.supportedValuesOf if available (modern browsers)
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      return Intl.supportedValuesOf('timeZone');
    }
    // Fallback to common timezones
    return [
      'UTC',
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Phoenix', 'America/Anchorage', 'America/Honolulu',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
      'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Vienna', 'Europe/Zurich',
      'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore',
      'Asia/Dubai', 'Asia/Kolkata', 'Asia/Seoul', 'Asia/Bangkok',
      'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane',
      'Pacific/Auckland', 'Pacific/Honolulu',
      'Africa/Cairo', 'Africa/Johannesburg',
      'America/Sao_Paulo', 'America/Mexico_City', 'America/Buenos_Aires'
    ];
  } catch {
    return ['UTC'];
  }
};

// Format timezone for display
const formatTimezone = (tz: string): string => {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || '';
    
    // Replace underscores with spaces and format nicely
    const displayName = tz.replace(/_/g, ' ').replace(/\//g, ' / ');
    return `${displayName} (${timeZoneName})`;
  } catch {
    return tz.replace(/_/g, ' ').replace(/\//g, ' / ');
  }
};

export const TimezonePicker: React.FC<TimezonePickerProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allTimezones = useMemo(() => getAllTimezones(), []);
  
  const filteredTimezones = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTimezones;
    }
    
    const query = searchQuery.toLowerCase();
    return allTimezones.filter(tz => {
      const formatted = formatTimezone(tz).toLowerCase();
      const tzLower = tz.toLowerCase();
      return formatted.includes(query) || tzLower.includes(query);
    });
  }, [allTimezones, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (timezone: string) => {
    onChange(timezone);
    setIsOpen(false);
    setSearchQuery('');
  };

  const displayValue = value ? formatTimezone(value) : 'Select timezone...';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-background border border-border rounded-lg text-foreground hover:bg-primary/5 hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate text-left">{displayValue}</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-hidden flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search timezones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Timezone list */}
          <div className="overflow-y-auto flex-1">
            {filteredTimezones.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No timezones found
              </div>
            ) : (
              <div className="py-1">
                {filteredTimezones.map((tz) => {
                  const isSelected = tz === value;
                  return (
                    <button
                      key={tz}
                      type="button"
                      onClick={() => handleSelect(tz)}
                      className={`w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{formatTimezone(tz)}</span>
                        {isSelected && (
                          <span className="text-primary">✓</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

