import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QuillEditor } from './QuillEditor';
import type { Lecturer, NewReviewData, University, Course } from '../types';
import { StarRatingInput } from './StarRatingInput';
import { Modal } from './Modal';
import { useAppContext } from '../contexts/AppContext';
import { useOnClickOutside } from '../hooks/useClickOutside';

interface PostReviewModalProps {
  onClose: () => void;
  onPostReview: (data: NewReviewData) => void;
  universities: University[];
  isSubmitting: boolean;
  initialLecturer?: { id: number | string, name: string, university_id?: string, universityId?: string } | null;
}

const removeDiacritics = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const MAX_REVIEW_LENGTH = 10000;

export const PostReviewModal: React.FC<PostReviewModalProps> = ({ onClose, onPostReview, universities, isSubmitting, initialLecturer }) => {
  const { allLecturers, allCourses, selectedUniversityId } = useAppContext();

  const [modalUniversityId, setModalUniversityId] = useState<string>(initialLecturer?.universityId || initialLecturer?.university_id || selectedUniversityId || '');
  const [lecturerId, setLecturerId] = useState<string>(initialLecturer?.id ? String(initialLecturer.id) : '');
  const [courseName, setCourseName] = useState('');
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [contentLength, setContentLength] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // --- Lecturer Search State ---
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [isLecturerDropdownOpen, setLecturerDropdownOpen] = useState(false);
  const [lecturerInputValue, setLecturerInputValue] = useState(initialLecturer?.name || '');
  const lecturerDropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(lecturerDropdownRef, () => setLecturerDropdownOpen(false));

  // --- Course Search State ---
  const [courseSearch, setCourseSearch] = useState('');
  const [isCourseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [courseInputValue, setCourseInputValue] = useState('');
  const courseDropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(courseDropdownRef, () => setCourseDropdownOpen(false));

  // --- Derived Data ---
  const universityLecturers = useMemo(() => {
    if (!modalUniversityId) return [];
    return allLecturers.filter(l => String(l.universityId || (l as any).university_id) === String(modalUniversityId));
  }, [allLecturers, modalUniversityId]);

  const filteredLecturers = useMemo(() => {
    if (!lecturerSearch) return universityLecturers;
    const normalizedSearch = removeDiacritics(lecturerSearch.toLowerCase());
    return universityLecturers.filter(l => 
      removeDiacritics(l.name.toLowerCase()).includes(normalizedSearch)
    );
  }, [universityLecturers, lecturerSearch]);

  const universityCourses = useMemo(() => {
    if (!modalUniversityId) return [];
    return allCourses.filter(c => String(c.universityId || (c as any).university_id) === String(modalUniversityId));
  }, [allCourses, modalUniversityId]);

  const filteredCourses = useMemo(() => {
    if (!courseSearch) return universityCourses;
    const normalizedSearch = removeDiacritics(courseSearch.toLowerCase());
    return universityCourses.filter(c => 
      removeDiacritics(c.name.toLowerCase()).includes(normalizedSearch)
    );
  }, [universityCourses, courseSearch]);


  // --- Effects ---
  // Reset selections when university changes
  const previousUniversityId = useRef(modalUniversityId);
  useEffect(() => {
    if (previousUniversityId.current !== modalUniversityId) {
      setLecturerId('');
      setLecturerInputValue('');
      setCourseName('');
      setCourseInputValue('');
      previousUniversityId.current = modalUniversityId;
    }
  }, [modalUniversityId]);

  // Sync lecturer input with selection
  useEffect(() => {
    if (lecturerId) {
      const lecturer = universityLecturers.find(l => String(l.id) === lecturerId);
      if (lecturer) {
        setLecturerInputValue(lecturer.name);
      } else if (initialLecturer && String(initialLecturer.id) === lecturerId) {
        setLecturerInputValue(initialLecturer.name);
      } else {
        setLecturerInputValue('');
      }
    } else {
      setLecturerInputValue('');
    }
  }, [lecturerId, universityLecturers, initialLecturer]);

  // Sync course input with selection
  useEffect(() => {
    setCourseInputValue(courseName);
  }, [courseName]);


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const isContentEmpty = contentLength === 0;

    if (!modalUniversityId || !lecturerId || !courseName || rating === 0 || isContentEmpty) {
      setError('Please fill out all fields, including the rating.');
      return;
    }

    if (contentLength > MAX_REVIEW_LENGTH) {
        setError(`Review is too long. Please shorten it to under ${MAX_REVIEW_LENGTH} characters.`);
        return;
    }

    setError(null);

    const newReview = {
      lecturerId: parseInt(lecturerId, 10),
      courseName,
      rating,
      content,
      createdAt: new Date().toISOString(),
    } as NewReviewData;
    
    onPostReview(newReview);
  };

  return (
    <Modal title="Post a Review" onClose={onClose}>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
            {/* Content Area - Scrollable */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-grow">
                {error && <div className="p-2 bg-red-500 text-white border-2 border-black font-bold">{error}</div>}
                
                <div>
                    <label htmlFor="universityId" className="block font-bold mb-1 uppercase text-sm">University</label>
                    <select
                        id="universityId"
                        value={modalUniversityId}
                        onChange={(e) => setModalUniversityId(e.target.value)}
                        className={`w-full p-2 bg-white border-2 border-black text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${!modalUniversityId ? 'text-gray-500' : ''}`}
                        required
                    >
                        <option value="" disabled hidden>Choose an university</option>
                        {universities.map(uni => (
                            <option key={uni.id} value={uni.id} className="text-black">{uni.name}</option>
                        ))}
                    </select>
                </div>

                <div className="relative" ref={lecturerDropdownRef}>
                    <label htmlFor="lecturer-search" className="block font-bold mb-1 uppercase text-sm">Lecturer</label>
                    <input
                        id="lecturer-search"
                        type="text"
                        value={lecturerInputValue}
                        onChange={(e) => {
                            setLecturerInputValue(e.target.value);
                            setLecturerSearch(e.target.value);
                            if (lecturerId) setLecturerId('');
                        }}
                        onFocus={() => {
                            setLecturerSearch('');
                            setLecturerDropdownOpen(true);
                        }}
                        placeholder="Select or type to search..."
                        className={`w-full p-2 bg-white border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${!lecturerId ? 'text-gray-500' : ''}`}
                        disabled={universityLecturers.length === 0}
                        required
                    />
                    {isLecturerDropdownOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-white border-2 border-black max-h-60 overflow-y-auto">
                            {filteredLecturers.length > 0 ? (
                                filteredLecturers.map(lecturer => (
                                    <div
                                        key={lecturer.id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer text-black"
                                        onClick={() => {
                                            setLecturerId(lecturer.id.toString());
                                            setLecturerDropdownOpen(false);
                                        }}
                                    >
                                        {lecturer.name}
                                    </div>
                                ))
                            ) : (
                                <div className="p-2 text-gray-500">No lecturers found.</div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="relative" ref={courseDropdownRef}>
                    <label htmlFor="course-search" className="block font-bold mb-1 uppercase text-sm">Course Name</label>
                    <input
                        id="course-search"
                        type="text"
                        value={courseInputValue}
                        onChange={(e) => {
                            setCourseInputValue(e.target.value);
                            setCourseSearch(e.target.value);
                            if (courseName) setCourseName('');
                        }}
                        onFocus={() => {
                            setCourseSearch('');
                            setCourseDropdownOpen(true);
                        }}
                        placeholder="Select or type to search..."
                        className={`w-full p-2 bg-white border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${!courseName ? 'text-gray-500' : ''}`}
                        disabled={universityCourses.length === 0}
                        required
                    />
                    {isCourseDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border-2 border-black max-h-60 overflow-y-auto">
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map(course => (
                                    <div
                                        key={course.id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer text-black"
                                        onClick={() => {
                                            setCourseName(course.name);
                                            setCourseDropdownOpen(false);
                                        }}
                                    >
                                        {course.name}
                                    </div>
                                ))
                            ) : (
                                <div className="p-2 text-gray-500">No courses found.</div>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block font-bold mb-1 uppercase text-sm">Rating</label>
                    <StarRatingInput rating={rating} setRating={setRating} />
                </div>

                <div>
                    <label className="block font-bold mb-1 uppercase text-sm">Review</label>
                    <div className="quill-editor-container">
                        <QuillEditor
                            value={content}
                            onChange={(html, length) => {
                                setContent(html);

                                setContentLength(length);
                            }}
                            placeholder="Share your thoughts on the course and lecturer..."
                        />
                    </div>
                     <div className={`text-sm text-right px-1 ${contentLength > MAX_REVIEW_LENGTH ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                        {contentLength} / {MAX_REVIEW_LENGTH}
                    </div>
                </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 p-4 border-t-2 border-black bg-gray-50">
                <button
                    type="submit"
                    className="w-full p-3 bg-black text-white font-bold uppercase border-2 border-black hover:bg-gray-800 active:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !lecturerId || !courseName || contentLength > MAX_REVIEW_LENGTH}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </div>
        </form>
    </Modal>
  );
};