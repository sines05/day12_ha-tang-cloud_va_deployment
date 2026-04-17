import React, { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import type { Review, Comment, Lecturer, University } from '../types';
import { StarRating } from './StarRating';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { Modal } from './Modal';

interface ReviewItemProps {
    review: Review;
    comments: Comment[];
    lecturer?: Lecturer;
    university?: University;
    onAddComment: (reviewId: number, content: string) => void;
}

const COMMENTS_TO_SHOW = 1; // Number of comments to show by default

export const ReviewItem: React.FC<ReviewItemProps> = ({ review, comments, lecturer, university, onAddComment }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleCommentSubmit = (content: string) => {
        onAddComment(review.id, content);
    }

    const sortedComments = useMemo(() => {
        // Sort comments by creation date, newest first
        return [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [comments]);

    const displayedComments = sortedComments.slice(0, COMMENTS_TO_SHOW);
    
    const sanitizedContent = DOMPurify.sanitize(review.content);

    const reviewContent = (
        <>
            <div className="flex justify-between items-start mb-2">
                 <div>
                     <p className="font-bold">{review.courseName}</p>
                     <p className="text-xs text-gray-600">
                         {new Date(review.createdAt).toLocaleDateString('en-GB')} {new Date(review.createdAt).toLocaleTimeString('en-GB')}
                     </p>
                 </div>
                <StarRating rating={review.rating} />
            </div>
            <div 
                className="prose prose-sm max-w-none text-sm mb-3"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
            />
        </>
    );

    return (
        <div className="border-2 border-black p-3 bg-white">
           {reviewContent}
           
           <div className="pl-4 border-l-2 border-dashed border-gray-400 space-y-2">
                <CommentList comments={displayedComments} />
                {sortedComments.length > COMMENTS_TO_SHOW && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full p-2 font-bold uppercase text-center bg-gray-200 border-2 border-black hover:bg-gray-300 active:bg-gray-400 text-xs transition-colors"
                    >
                        Show {sortedComments.length - COMMENTS_TO_SHOW} More Comments
                    </button>
                )}
                <CommentForm onSubmit={handleCommentSubmit} />
           </div>

           {isModalOpen && (
               <Modal title="Review Details" onClose={() => setIsModalOpen(false)}>
                   <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-grow">
                       {(lecturer || university) && (
                           <div className="mb-4 pb-4 border-b-2 border-dashed border-gray-400">
                               <h3 className="text-xl font-bold uppercase">{lecturer?.name || 'Chưa rõ Giảng viên'}</h3>
                               {university && <p className="text-sm font-semibold uppercase text-gray-700">{university.name}</p>}
                           </div>
                       )}
                       {reviewContent}
                       
                       <div className="pt-4 border-t-2 border-black">
                           <h4 className="font-bold uppercase mb-4 text-lg">All Comments ({sortedComments.length})</h4>
                           <div className="pl-4 border-l-2 border-dashed border-gray-400 space-y-4">
                               <CommentList comments={sortedComments} />
                               <div className="mt-4">
                                   <CommentForm onSubmit={handleCommentSubmit} />
                               </div>
                           </div>
                       </div>
                   </div>
               </Modal>
           )}
        </div>
    );
};
