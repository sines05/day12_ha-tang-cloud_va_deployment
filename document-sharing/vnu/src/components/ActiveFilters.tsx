import React from 'react';
import type { AdvancedSearchFilters } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface ActiveFiltersProps {
  filters: AdvancedSearchFilters;
  onClearFilter: (filterToClear: keyof AdvancedSearchFilters) => void;
}

const filterLabels: Record<keyof AdvancedSearchFilters, string> = {
  lecturer: 'Lecturer',
  course: 'Course',
  content: 'Content',
};

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({ filters, onClearFilter }) => {
  const activeFilterEntries = Object.entries(filters).filter(([_, value]) => value) as [keyof AdvancedSearchFilters, string][];

  if (activeFilterEntries.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap border-2 border-dashed border-gray-400 p-3">
      <span className="font-bold uppercase text-sm">Active Filters:</span>
      {activeFilterEntries.map(([key, value]) => (
        <div 
          key={key} 
          className="flex items-center gap-1.5 bg-yellow-300 border-2 border-black px-2 py-1 text-sm font-bold"
        >
          <span>{filterLabels[key]}: "{value}"</span>
          <button 
            onClick={() => onClearFilter(key)} 
            className="hover:text-red-600"
            aria-label={`Remove ${filterLabels[key]} filter`}
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
};