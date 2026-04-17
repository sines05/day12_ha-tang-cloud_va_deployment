import React from 'react';

export const FilePdfIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="M10.4 17.5c.3-.3.4-.7.4-1.1v-1.4c0-.4-.1-.8-.4-1.1a1.5 1.5 0 0 0-1.1-.4H8v4h1.3c.4 0 .8-.1 1.1-.4zM8 13.5h1.3c.3 0 .5.1.7.3s.3.4.3.7v1c0 .3-.1.5-.3.7s-.4.3-.7.3H8v-3z"></path>
        <path d="M12.2 17.5h1.6"></path><path d="M13 13.5v4"></path>
        <path d="M16 17.5h1.5v-3h-1.5z"></path>
        <path d="M16 16h1"></path>
    </svg>
);