import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { API_BASE_URL } from '../constants';
import type { Document, Review, University, AdvancedSearchFilters, Lecturer, Course, LecturerWithReviews, DownloadTask } from '../types';
import { getActiveHolidayTheme, HolidayTheme } from '../holiday-config';

interface AppContextType {
    documents: Document[];
    universities: University[];
    allLecturers: Lecturer[];
    allCourses: Course[];
    loading: boolean;
    totalPages: number;
    currentPage: number;
    fetchDocuments: (page: number) => void;
    refreshDocuments: () => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchInput: string;
    setSearchInput: (term: string) => void;
    executeSearch: () => void;
    selectedUniversityId: string | null;
    selectUniversity: (id: string | null) => void;
    getDocument: (param: number | string) => Promise<Document | undefined>;
    getReviews: (universityId: string | null, filters: AdvancedSearchFilters, page: number) => Promise<LecturerWithReviews[]>;
    setUniversityContext: (id: string | null) => void;
    holidayTheme: HolidayTheme | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [universities, setUniversities] = useState<University[]>([]);
    const [allLecturers, setAllLecturers] = useState<Lecturer[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const initialParams = new URLSearchParams(location.search);

    const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(initialParams.get('universityId'));
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState<number>(parseInt(initialParams.get('page') || '1', 10));
    const [searchTerm, setSearchTerm] = useState(initialParams.get('q') || '');
    const [searchInput, setSearchInput] = useState(initialParams.get('q') || '');
    const [documentsCache, setDocumentsCache] = useState(new Map());
    const [documentDetailCache, setDocumentDetailCache] = useState(new Map());
    const [reviewsCache, setReviewsCache] = useState(new Map());
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [holidayTheme, setHolidayTheme] = useState<HolidayTheme | null>(null);

    useEffect(() => {
        const fetchTheme = async () => {
          const theme = await getActiveHolidayTheme();
          setHolidayTheme(theme);
        };
        fetchTheme();
      }, []);


    // Effect to read universityId and page from URL on mount and URL changes
    useEffect(() => {
        // Only sync from URL on the documents list page to avoid conflicts on detail pages.
        if (location.pathname === '/' || location.pathname === '/documents') {
            const params = new URLSearchParams(location.search);
            const uniIdFromUrl = params.get('universityId');
            const pageFromUrl = parseInt(params.get('page') || '1', 10);
            const searchFromUrl = params.get('q') || '';

            // Update selectedUniversityId if different from current state
            if (uniIdFromUrl !== selectedUniversityId) {
                setSelectedUniversityId(uniIdFromUrl);
            }
            // Update currentPage if different from current state
            if (pageFromUrl !== currentPage) {
                setCurrentPage(pageFromUrl);
            }
            // Update searchTerm if different from current state
            if (searchFromUrl !== searchTerm) {
                setSearchTerm(searchFromUrl);
                setSearchInput(searchFromUrl);
            }
        }
    }, [location.pathname, location.search, currentPage, selectedUniversityId, searchTerm]); // Depend on location.pathname now

    const refreshDocuments = useCallback(() => {
        setDocumentsCache(new Map()); // Clear cache
        setRefreshCounter(prev => prev + 1); // Trigger refresh
    }, []);

    useEffect(() => {
        const loadStaticData = async () => {
            try {
                const [unis, lecturers, courses] = await Promise.all([
                    api.getUniversities(),
                    api.getLecturers(),
                    api.getCourses()
                ]);

                // Sort lecturers: "Không rõ giảng viên" first, then alphabetically
                lecturers.sort((a, b) => {
                    if (a.name === 'Không rõ giảng viên') return -1;
                    if (b.name === 'Không rõ giảng viên') return 1;
                    return a.name.localeCompare(b.name);
                });

                // Sort courses: "Không rõ môn học" first, then alphabetically
                courses.sort((a, b) => {
                    if (a.name === 'Không rõ môn học') return -1;
                    if (b.name === 'Không rõ môn học') return 1;
                    return a.name.localeCompare(b.name);
                });

                setUniversities(unis);
                setAllLecturers(lecturers);
                setAllCourses(courses);

            } catch (error) {
                console.error("Failed to fetch static data", error);
            }
        };
        loadStaticData();
    }, []);

    const executeSearch = () => {
        const params = new URLSearchParams(location.search);
        if (searchInput) {
            params.set('q', searchInput);
        } else {
            params.delete('q');
        }
        params.delete('page'); // Reset page to 1
        navigate(`${location.pathname}?${params.toString()}`);
        setSearchTerm(searchInput);
        setCurrentPage(1);
    };

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const loadDocuments = async () => {
            const cacheKey = `${selectedUniversityId || 'all'}-${currentPage}-${searchTerm}`;
            if (documentsCache.has(cacheKey)) {
                const cachedData = documentsCache.get(cacheKey);
                setDocuments(cachedData.data);
                setTotalPages(cachedData.totalPages);
                setLoading(false); // Ensure loading is turned off when using cache
                return;
            }

            setLoading(true);
            try {
                const { data, totalPages: newTotalPages } = await api.getDocuments(currentPage, selectedUniversityId, searchTerm, 12, signal);
                
                if (!signal.aborted) {
                    setDocumentsCache(prevCache => new Map(prevCache).set(cacheKey, { data, totalPages: newTotalPages }));
                    setDocuments(data);
                    setTotalPages(newTotalPages);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("Failed to fetch documents", error);
                    setDocuments([]);
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        };

        if (location.pathname === '/' || location.pathname.startsWith('/documents')) {
            loadDocuments();
        }

        return () => {
            controller.abort();
        };
    }, [selectedUniversityId, currentPage, searchTerm, documentsCache, refreshCounter, location.pathname]);

    const fetchDocuments = (page: number) => {
        const params = new URLSearchParams(location.search);
        params.set('page', page.toString());
        // Preserve universityId if it's in the URL
        if (selectedUniversityId) {
            params.set('universityId', selectedUniversityId);
        }
        // Preserve search term if it exists
        if (searchTerm) {
            params.set('q', searchTerm);
        }
        navigate(`${location.pathname}?${params.toString()}`);
    };

    const selectUniversity = (id: string | null) => {
        if (id !== selectedUniversityId) {
            setLoading(true); // Immediately set loading to true
            setDocuments([]); // Clear old documents
            setTotalPages(1);
            setCurrentPage(1);
            setSelectedUniversityId(id);

            const params = new URLSearchParams(location.search);
            if (id) {
                params.set('universityId', id);
            } else {
                params.delete('universityId');
            }
            params.delete('page'); // Reset page when university changes
            
            navigate(`${location.pathname}?${params.toString()}`);
        }
    };

    const setUniversityContext = (id: string | null) => {
        if (id !== selectedUniversityId) {
            setSelectedUniversityId(id);
        }
    };

    const getDocument = async (param: number | string) => {
        if (documentDetailCache.has(param)) {
            return documentDetailCache.get(param);
        }
        try {
            const document = await api.getDocumentByParam(param);
            if (document) {
                // Cache by both slug and id to be robust
                setDocumentDetailCache(prevCache => new Map(prevCache).set(document.id, document));
                if (document.slug) {
                    setDocumentDetailCache(prevCache => new Map(prevCache).set(document.slug, document));
                }
            }
            return document;
        } catch (error) {
            console.error(`Failed to fetch document ${param}`, error);
            return undefined;
        }
    };

    const getReviews = async (universityId: string | null, filters: AdvancedSearchFilters, page: number): Promise<LecturerWithReviews[]> => {
        const cacheKey = `${universityId || 'all'}-${JSON.stringify(filters)}-${page}`;
        if (reviewsCache.has(cacheKey)) {
            return reviewsCache.get(cacheKey);
        }
        const reviews = await api.getReviews(universityId, filters, page);
        setReviewsCache(prev => new Map(prev).set(cacheKey, reviews));
        return reviews;
    };

    return (
        <AppContext.Provider value={{
            documents,
            universities,
            allLecturers,
            allCourses,
            loading,
            totalPages,
            currentPage,
            fetchDocuments,
            refreshDocuments,
            searchTerm,
            setSearchTerm,
            searchInput,
            setSearchInput,
            executeSearch,
            selectedUniversityId,
            selectUniversity,
            getDocument,
            getReviews,
            setUniversityContext,
            holidayTheme,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};