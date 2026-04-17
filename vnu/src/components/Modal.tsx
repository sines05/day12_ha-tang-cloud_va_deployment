import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons/CloseIcon';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  useEffect(() => {
    // Better body scroll lock for mobile
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white border-2 border-black w-full max-w-2xl relative flex flex-col max-h-[85dvh] sm:max-h-[90vh] shadow-[6px_6px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_rgba(0,0,0,1)]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b-2 border-black bg-yellow-300">
          <h2 id="modal-title" className="flex-grow text-xl font-bold uppercase text-center">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-black hover:text-yellow-300 flex-shrink-0" aria-label={`Close ${title} modal`}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};