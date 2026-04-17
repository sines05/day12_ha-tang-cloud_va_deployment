import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env } from './index';
import type { Review } from '../types'; // Assuming a base Review type exists

// --- Re-defining types to match the RPC function outputs ---

export interface LecturerDetails {
    id: number;
    name: string;
    slug: string;
    university_id: string;
    email?: string;
    scholar_link?: string;
    linkedin_link?: string;
    website_link?: string;
    avatar_url?: string;
    universityName?: string;
    abbreviation?: string;
    averageRating?: number;
    totalReviews?: number;
}

export interface PaginatedReviewsData {
    data: Review[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        limit: number;
    };
}

// Helper to create Supabase client
const getSupabaseClient = (env: Env): SupabaseClient => {
    return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
};

/**
 * Fetches detailed information for a single lecturer by ID using the RPC function.
 */
export async function getLecturerDetailsById(env: Env, lecturerId: number): Promise<LecturerDetails | null> {
    const supabase = getSupabaseClient(env);

    const { data, error } = await supabase
        .rpc('get_lecturer_details', { lecturer_id_input: lecturerId })
        .single(); // .single() expects one row, perfect for this

    if (error) {
        console.error('Error fetching lecturer details via RPC:', error);
        throw error;
    }

    return data as LecturerDetails | null;
}

/**
 * Fetches paginated reviews for a specific lecturer ID using the RPC function.
 */
export async function getPaginatedReviewsByLecturerId(env: Env, lecturerId: number, page: number, limit: number): Promise<PaginatedReviewsData> {
    const supabase = getSupabaseClient(env);
    
    const { data, error } = await supabase
        .rpc('get_lecturer_reviews_paginated', {
            lecturer_id_input: lecturerId,
            page_input: page,
            limit_input: limit,
        })
        .single(); // .single() because our function returns one JSON object

    if (error) {
        console.error('Error fetching paginated reviews via RPC:', error);
        throw error;
    }

    // The RPC function returns the exact shape we need
    return data as PaginatedReviewsData;
}
