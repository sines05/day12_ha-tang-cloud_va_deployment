import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

interface SidebarProps {
  basePath?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ basePath = '/documents' }) => {
  const { universities, selectedUniversityId, selectUniversity } = useAppContext();
  const navigate = useNavigate();
  const [isVnuDropdownOpen, setIsVnuDropdownOpen] = useState(true); // Open by default if all are VNU

  const handleSelectUniversity = (id: string | null) => {
    selectUniversity(id);
    if (id) {
      navigate(`${basePath}?universityId=${id}`);
    } else {
      navigate(basePath);
    }
  };

  return (
    <nav>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-4 uppercase">Universities</h2>
        <ul>
          <li>
            <button
              onClick={() => handleSelectUniversity(null)}
              className={`w-full text-left p-2 mb-1 transition-colors uppercase font-semibold ${
                selectedUniversityId === null
                  ? 'bg-black text-white'
                  : 'hover:bg-yellow-300'
              }`}
            >
              All Schools
            </button>
          </li>

          {/* VNU Dropdown (now contains all universities) */}
          <li>
            <button
              onClick={() => setIsVnuDropdownOpen(!isVnuDropdownOpen)}
              className={`w-full text-left p-2 mb-1 transition-colors uppercase font-semibold flex justify-between items-center ${
                isVnuDropdownOpen || universities.some(uni => uni.id === selectedUniversityId) ? 'bg-black text-yellow-300' : 'hover:bg-yellow-300'
              }`}
            >
              VNU Universities
              <svg
                className={`w-4 h-4 transform ${isVnuDropdownOpen ? 'rotate-90' : 'rotate-0'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
            {isVnuDropdownOpen && (
              <ul className="pl-4 border-l-2 border-gray-300 ml-2">
                {universities.map((uni) => (
                  <li key={uni.id}>
                    <button
                      onClick={() => handleSelectUniversity(uni.id)}
                      className={`w-full text-left p-2 mb-1 transition-colors ${
                        selectedUniversityId === uni.id
                          ? 'bg-black text-white'
                          : 'hover:bg-yellow-300'
                      }`}
                    >
                      {uni.abbreviation} - {uni.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};