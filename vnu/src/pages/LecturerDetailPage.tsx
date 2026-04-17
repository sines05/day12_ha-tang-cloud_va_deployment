import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, Link, useOutletContext } from 'react-router-dom';
import { useHead } from '@unhead/react';
import { api, HttpError } from '../services/api';
import type { Review, Comment, University, PaginatedReviewsData } from '../types'; // Assuming base types exist
import { Tabs } from '../components/Tabs';
import { useAppContext } from '../contexts/AppContext';
import { Pagination } from '../components/Pagination'; // Re-add import
import { DetailedReviewItem } from '../components/DetailedReviewItem'; // Import the new component
import { MailIcon } from '../components/icons/MailIcon';
import { GoogleScholarIcon } from '../components/icons/GoogleScholarIcon';
import { LinkedInIcon } from '../components/icons/LinkedInIcon';
import { WebsiteIcon } from '../components/icons/WebsiteIcon';

// --- Re-define types locally for clarity during debug ---
export interface LecturerDetails {
    id: number;
    name: string;
    slug: string;
    university_id: string;
    universityName?: string;
    abbreviation?: string;
    email?: string;
    scholar_link?: string;
    linkedin_link?: string;
    website_link?: string;
    avatar_url?: string;
    averageRating?: number; // Đã sửa từ average_rating
    totalReviews?: number; // Đã sửa từ total_reviews
}


// Cache structure for reviews
interface CachedReviews {
    data: PaginatedReviewsData;
    timestamp: number;
}

export const LecturerDetailPage: React.FC = () => {
    const { lecturerSlug } = useParams<{ lecturerSlug: string }>();
    const location = useLocation();
    const { universities } = useAppContext();
    
    // --- DATA AND STATE SETUP ---
    const lecturerId = parseInt(lecturerSlug?.split('-').pop() || '', 10);
    const [lecturerInfo, setLecturerInfo] = useState<LecturerDetails | null>(null);
    const [reviewsData, setReviewsData] = useState<PaginatedReviewsData | null>(null);
    const [loadingLecturerInfo, setLoadingLecturerInfo] = useState(true); // Đây là loading chung
    const [loadingReviews, setLoadingReviews] = useState(true); // Thêm lại khai báo này
    const [error, setError] = useState<string | null>(null);
    const [commentError, setCommentError] = useState<string | null>(null);
    const errorRef = useRef<HTMLHTMLDivElement>(null);
    const [errorTrigger, setErrorTrigger] = useState(0);
    const [currentReviewPage, setCurrentReviewPage] = useState(1); // Thêm lại khai báo này
    const REVIEWS_PER_PAGE = 10; // Match backend default or set explicitly

    // New: In-memory cache for lecturer reviews
    const [lecturerReviewsCache] = useState(new Map<string, CachedReviews>());

    const { handleOpenPostReviewModal } = useOutletContext<any>();
    
    // --- DATA FETCHING LOGIC ---
    const fetchLecturerInfo = useCallback(async () => {
        if (isNaN(lecturerId)) {
            setError("Invalid Lecturer ID.");
            setLoadingLecturerInfo(false);
            return;
        }
        setLoadingLecturerInfo(true);
        try {
            const infoResponse = await api.getLecturerDetails(lecturerId);
            setLecturerInfo(infoResponse);
        } catch (err: any) {
            console.error("[fetch] A fetch error occurred for lecturer info:", err);
            setError(err.message || "Failed to fetch lecturer info.");
        } finally {
            setLoadingLecturerInfo(false);
        }
    }, [lecturerId]);
    
    const fetchReviewsForLecturer = useCallback(async () => {
        if (isNaN(lecturerId)) {
            setLoadingReviews(false);
            return;
        }

        const cacheKey = `${lecturerId}-${currentReviewPage}`;
        const cached = lecturerReviewsCache.get(cacheKey);
        const CACHE_DURATION = 10 * 1000; // 10 seconds

        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            setReviewsData(cached.data);
            setLoadingReviews(false);
            return;
        }

        setLoadingReviews(true);
        try {
            const reviewsResponse = await api.getLecturerReviews(lecturerId, currentReviewPage);
            lecturerReviewsCache.set(cacheKey, { data: reviewsResponse, timestamp: Date.now() });
            setReviewsData(reviewsResponse);
        } catch (err: any) {
            console.error("[fetch] A fetch error occurred for reviews:", err);
            // Don't set the main error for this, maybe a smaller indicator
        } finally {
            setLoadingReviews(false);
        }
    }, [lecturerId, currentReviewPage, lecturerReviewsCache]);

    // --- EFFECTS TO TRIGGER FETCH ---
    useEffect(() => {
        fetchLecturerInfo();
    }, [fetchLecturerInfo]);

    useEffect(() => {
        fetchReviewsForLecturer();
    }, [fetchReviewsForLecturer]);

    // Scroll to error if it appears
    useEffect(() => {
        if (commentError && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [commentError, errorTrigger]);

    const handleAddComment = async (reviewId: number, content: string) => {
        if (!lecturerInfo || !reviewsData) return; // Ensure we have data
        
        const tempCommentId = Date.now();
        const newComment: Comment = { id: tempCommentId, reviewId, authorName: 'Anonymous', content, createdAt: new Date().toISOString() };
        
        // Optimistic update
        const originalReviewsData = { ...reviewsData };
        const updatedReviews = reviewsData.data.map(review => 
            review.id === reviewId ? { ...review, comments: [...(review.comments || []), newComment] } : review
        );
        setReviewsData({ ...reviewsData, data: updatedReviews });

        try {
            await api.postComment({ reviewId, content });
            setCommentError(null);
        } catch (error) {
            console.error("Failed to post comment", error);
            setReviewsData(originalReviewsData); // Revert on error
            if (error instanceof HttpError && error.status === 429) {
                setCommentError("Từ từ thôi anh, anh gửi quá nhiều bình luận :(. Vui lòng thử lại sau ít phút.");
            } else {
                setCommentError("Từ từ thôi anh :) . Vui lòng thử lại.");
            }
            setErrorTrigger(prev => prev + 1);
        }
    };

    // --- SEO HEAD & RICH SNIPPETS ---
    const pageUrl = window.location.href;
    const descriptionContent = lecturerInfo
        ? `Xem ${lecturerInfo.totalReviews || 0} bài đánh giá cho giảng viên ${lecturerInfo.name} tại ${lecturerInfo.abbreviation || lecturerInfo.universityName || ''}. Điểm đánh giá trung bình: ${lecturerInfo.averageRating ? lecturerInfo.averageRating.toFixed(1) : 'Chưa có'}★. Chia sẻ và xem các nhận xét khách quan nhất.`
        : 'Đang tải thông tin giảng viên...';

    // JSON-LD Schema for Rich Snippets (ProfilePage with mainEntity Person)
    const schema = lecturerInfo ? {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        'url': pageUrl,
        'mainEntity': {
            '@type': 'Person',
            'name': lecturerInfo.name,
            'url': pageUrl, // URL for the person's profile
            // Add image (avatar)
            ...(lecturerInfo.avatar_url && { 'image': lecturerInfo.avatar_url }),
            // Add email
            ...(lecturerInfo.email && { 'email': lecturerInfo.email }),
            // Add social/academic links to sameAs
            'sameAs': [
                lecturerInfo.scholar_link,
                lecturerInfo.linkedin_link,
                lecturerInfo.website_link
            ].filter(Boolean), // Filter out any null/undefined links
            'worksFor': {
                '@type': 'CollegeOrUniversity',
                'name': lecturerInfo.universityName,
            },
            // Map totalReviews to interactionStatistic
            ...(lecturerInfo.totalReviews && lecturerInfo.totalReviews > 0 && {
                'interactionStatistic': [{
                    '@type': 'InteractionCounter',
                    'interactionType': 'https://schema.org/WriteAction', // Represents reviews/posts
                    'userInteractionCount': lecturerInfo.totalReviews
                }]
            }),
        },
    } : null;

    useHead({
        title: lecturerInfo ? `Đánh giá ${lecturerInfo.name} - ${lecturerInfo.universityName}` : 'Đang tải...',
        meta: [
            {
                name: 'description',
                content: descriptionContent,
            }
        ],
        script: schema ? [
            {
                type: 'application/ld+json',
                innerHTML: JSON.stringify(schema),
            }
        ] : [],
    });

    // --- RENDER LOGIC ---

    // Only show full-page loading when fetching lecturer info for the first time
    if (loadingLecturerInfo && !lecturerInfo) {
        return <div className="p-10 text-center">Loading Lecturer Info...</div>;
    }

    if (error) {
        return <div className="p-10 text-center text-red-500">Error: {error}</div>;
    }

    if (!lecturerInfo) {
        return <div className="p-10 text-center">Lecturer not found.</div>;
    }

    // Find university info from context
    const university = universities.find(u => u.id === lecturerInfo?.university_id);

    // Adapt data for ReviewSection. ReviewSection expects an array of {lecturer, reviews[]}
    const formattedData = lecturerInfo && reviewsData ? [{
        lecturer: {
            id: lecturerInfo.id,
            name: lecturerInfo.name,
            universityId: lecturerInfo.university_id,
            slug: lecturerInfo.slug || lecturerSlug || '',
            avatar_url: lecturerInfo.avatar_url, 
            average_rating: lecturerInfo.averageRating, // Đã sửa
            total_reviews: lecturerInfo.totalReviews, // Đã sửa
        },
        reviews: (reviewsData && reviewsData.data) || [],
    }] : [];


    return (
        <>
            <Tabs />
            {/* Breadcrumbs */}
            <div className="text-sm font-semibold mb-4">
                <Link to="/reviews" className="hover:underline">Đánh giá</Link>
                <span className="mx-2">&gt;</span>
                {university && (
                    <>
                        <Link to={`/reviews?universityId=${university.id}`} className="hover:underline">{university.name}</Link>
                        <span className="mx-2">&gt;</span>
                    </>
                )}
                <span>{lecturerInfo.name}</span>
            </div>

            {commentError && (
                <div ref={errorRef} className="bg-red-500 text-white border-2 border-black font-bold uppercase px-4 py-3 rounded relative mb-4" style={{ boxShadow: '4px 4px 0px #000' }} role="alert">
                    <strong className="font-bold">Lỗi: </strong>
                    <span className="block sm:inline">{commentError}</span>
                </div>
            )}
            
            {/* Detailed Profile Card */}
            <div className="p-4 bg-white border-2 border-black mb-6" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.8)' }}>
                <h2 className="text-2xl font-bold mb-4">Thông tin giảng viên</h2>
                <div className="flex items-center space-x-6 mb-4">
                    <img 
                        src={lecturerInfo.avatar_url || '/logo.png'}
                        alt={lecturerInfo.name} 
                        className="w-32 h-32 rounded-full object-cover border-2 border-gray-300" 
                    />
                    <div>
                        <p className="text-3xl font-bold">{lecturerInfo.name}</p>
                        <div className="ml-1 pl-3 border-l-[4px] border-black flex flex-col mt-3 gap-1">
                            <p className="text-base font-semibold uppercase text-gray-800">{lecturerInfo.universityName || university?.name}</p>
                            {lecturerInfo.averageRating != null && lecturerInfo.totalReviews != null && (
                                <p className="text-lg font-semibold flex items-center text-black">
                                    {lecturerInfo.averageRating.toFixed(1)}<span className="text-xl leading-none ml-[2px] pb-[2px]">★</span> 
                                    <span className="ml-1 text-gray-800">({lecturerInfo.totalReviews} đánh giá)</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base mt-4">
                    {lecturerInfo.email && (
                        <a href={`mailto:${lecturerInfo.email}`} className="text-blue-500 hover:underline flex items-center space-x-2">
                            <MailIcon className="w-5 h-5" />
                            <span>{lecturerInfo.email}</span>
                        </a>
                    )}
                    {lecturerInfo.scholar_link && (
                        <a href={lecturerInfo.scholar_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center space-x-2">
                            <GoogleScholarIcon className="w-5 h-5" />
                            <span>Google Scholar</span>
                        </a>
                    )}
                    {lecturerInfo.linkedin_link && (
                        <a href={lecturerInfo.linkedin_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center space-x-2">
                            <LinkedInIcon className="w-5 h-5" />
                            <span>LinkedIn</span>
                        </a>
                    )}
                    {lecturerInfo.website_link && (
                        <a href={lecturerInfo.website_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center space-x-2">
                            <WebsiteIcon className="w-5 h-5" />
                            <span>Website</span>
                        </a>
                    )}
                </div>
            </div>

            <div className="my-6">
                <button
                    onClick={() => handleOpenPostReviewModal && handleOpenPostReviewModal(lecturerInfo)}
                    className="w-full sm:w-auto p-3 bg-blue-500 text-white border-2 border-black font-bold uppercase hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 ease-in-out hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                    style={{ boxShadow: '4px 4px 0px #000' }}
                >
                    Post a Review for {lecturerInfo.name}
                </button>
            </div>

            {/* Apply a subtle loading effect on the review section during pagination */}
            <div className={`transition-opacity duration-300 ${loadingReviews ? 'opacity-50' : 'opacity-100'}`}>
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-2 border-b-2 border-black pb-2">Các bài đánh giá</h2>
                    {reviewsData && reviewsData.data.length > 0 ? (
                        reviewsData.data.map(review => (
                            <DetailedReviewItem 
                                key={review.id}
                                review={review}
                                onAddComment={handleAddComment}
                            />
                        ))
                    ) : (
                        // Show loading indicator inside the section if it's the initial review load
                        loadingReviews ? <p className="py-6">Loading reviews...</p> : <p className="py-6 text-gray-600">Chưa có bài đánh giá nào cho giảng viên này.</p>
                    )}
                </div>
                
                {reviewsData && reviewsData.pagination && reviewsData.pagination.totalPages > 1 && (
                    <Pagination
                        currentPage={reviewsData.pagination.currentPage}
                        totalPages={reviewsData.pagination.totalPages}
                        onPageChange={setCurrentReviewPage}
                    />
                )}
            </div>
        </>
    );
};
