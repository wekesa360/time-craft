import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

interface TabSwitcherProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          disabled={tab.disabled}
          className={`px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 ${
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20'
              : 'bg-card border border-border text-foreground hover:bg-muted hover:border-primary/50'
          } ${
            tab.disabled 
              ? 'opacity-50 cursor-not-allowed hover:scale-100' 
              : ''
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabSwitcher;