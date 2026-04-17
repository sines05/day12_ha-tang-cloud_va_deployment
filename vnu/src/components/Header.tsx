import React, { useState, useMemo, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SearchBar } from './SearchBar';
import { UploadIcon } from './icons/UploadIcon';
import { useAppContext } from '../contexts/AppContext';
import { SearchSuggestions } from './SearchSuggestions';
import { useOnClickOutside } from '../hooks/useClickOutside';

interface HeaderProps {
  onUploadClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onUploadClick }) => {
  const { searchInput, setSearchInput, executeSearch, setSearchTerm, holidayTheme } = useAppContext();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);

  useOnClickOutside(searchRef, () => setShowSuggestions(false));

  const isReviewsPage = location.pathname.startsWith('/reviews');

  const placeholder = isReviewsPage
    ? "Search lecturers, courses, reviews..."
    : "Search documents, courses...";
    
  const suggestions = { lecturers: [], courses: [] };

  const handleSuggestionClick = (suggestionText: string) => {
    setSearchInput(suggestionText);
    // Use executeSearch to ensure URL is updated and page is reset
    setTimeout(() => {
        executeSearch();
    }, 0);
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    executeSearch();
    setShowSuggestions(false);
  }

  const headerDecorations = useMemo(() => {
    if (!holidayTheme || !holidayTheme.decorations) return null;
    return holidayTheme.decorations
      .filter(d => d.target === 'header')
      .map((d, index) => {
        const DecorationComponent = d.component;
        return <DecorationComponent key={index} {...d.props} />;
      });
  }, [holidayTheme]);

  // Render a placeholder or loading state if theme is not yet loaded
  if (!holidayTheme) {
    return (
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 px-6 border-b-2 border-black gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase">
          <Link to="/" className="flex items-center relative">
            <div className="h-12 sm:h-16 w-48 bg-gray-200 animate-pulse" />
          </Link>
        </h1>
      </header>
    );
  }

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 px-6 border-b-2 border-black gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase">
        <Link to="/" className="flex items-center relative">
          <img src={holidayTheme.logo} alt="VNU Docs Hub Logo" className="h-12 sm:h-16 inline-block" />
          {headerDecorations}
        </Link>
      </h1>
      <div className="flex items-baseline gap-2 w-full sm:w-auto">
        {!isReviewsPage && (
          <div 
            ref={searchRef} 
            className="relative w-full sm:w-auto"
            onFocus={() => setShowSuggestions(true)}
          >
            <SearchBar value={searchInput} onChange={setSearchInput} onSearch={handleSearch} placeholder={placeholder} />
            {showSuggestions && searchInput.length > 0 && (
               <SearchSuggestions 
                  suggestions={suggestions} 
                  onSuggestionClick={handleSuggestionClick} 
                  searchTerm={searchInput} 
                />
            )}
          </div>
        )}
        <button
            onClick={onUploadClick}
            className="relative top-0.5 h-10 flex items-center justify-center gap-2 px-1 bg-blue-500 text-white border-2 border-black font-bold uppercase hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 ease-in-out hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
            style={{ boxShadow: '2px 2px 0px #000' }}
            aria-label="Upload document"
        >
            <UploadIcon />
            <span className="hidden md:inline">Upload</span>
        </button>
      </div>
    </header>
  );
}