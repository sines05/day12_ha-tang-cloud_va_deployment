import React from 'react';

interface Suggestion {
  id: number | string;
  name: string;
}

interface Suggestions {
  lecturers: Suggestion[];
  courses: Suggestion[];
}

interface SearchSuggestionsProps {
  suggestions: Suggestions;
  onSuggestionClick: (suggestionText: string) => void;
  searchTerm: string;
}

const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <strong key={i}>{part}</strong>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ suggestions, onSuggestionClick, searchTerm }) => {
  const hasSuggestions = suggestions.lecturers.length > 0 || suggestions.courses.length > 0;

  if (!hasSuggestions) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 z-10 bg-white border-2 border-t-0 border-black mt-[-2px]">
      <div className="max-h-80 overflow-y-auto">
        {suggestions.lecturers.length > 0 && (
          <div>
            <h4 className="text-xs uppercase font-bold text-gray-500 p-2 bg-gray-100 border-b-2 border-black">Lecturers</h4>
            <ul>
              {suggestions.lecturers.map(lecturer => (
                <li key={`lec-${lecturer.id}`}>
                  <button
                    onClick={() => onSuggestionClick(lecturer.name)}
                    className="w-full text-left p-2 hover:bg-yellow-300 text-sm"
                  >
                    <HighlightedText text={lecturer.name} highlight={searchTerm} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {suggestions.courses.length > 0 && (
          <div>
            <h4 className="text-xs uppercase font-bold text-gray-500 p-2 bg-gray-100 border-t-2 border-black">Courses</h4>
            <ul>
              {suggestions.courses.map(course => (
                <li key={`course-${course.id}`}>
                  <button
                    onClick={() => onSuggestionClick(course.name)}
                    className="w-full text-left p-2 hover:bg-yellow-300 text-sm"
                  >
                    <HighlightedText text={course.name} highlight={searchTerm} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
