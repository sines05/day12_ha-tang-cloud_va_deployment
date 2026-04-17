import { API_BASE_URL } from '../constants';
import type { University, Document, Review, Comment, NewDocumentData, NewReviewData, LecturerWithReviews, AdvancedSearchFilters, LecturerDetails, PaginatedReviewsData, Course } from '../types';

export class HttpError extends Error {
    public readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}

/**
 * A helper function to handle fetch requests and JSON parsing.
 * @param url The URL to fetch.
 * @param options The fetch options.
 * @returns The JSON response.
 */
const fetchJson = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Request failed with status ' + response.status }));
        throw new HttpError(errorBody.error || 'An unknown error occurred', response.status);
    }
    return response.json();
};

export const api = {
    /**
     * Fetches all universities.
     */
    getUniversities: (): Promise<University[]> => {
        return fetchJson(`${API_BASE_URL}/universities`);
    },

    /**
     * Fetches a paginated list of documents.
     * @param page The page number to fetch.
     * @param universityId Optional university ID to filter by.
     */
    getDocuments: (page = 1, universityId: string | null = null, searchTerm: string = '', limit: number = 12, signal?: AbortSignal): Promise<{ data: Document[], totalPages: number }> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (universityId) params.append('universityId', universityId);
        if (searchTerm) params.append('searchTerm', searchTerm);
        return fetchJson(`${API_BASE_URL}/documents?${params.toString()}`, { signal });
    },

    /**
     * Fetches a single document by its ID or slug.
     * @param param The ID or slug of the document.
     */
    getDocumentByParam: (param: number | string): Promise<Document> => {
        return fetchJson(`${API_BASE_URL}/documents/${param}`);
    },

    /**
     * Fetches reviews, grouped by lecturer.
     * @param universityId Optional university ID to filter by.
     * @param searchTerm Optional search term.
     */
    getReviews: (
        universityId: string | null,
        filters: AdvancedSearchFilters,
        page: number // Add page parameter
    ): Promise<LecturerWithReviews[]> => {
        const params = new URLSearchParams();
        if (universityId) params.append('universityId', universityId);
        if (filters.lecturer) params.append('lecturerName', filters.lecturer);
        if (filters.course) params.append('courseName', filters.course);
        if (filters.content) params.append('reviewContent', filters.content);
        params.append('page', page.toString()); // Add page to params
        return fetchJson(`${API_BASE_URL}/reviews?${params.toString()}`);
    },

    /**
     * Fetches all lecturers, optionally filtered by university.
     * @param universityId Optional university ID to filter by.
     */
    getLecturers: (universityId: string | null = null): Promise<Lecturer[]> => {
        const params = new URLSearchParams();
        if (universityId) params.append('universityId', universityId);
        return fetchJson(`${API_BASE_URL}/lecturers?${params.toString()}`);
    },

    /**
    * NEW: Fetches detailed information for a single lecturer.
    * @param lecturerId The ID of the lecturer.
    */
    getLecturerDetails: (lecturerId: number): Promise<LecturerDetails> => {
        return fetchJson(`${API_BASE_URL}/lecturers/${lecturerId}`);
    },

    /**
     * NEW: Fetches paginated reviews for a single lecturer.
     * @param lecturerId The ID of the lecturer.
     * @param page The page number for the reviews.
     */
    getLecturerReviews: (lecturerId: number, page: number = 1, limit: number = 10): Promise<PaginatedReviewsData> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        return fetchJson(`${API_BASE_URL}/lecturers/${lecturerId}/reviews?${params.toString()}`);
    },

    /**
     * Fetches all courses.
     */
    getCourses: (): Promise<Course[]> => {
        return fetchJson(`${API_BASE_URL}/courses`);
    },

    /**
     * Posts a new review.
     * @param reviewData The review data to post.
     */
    postReview: (reviewData: NewReviewData): Promise<{ message: string }> => {
        return fetchJson(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reviewData),
        });
    },

    /**
     * Posts a new comment.
     * @param commentData The comment data to post.
     */
    postComment: (commentData: { reviewId: number; content: string }): Promise<{ message: string }> => {
        return fetchJson(`${API_BASE_URL}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commentData),
        });
    },

    /**
     * Fetches the detailed metadata for a single file, including its parts for download.
     * @param fileId The ID of the file.
     * @param turnstileToken Optional Turnstile token for verification.
     */
    getDocumentDetails: (fileId: number, turnstileToken?: string): Promise<DocumentDetails> => {
        const headers: Record<string, string> = {};
        if (turnstileToken) {
            headers['CF-Turnstile-Response'] = turnstileToken;
        }
        return fetchJson(`${API_BASE_URL}/documents/details/${fileId}`, { headers });
    },


};