import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import type { Comment } from '../types';

interface CommentItemProps {
    comment: Comment;
}

const MAX_COMMENT_LENGTH = 250; // Max characters before truncating

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Sanitize the HTML content first
    const sanitizedContent = DOMPurify.sanitize(comment.content);

    const isLongComment = sanitizedContent.length > MAX_COMMENT_LENGTH;
    
    // We create a temporary div to truncate the HTML string without breaking tags
    const getTruncatedHtml = (html: string, length: number) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        let truncatedHtml = '';
        let currentLength = 0;

        function traverse(node: Node) {
            if (currentLength >= length) return;

            if (node.nodeType === Node.TEXT_NODE) {
                const remainingLength = length - currentLength;
                const text = node.textContent || '';
                if (text.length > remainingLength) {
                    truncatedHtml += text.substring(0, remainingLength);
                    currentLength = length;
                } else {
                    truncatedHtml += text;
                    currentLength += text.length;
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                const clone = element.cloneNode(false) as Element;
                truncatedHtml += clone.outerHTML.slice(0, clone.outerHTML.indexOf('>') + 1);
                
                node.childNodes.forEach(child => traverse(child));

                if (currentLength < length) {
                  truncatedHtml += `</${element.tagName}>`;
                }
            }
        }

        traverse(tempDiv);
        return truncatedHtml + (currentLength >= length ? '...' : '');
    };

    const displayedContent = isLongComment && !isExpanded
        ? getTruncatedHtml(sanitizedContent, MAX_COMMENT_LENGTH)
        : sanitizedContent;

    return (
        <div className="text-sm p-2 border-2 border-black bg-gray-100">
            <div className="prose prose-sm max-w-none break-words">
                <strong className="font-bold">{comment.authorName || 'Anonymous'}:</strong>
                <div dangerouslySetInnerHTML={{ __html: displayedContent }} className="inline" />
            </div>

            {isLongComment && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                >
                    {isExpanded ? 'Show Less' : 'Read More'}
                </button>
            )}
            <p className="text-xs text-gray-500 mt-1">
                {new Date(comment.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
    );
};
