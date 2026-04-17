import React, { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import type { Review, Comment } from '../types';
import { StarRating } from './StarRating';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';

interface DetailedReviewItemProps {
    review: Review;
    onAddComment: (reviewId: number, content: string) => void;
}

export const DetailedReviewItem: React.FC<DetailedReviewItemProps> = ({ review, onAddComment }) => {
    const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
    const [isCommentFormVisible, setIsCommentFormVisible] = useState(false);
    
    const handleCommentSubmit = (content: string) => {
        onAddComment(review.id, content);
        setIsCommentFormVisible(false); // Collapse form after submit
    }

    const sortedComments = useMemo(() => {
        if (!review.comments) return [];
        return [...review.comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [review.comments]);

    const sanitizedContent = DOMPurify.sanitize(review.content);

    return (
        <div className="py-6 border-b-2 border-black last:border-b-0">
            {/* --- Review Header --- */}
            <div className="flex justify-between items-center mb-1"> {/* Reduced mb to bring course tag closer */}
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 border-2 border-black rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <span className="font-bold">Anonymous</span>
                </div>
                <p className="text-sm text-gray-600">
                    {new Date(review.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>

            {/* --- Course Tag (New Position) --- */}
            {review.courseName && (
                <div className="pl-4 mb-3"> {/* Keep indent and margin bottom for spacing */}
                    <h4 className="font-bold text-gray-800 text-lg">
                        {review.courseName}
                    </h4>
                </div>
            )}

            {/* --- Review Body --- */}
            <div className="pl-4"> {/* Consistent indent */}
                <div className="mb-2"> {/* StarRating now lives on its own line here */}
                    <StarRating rating={review.rating} />
                </div>

                <div 
                    className="prose max-w-none text-base text-gray-900 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
                />
            </div>

            {/* --- Comments & Actions Section --- */}
            <div className="pl-4 mt-4">
                <div className="flex items-center space-x-4">
                    {!isCommentFormVisible && (
                        <button
                            onClick={() => setIsCommentFormVisible(true)}
                            className="text-sm font-bold text-blue-600 hover:underline"
                        >
                            Reply
                        </button>
                    )}
                    {sortedComments.length > 0 && (
                        <button
                            onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                            className="flex items-center space-x-1 text-sm font-bold text-gray-600 hover:underline"
                        >
                            {isCommentsExpanded ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            )}
                            <span>
                                {isCommentsExpanded ? 'Hide Replies' : `View ${sortedComments.length} Replies`}
                            </span>
                        </button>
                    )}
                </div>

                {isCommentsExpanded && sortedComments.length > 0 && (
                    <div className="pt-3 space-y-3">
                         <CommentList comments={sortedComments} />
                    </div>
                )}
                
                {isCommentFormVisible && (
                    <div className="mt-3">
                        <CommentForm 
                            onSubmit={handleCommentSubmit} 
                            onCancel={() => setIsCommentFormVisible(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

