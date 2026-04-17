import React from 'react';
import type { Lecturer, Review, University, Comment } from '../types';
import { LecturerReviewCard } from './LecturerReviewCard';
import emptyLecturersImg from '../assets/images/empty_lecturers.webp';

interface FilteredData {
    lecturer: Lecturer;
    reviews: Review[];
}

interface ReviewSectionProps {
    data: FilteredData[];
    universities: University[];
    onAddComment: (reviewId: number, content: string) => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ data, universities, onAddComment }) => {
    const universityMap = new Map(universities.map(uni => [uni.id, uni]));

    return (
        <div>
            {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 my-8 border-[3px] border-black bg-blue-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] duration-200 ease-in-out">
                    <img 
                      src={emptyLecturersImg} 
                      alt="No lecturers found" 
                      className="w-56 h-56 mb-6 object-contain mix-blend-multiply" 
                      loading="lazy" 
                      decoding="async" 
                    />
                    <h3 className="text-2xl font-bold text-black uppercase mb-2 tracking-tight">It's empty in here!</h3>
                    <p className="text-black font-medium text-lg max-w-md text-center">No lecturers found. Try a different filter or search term.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {data.map(({ lecturer, reviews }) => {
                        const university = universityMap.get(lecturer.universityId);
                        return (
                            <LecturerReviewCard
                                key={lecturer.id}
                                lecturer={lecturer}
                                reviews={reviews || []} // Ensure reviews is always an array
                                university={university}
                                
                                onAddComment={onAddComment}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};