import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { useHead } from '@unhead/react';
import { ReviewSection } from '../components/ReviewSection';
import { Pagination } from '../components/Pagination';
import { Tabs } from '../components/Tabs';
import { useAppContext } from '../contexts/AppContext';
import { AdvancedSearchPanel } from '../components/AdvancedSearchPanel';
import { ActiveFilters } from '../components/ActiveFilters';
import { FilterIcon } from '../components/icons/FilterIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { api, HttpError } from '../services/api';
import type { Lecturer, AdvancedSearchFilters, Review, Comment } from '../types';

const LECTURERS_PER_PAGE = 5;

interface ReviewsPageContext {
  handleOpenPostReviewModal: () => void;
}

// The data structure returned by our RPC call
interface LecturerWithReviews {
  lecturerId: number;
  lecturerName: string;
  universityId: string;
  reviews: Review[];
}

export const ReviewsPage: React.FC = () => {
  const { universities, selectedUniversityId, getReviews } = useAppContext();
  const { handleOpenPostReviewModal } = useOutletContext<ReviewsPageContext>();
  
  const [title, setTitle] = useState('Đánh giá Giảng viên - VNU DOCS HUB');
  const [description, setDescription] = useState('Tìm kiếm, xem và chia sẻ các đánh giá về giảng viên từ các trường đại học trong ĐHQGHN.');

  const [loading, setLoading] = useState(true);
  const [reviewsData, setReviewsData] = useState<LecturerWithReviews[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate(); // For updating URL
  const currentPage = parseInt(searchParams.get('page') || '1', 10); // Derive currentPage from URL
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [advancedSearchFilters, setAdvancedSearchFilters] = useState<AdvancedSearchFilters>({
    lecturer: '',
    course: '',
    content: '',
  });
  const [commentError, setCommentError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [errorTrigger, setErrorTrigger] = useState(0);

  // State to manually trigger search
  const [triggerSearch, setTriggerSearch] = useState(0);

  useEffect(() => {
    const selectedUniversity = universities.find(u => u.id === selectedUniversityId);
    let newTitle = 'Đánh giá Giảng viên - VNU DOCS HUB';
    let newDescription = 'Tìm kiếm, xem và chia sẻ các đánh giá về giảng viên từ các trường đại học trong ĐHQGHN. Giúp sinh viên có lựa chọn tốt hơn cho các khóa học.';
    const { lecturer, course, content } = advancedSearchFilters;

    const searchTerms = [lecturer, course, content].filter(Boolean).join(', ');
    if (searchTerms) {
        newTitle = `Kết quả lọc đánh giá cho: ${searchTerms} - VNU DOCS HUB`;
        newDescription = `Xem các đánh giá giảng viên được lọc theo: ${searchTerms}.`;
    } else if (selectedUniversity) {
        newTitle = `Đánh giá Giảng viên ${selectedUniversity.abbreviation} - VNU DOCS HUB`;
        newDescription = `Xem và chia sẻ đánh giá về các giảng viên của ${selectedUniversity.name} (${selectedUniversity.abbreviation}).`;
    }

    if (currentPage > 1) {
        newTitle = `${newTitle} - Trang ${currentPage}`;
    }

    setTitle(newTitle);
    setDescription(newDescription);
  }, [currentPage, selectedUniversityId, universities, advancedSearchFilters]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReviews(selectedUniversityId, advancedSearchFilters, currentPage); // Pass currentPage
      setReviewsData(data || []); // Ensure data is an array
    } catch (error) {
      console.error("Failed to fetch reviews", error);
      setReviewsData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUniversityId, advancedSearchFilters, getReviews, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page.toString());
    navigate({ search: newSearchParams.toString() });
  }, [searchParams, navigate]); // Add currentPage to dependencies

  useEffect(() => {
    fetchReviews();
  }, [selectedUniversityId, triggerSearch]);

  useEffect(() => {
      if (commentError && errorRef.current) {
          errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  }, [commentError, errorTrigger]);

  // Pagination is now client-side since the API returns all matching lecturers.
  const totalPages = Math.ceil(reviewsData.length / LECTURERS_PER_PAGE);
  const paginatedData = reviewsData.slice(
    (currentPage - 1) * LECTURERS_PER_PAGE,
    currentPage * LECTURERS_PER_PAGE
  );

  const handleAddComment = async (reviewId: number, content: string) => {
    // Optimistic update
    const tempCommentId = Date.now(); // Unique temporary ID
    const newComment: Comment = {
      id: tempCommentId,
      reviewId: reviewId,
      authorName: 'Anonymous', // Default author name
      content: content,
      createdAt: new Date().toISOString(), // Current time
    };

    // Update reviewsData state optimistically
    setReviewsData(prevReviewsData => {
      return prevReviewsData.map(lecturerReview => ({
        ...lecturerReview,
        reviews: lecturerReview.reviews.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              comments: [...(review.comments || []), newComment], // Add new comment
            };
          }
          return review;
        }),
      }));
    });

    try {
      await api.postComment({ reviewId, content });
      // If successful, clear any previous error
      setCommentError(null);
    } catch (error) {
      console.error("Failed to post comment", error);
      // Revert optimistic update on error
      setReviewsData(prevReviewsData => {
        return prevReviewsData.map(lecturerReview => ({
          ...lecturerReview,
          reviews: lecturerReview.reviews.map(review => {
            if (review.id === reviewId) {
              return {
                ...review,
                comments: (review.comments || []).filter(c => c.id !== tempCommentId),
              };
            }
            return review;
          }),
        }));
      });

      // Check for HttpError and status 429
      if (error instanceof HttpError && error.status === 429) {
        setCommentError("Từ từ thôi anh, anh gửi quá nhiều bình luận :(. Vui lòng thử lại sau ít phút.");
        setErrorTrigger(prev => prev + 1); // Increment trigger
      } else {
        setCommentError("Từ từ thôi anh :) . Vui lòng thử lại.");
        setErrorTrigger(prev => prev + 1); // Increment trigger
      }
    }
  };

  const handleClearFilter = (filterToClear: keyof AdvancedSearchFilters) => {
    setAdvancedSearchFilters(prev => ({ ...prev, [filterToClear]: '' }));
    setTriggerSearch(prev => prev + 1); // Trigger search after clearing a single filter
  };

  const handleClearAllFilters = () => {
    setAdvancedSearchFilters({ lecturer: '', course: '', content: '' });
    setTriggerSearch(prev => prev + 1); // Trigger search after clearing
  };
  
  // Reshape the data for the ReviewSection component
  const formattedData = paginatedData.map(item => ({
    lecturer: {
      id: item.lecturerId,
      name: item.lecturerName,
      universityId: item.universityId,
    },
    reviews: item.reviews,
  }));

  const SITE_URL = 'https://vnudocshub.com';
  const PUBLISHER_LOGO_URL = `${SITE_URL}/logo.png`;

  const courseSchemas = paginatedData.map(lecturerData => {
    const university = universities.find(u => u.id === lecturerData.universityId);
    const universityName = university ? university.name : 'Đại học Quốc gia Hà Nội';

    const ratingCount = lecturerData.reviews.length;
    const totalRating = lecturerData.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '0';

    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      'name': `Giảng viên ${lecturerData.lecturerName} - ${universityName}`,
      'description': `Tổng hợp đánh giá review giảng viên ${lecturerData.lecturerName} tại ${universityName}.`,
      'provider': {
        '@type': 'Organization',
        'name': universityName,
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': averageRating,
        'ratingCount': ratingCount.toString(),
        'bestRating': '5',
        'worstRating': '1',
      },
    };
  });

  useHead({
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: window.location.href },
      { property: 'og:image', content: PUBLISHER_LOGO_URL },
      { property: 'og:site_name', content: 'VNU Docs Hub' },
    ],
    script: courseSchemas.map((schema, index) => ({
      key: `course-schema-${index}`,
      type: 'application/ld+json',
      children: JSON.stringify(schema),
    })),
  });
  
  if (loading) {
    return <div className="text-center p-10">Loading reviews...</div>;
  }

  return (
    <>
      <Tabs />
      {commentError && (
          <div ref={errorRef} className="bg-red-500 text-white border-2 border-black font-bold uppercase px-4 py-3 rounded relative mb-4" style={{ boxShadow: '4px 4px 0px #000' }} role="alert">
              <strong className="font-bold">Lỗi: </strong>
              <span className="block sm:inline">{commentError}</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setCommentError(null)}>
                  <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
              </span>
          </div>
      )}
      <div className="my-6 flex flex-col sm:flex-row gap-4">
          <button
              onClick={handleOpenPostReviewModal}
              className="w-full sm:w-auto flex-grow flex items-center justify-center gap-2 p-3 bg-blue-500 text-white border-2 border-black font-bold uppercase hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 ease-in-out hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
              style={{ boxShadow: '4px 4px 0px #000' }}
          >
              <PlusIcon />
              Post a Review
          </button>
          <button
              onClick={() => setIsFilterPanelOpen(prev => !prev)}
              className={`w-full sm:w-auto p-3 border-2 border-black font-bold uppercase flex items-center justify-center gap-2 transition-colors ${isFilterPanelOpen ? 'bg-black text-yellow-300' : 'bg-white hover:bg-yellow-300'}`}
              style={!isFilterPanelOpen ? { boxShadow: '4px 4px 0px #000' } : {}}
              aria-expanded={isFilterPanelOpen}
          >
              <FilterIcon />
              {isFilterPanelOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
      </div>

      {isFilterPanelOpen && (
        <AdvancedSearchPanel
          filters={advancedSearchFilters}
          onFilterChange={setAdvancedSearchFilters}
          onClear={handleClearAllFilters}
          onFind={() => setTriggerSearch(prev => prev + 1)}
        />
      )}

      <ActiveFilters filters={advancedSearchFilters} onClearFilter={handleClearFilter} />

      <ReviewSection
          data={formattedData}
          universities={universities}
          onAddComment={handleAddComment}
      />
      <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
      />
    </>
  );
};