import React from 'react';
import { SearchIcon } from './icons/SearchIcon';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch, placeholder = "Search..." }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full sm:w-auto">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        className="w-full sm:w-64 h-11 px-3 bg-white border-2 border-black appearance-none focus:outline-none placeholder:text-gray-500"
      />
      <button
        type="submit"
        className="h-11 px-3 flex items-center justify-center bg-yellow-300 border-y-2 border-r-2 border-black hover:bg-yellow-400 active:bg-yellow-500 transition-colors"
        aria-label="Search"
      >
        <SearchIcon />
      </button>
    </form>
  );
};