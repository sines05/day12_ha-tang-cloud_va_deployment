import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import 'quill/dist/quill.snow.css'; // Import Quill styles globally
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { DocumentsPage } from './pages/DocumentsPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { LecturerDetailPage } from './pages/LecturerDetailPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { DownloadingPage } from './pages/DownloadingPage';
import { DownloadProvider } from './contexts/DownloadContext';

// Lazy load static pages
const AboutPage = lazy(() => import('./pages/AboutPage').then(module => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(module => ({ default: module.ContactPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(module => ({ default: module.TermsPage })));
const AdminRoutes = lazy(() => import('./routes/AdminRoutes'));


const App: React.FC = () => {
  return (
    <AppProvider>
      <DownloadProvider>
        <Suspense fallback={<div className="p-6">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DocumentsPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="documents/:documentSlug" element={<DocumentDetailPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="reviews/giang-vien/:lecturerSlug" element={<LecturerDetailPage />} />

              {/* Added static page routes */}
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="terms" element={<TermsPage />} />

              <Route path="*" element={<div className="p-6">404 Not Found</div>} />
            </Route>
            <Route path="download" element={<DownloadingPage />} />
            <Route path="admin/*" element={<AdminRoutes />} />
          </Routes>
        </Suspense>
      </DownloadProvider>
    </AppProvider>
  );
};

export default App;