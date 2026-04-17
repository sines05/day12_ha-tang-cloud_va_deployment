import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Lecturer, Review, University, Comment } from '../types';
import { ReviewItem } from './ReviewItem';

interface LecturerReviewCardProps {
    lecturer: Lecturer;
    reviews: Review[];
    university?: University;
    onAddComment: (reviewId: number, content: string) => void;
}

const REVIEWS_TO_SHOW = 3;

// A simple slugify function for URL generation
const slugify = (text: string) => {
    return text
        .toString()
        .replace(/[đĐ]/g, (match) => (match === 'đ' ? 'd' : 'D'))
        .toLowerCase()
        .normalize('NFD') // Normalize diacritics
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
};

export const LecturerReviewCard: React.FC<LecturerReviewCardProps> = ({ lecturer, reviews, university, onAddComment }) => {
    const [visibleCount, setVisibleCount] = useState(REVIEWS_TO_SHOW);

    const sortedReviews = useMemo(() => {
        return [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [reviews]);

    const totalReviews = sortedReviews.length;
    const hasMore = visibleCount < totalReviews;
    const remainingReviews = totalReviews - visibleCount;
    const stepSize = Math.max(3, Math.ceil(Math.sqrt(totalReviews) * 0.5));
    const nextLoadCount = Math.min(remainingReviews, stepSize);

    const displayedReviews = sortedReviews.slice(0, visibleCount);
    const lecturerSlug = slugify(lecturer.name) + `-${lecturer.id}`;

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
        : '0';

    return (
        <div className="border-2 border-black bg-white transition-all duration-200 ease-in-out hover:shadow-none hover:translate-x-1 hover:translate-y-1" style={{ boxShadow: '4px 4px 0px #000' }}>
            <Link
                to={`/reviews/giang-vien/${lecturerSlug}`}
                className="block hover:bg-yellow-400"
                state={{ lecturerData: { lecturer, reviews } }} // Pass data via state
            >
                <div className="p-4 border-b-2 border-black bg-yellow-300 flex flex-col">
                    <h3 className="text-xl font-bold leading-tight">{lecturer.name}</h3>
                    <div className="ml-1 pl-2 border-l-[3px] border-black flex flex-col mt-2 gap-0.5">
                        <p className="text-sm font-semibold uppercase text-gray-800">{university?.name || 'Unknown University'}</p>
                        {reviews.length > 0 && (
                            <div className="text-sm font-semibold text-black flex items-center">
                                {averageRating}<span className="text-base leading-none ml-[2px] pb-[1px]">★</span> <span className="ml-1">({reviews.length} đánh giá)</span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
            <div className="p-4 space-y-4">
                {displayedReviews.length > 0 ? (
                    displayedReviews.map(review => (
                        <ReviewItem
                            key={review.id}
                            review={review}
                            comments={review.comments || []} // Pass nested comments
                            lecturer={lecturer}
                            university={university}
                            onAddComment={onAddComment}
                        />
                    ))
                ) : (
                    <p className="text-gray-500">No reviews yet for this lecturer.</p>
                )}
            </div>
            {totalReviews > REVIEWS_TO_SHOW && (
                <div className="p-2 border-t-2 border-black">
                    {hasMore ? (
                        <button
                            onClick={() => setVisibleCount(prev => prev + stepSize)}
                            className="w-full p-2 font-bold uppercase text-center bg-gray-200 border-2 border-black hover:bg-gray-300 active:bg-gray-400 text-xs"
                        >
                            Show {nextLoadCount} More Reviews
                        </button>
                    ) : (
                        <button
                            onClick={() => setVisibleCount(REVIEWS_TO_SHOW)}
                            className="w-full p-2 font-bold uppercase text-center bg-gray-200 border-2 border-black hover:bg-gray-300 active:bg-gray-400 text-blue-800 text-xs"
                        >
                            Show Less
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}