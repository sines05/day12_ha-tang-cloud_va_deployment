import React, { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import Chatbot from './Chatbot';
import { UploadModal } from './UploadModal';
import { PostReviewModal } from './PostReviewModal';
import { Footer } from './Footer'; // Import the Footer
import { useAppContext } from '../contexts/AppContext';
import { api } from '../services/api'; // Import api service
import type { NewReviewData } from '../types';

export const Layout: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isPostReviewModalOpen, setIsPostReviewModalOpen] = useState<boolean>(false);
  const [prefilledLecturer, setPrefilledLecturer] = useState<any>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const { universities, holidayTheme } = useAppContext();
  const location = useLocation();

  const handleOpenUploadModal = () => setIsUploadModalOpen(true);
  const handleCloseUploadModal = () => setIsUploadModalOpen(false);
  
  const handleOpenPostReviewModal = (lecturerInfo?: any) => {
    // If called as an event handler (e.g. onClick), the first argument is the event.
    // We only want to prefill if it's actual lecturer data (which has an id).
    // Check if lecturerInfo is actual data (has id) and not a Pointer/Mouse event
    if (lecturerInfo && lecturerInfo.id && typeof lecturerInfo.id !== 'object' && !(lecturerInfo instanceof Object && 'nativeEvent' in lecturerInfo)) {
      setPrefilledLecturer(lecturerInfo);
    } else {
      setPrefilledLecturer(null);
    }
    setIsPostReviewModalOpen(true);
  };
  const handleClosePostReviewModal = () => setIsPostReviewModalOpen(false);
  
  const handlePostReview = async (newReviewData: NewReviewData) => {
    setIsSubmittingReview(true);
    try {
      await api.postReview(newReviewData);
      // TODO: Show a success notification
      handleClosePostReviewModal();
      // Reload the page to reflect the new review after it's approved.
      // A more advanced implementation might involve optimistic updates or re-fetching.
      window.location.reload();
    } catch (error) {
      console.error("Failed to post review", error);
      // TODO: Show an error notification to the user in the modal
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const basePath = location.pathname.startsWith('/reviews') ? '/reviews' : '/documents';

  const layoutDecorations = useMemo(() => {
    if (!holidayTheme || !holidayTheme.decorations) return null;
    return holidayTheme.decorations
      .filter(d => d.target === 'layout')
      .map((d, index) => {
        const DecorationComponent = d.component;
        return <DecorationComponent key={index} {...d.props} />;
      });
  }, [holidayTheme]);

  return (
    <>
      {layoutDecorations}
      <div className="flex flex-col min-h-screen overflow-x-hidden">
        <Header onUploadClick={handleOpenUploadModal} />
        <div className="flex-grow md:grid md:grid-cols-12">
          <aside className="md:col-span-3 lg:col-span-2 border-t-2 border-b-2 md:border-b-0 md:border-r-2 border-black p-4">
            <Sidebar basePath={basePath} />
          </aside>
          <main className="md:col-span-9 lg:col-span-10 p-6">
            <Outlet context={{ handleOpenPostReviewModal }}/>
          </main>
        </div>
        <Footer />
      </div>
      {isUploadModalOpen && (
        <UploadModal 
          onClose={handleCloseUploadModal}
          universities={universities}
        />
      )}
      {isPostReviewModalOpen && (
        <PostReviewModal
          onClose={handleClosePostReviewModal}
          onPostReview={handlePostReview}
          universities={universities}
          isSubmitting={isSubmittingReview}
          initialLecturer={prefilledLecturer}
        />
      )}
      <Chatbot />
    </>
  );
};