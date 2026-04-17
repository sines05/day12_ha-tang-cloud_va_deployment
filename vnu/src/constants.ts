import { DocumentCategory } from './types';

// The base URL for the Cloudflare Worker backend.
// For local development with `wrangler dev`, this is the default address.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787/api';

// This is static UI data, so it can remain here.
export const DOCUMENT_CATEGORIES: { id: DocumentCategory, name: string }[] = [
    { id: 'LECTURE', name: 'Lecture Notes' },
    { id: 'EXAM', name: 'Exam Paper' },
    { id: 'SYLLABUS', name: 'Syllabus' },
    { id: 'OTHER', name: 'Other' },
];