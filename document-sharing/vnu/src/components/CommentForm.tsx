import React, { useState } from 'react';

interface CommentFormProps {
    onSubmit: (content: string) => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({ onSubmit }) => {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            onSubmit(content);
            setContent('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
            <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a comment..."
                className="w-full text-base p-2 bg-white border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
            />
            <button
                type="submit"
                className="px-3 bg-blue-500 text-white border-2 border-black font-bold hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-400"
                disabled={!content.trim()}
                aria-label="Submit comment"
            >
                Post
            </button>
        </form>
    );
};