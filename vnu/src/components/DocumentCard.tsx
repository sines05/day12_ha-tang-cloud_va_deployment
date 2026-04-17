import React from 'react';
import { Link } from 'react-router-dom';
import type { Document, University } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ClockIcon } from './icons/ClockIcon'; // Import the new icon

interface DocumentCardProps {
  document: Document;
  university?: University;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, university }) => {
  const courseInfo = [university?.abbreviation, document.courseCode].filter(Boolean).join(' - ');

  // Format date as DD/MM/YYYY
  const formattedDate = new Date(document.createdAt).toLocaleDateString('en-GB');

  return (
    <Link 
        to={`/documents/${document.slug}`}
        className="border-2 border-black bg-white flex flex-col h-full transition-all duration-200 ease-in-out hover:shadow-none hover:translate-x-1 hover:translate-y-1 cursor-pointer no-underline text-black" 
        style={{ boxShadow: '4px 4px 0px #000' }}
        aria-label={`View details for ${document.title}`}
    >
      {/* Main content area with flex-col to push date to bottom */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Top section that grows to fill available space */}
        <div className="flex-grow">
            <div className="text-sm font-bold text-gray-700" style={{ minHeight: '20px' }}>
                {courseInfo && (
                    <span className="uppercase">{courseInfo}</span>
                )}
                {document.courseName && (
                    <>
                        {courseInfo && ' - '}
                        <span>{document.courseName}</span>
                    </>
                )}
            </div>
            <h3 
              className="text-lg font-bold leading-tight mt-2" // Added mt-2 for spacing
              style={{
                minHeight: '67.5px', // Ensures consistent height for 3 lines
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3,
              }}
              title={document.title} // Show full title on hover
            >
              {document.title}
            </h3>
        </div>

        {/* Bottom section for the date, always at the bottom */}
        <div className="mt-2">
            <p className="text-xs text-gray-600 flex items-center">
                <ClockIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                <span>{formattedDate}</span>
            </p>
        </div>
      </div>

      {/* Footer button */}
      <div
        className="flex items-center justify-center gap-2 p-3 bg-yellow-300 border-t-2 border-black font-bold uppercase text-center group-hover:bg-black group-hover:text-yellow-300 transition-colors"
      >
        View Details
        <ChevronRightIcon />
      </div>
    </Link>
  );
};