import React from 'react';
import type { Comment } from '../types';
import { CommentIcon } from './icons/CommentIcon';
import { CommentItem } from './CommentItem'; // Import CommentItem

interface CommentListProps {
    comments: Comment[];
}

export const CommentList: React.FC<CommentListProps> = ({ comments }) => {
    if (comments.length === 0) {
        return null; // Don't render anything if there are no comments
    }

    return (
        <div className="pt-2 space-y-2">
            {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
            ))}
        </div>
    );
};