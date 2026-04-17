import React from 'react';
import { useLocation } from 'react-router-dom';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getPageNumbers = (totalPages: number, currentPage: number, pageNeighbours: number = 1) => {
    const totalNumbers = (pageNeighbours * 2) + 3;
    const totalBlocks = totalNumbers + 2;

    if (totalPages > totalBlocks) {
        const pages: (number | string)[] = [];
        const leftBound = currentPage - pageNeighbours;
        const rightBound = currentPage + pageNeighbours;

        const startPage = Math.max(2, leftBound);
        const endPage = Math.min(totalPages - 1, rightBound);
        
        pages.push(1);
        if (startPage > 2) {
            pages.push('...');
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (endPage < totalPages - 1) {
            pages.push('...');
        }
        pages.push(totalPages);
        return pages;
    }
    return Array.from({ length: totalPages }, (_, i) => i + 1);
};


export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const location = useLocation(); // Get current location

  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      window.scrollTo(0, 0); // Scroll to top on page change
    }
  };

  const getPageLink = (page: number) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', page.toString());
    return `${location.pathname}?${searchParams.toString()}`;
  };

  const pageNumbers = getPageNumbers(totalPages, currentPage);

  const buttonClasses = "px-4 py-2 border-2 border-black font-bold transition-colors";
  const activeClasses = "bg-black text-white cursor-default";
  const inactiveClasses = "bg-white hover:bg-yellow-300";
  const disabledClasses = "bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed";

  return (
    <nav aria-label="Pagination" className="flex justify-center items-center gap-2 mt-8 flex-wrap">
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${buttonClasses} ${currentPage === 1 ? disabledClasses : inactiveClasses}`}
        aria-label="Go to previous page"
      >
        &lt; Prev
      </button>

      {pageNumbers.map((page, index) => {
        if (typeof page === 'string') {
            return <span key={`ellipsis-${index}`} className="px-2 py-2 font-bold select-none">...</span>;
        }
        const isActive = currentPage === page;
        return (
            <a
              key={page}
              href={getPageLink(page)} // Use href for SEO
              onClick={(e) => {
                e.preventDefault(); // Prevent default navigation
                handlePageClick(page);
              }}
              className={`${buttonClasses} ${isActive ? activeClasses : inactiveClasses} ${isActive ? '' : 'cursor-pointer'}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Go to page ${page}`}
            >
              {page}
            </a>
        );
      })}

      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${buttonClasses} ${currentPage === totalPages ? disabledClasses : inactiveClasses}`}
        aria-label="Go to next page"
      >
        Next &gt;
      </button>
    </nav>
  );
};
