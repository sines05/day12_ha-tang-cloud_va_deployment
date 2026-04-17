import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export const Tabs: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const universityId = searchParams.get('universityId');

  const documentsPath = universityId ? `/documents?universityId=${universityId}` : '/documents';
  const reviewsPath = universityId ? `/reviews?universityId=${universityId}` : '/reviews';

  const isDocumentsActive = location.pathname === '/' || location.pathname.startsWith('/documents');

  const getButtonClass = (isActive: boolean, position: 'left' | 'right') => {
    const baseClasses = `w-1/2 p-4 text-center font-bold uppercase border-2 border-black transition-all duration-200 ease-in-out`;
    const borderPosition = position === 'left' ? 'border-r-0' : '';

    if (isActive) {
      return `${baseClasses} ${borderPosition} bg-black text-yellow-300 cursor-default`;
    }
    return `${baseClasses} ${borderPosition} bg-white hover:bg-yellow-300 active:translate-y-0.5`;
  };

  return (
    <div className="flex mb-6">
      <NavLink
        to={documentsPath}
        className={() => getButtonClass(isDocumentsActive, 'left')}
        style={() => !isDocumentsActive ? { boxShadow: '4px 4px 0px #000' } : {}}
      >
        Documents &amp; Exams
      </NavLink>
      <NavLink
        to={reviewsPath}
        className={({ isActive }) => getButtonClass(isActive, 'right')}
        style={({ isActive }) => !isActive ? { boxShadow: '4px 4px 0px #000' } : {}}
      >
        Lecturer Reviews
      </NavLink>
    </div>
  );
};