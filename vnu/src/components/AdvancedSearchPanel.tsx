import React from 'react';
import type { AdvancedSearchFilters } from '../types';

interface AdvancedSearchPanelProps {
  filters: AdvancedSearchFilters;
  onFilterChange: (filters: Partial<AdvancedSearchFilters>) => void;
  onClear: () => void;
  onFind: () => void; // New prop
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({ filters, onFilterChange, onClear, onFind }) => {
  const handleInputChange = (field: keyof AdvancedSearchFilters, value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <div className="p-4 bg-gray-100 border-2 border-black mb-6" style={{ boxShadow: '4px 4px 0px #000' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="lecturerFilter" className="block font-bold mb-1 uppercase text-sm">Lecturer Name</label>
          <input
            id="lecturerFilter"
            type="text"
            placeholder="e.g., Dr. Nguyen Van A"
            value={filters.lecturer}
            onChange={(e) => handleInputChange('lecturer', e.target.value)}
            className="w-full p-2 bg-white border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
          />
        </div>
        <div>
          <label htmlFor="courseFilter" className="block font-bold mb-1 uppercase text-sm">Course Name</label>
          <input
            id="courseFilter"
            type="text"
            placeholder="e.g., Data Structures"
            value={filters.course}
            onChange={(e) => handleInputChange('course', e.target.value)}
            className="w-full p-2 bg-white border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
          />
        </div>
        <div>
          <label htmlFor="contentFilter" className="block font-bold mb-1 uppercase text-sm">Review Content</label>
          <input
            id="contentFilter"
            type="text"
            placeholder="e.g., excellent professor"
            value={filters.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            className="w-full p-2 bg-white border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2"> {/* Added flex-col sm:flex-row */}
        <button 
          onClick={onClear} 
          className="w-full sm:w-auto p-2 bg-white border-2 border-black font-bold uppercase text-sm hover:bg-red-500 hover:text-white"
        >
            Clear Filters
        </button>
        <button // New Find button
          onClick={onFind} 
          className="w-full sm:w-auto p-2 bg-black text-white border-2 border-black font-bold uppercase text-sm hover:bg-gray-800"
        >
            Find
        </button>
      </div>
    </div>
  );
};