export interface University {
  id: string;
  name: string;
  abbreviation: string;
}

export type FileType = 'PDF' | 'DOCX' | 'PPTX' | 'PPT' | 'ZIP' | 'JPEG' | 'PNG' | 'GIF' | 'VIDEO' | 'TXT' | 'HTML' | 'XLSX' | 'CSV' | 'RAR' | 'DOC' | 'IPYNB';

export const StandardSectionTitles = [
  "Bài giảng",
  "Giáo trình",
  "Đề thi",
  "Bài tập",
  "Hướng dẫn / Lời giải",
  "Báo cáo thí nghiệm",
  "Khác"
] as const;

export type StandardSectionTitle = typeof StandardSectionTitles[number];

export interface DocumentFile {
    id: number;
    name: string;
    url: string;
    fileType: FileType;
    size: number; // in KB
}

export interface DocumentSection {
    title: StandardSectionTitle;
    files: DocumentFile[];
}

export interface Document {
  id: number;
  title:string;
  universityId: string;
  courseCode?: string;
  courseName: string;
  lecturerName?: string;
  description?: string;
  createdAt: string; // ISO 8601 date string
  sections: DocumentSection[];
}

export type DocumentCategory = 'LECTURE' | 'EXAM' | 'SYLLABUS' | 'OTHER';

// This type is specifically for the new Upload Modal form data
export interface NewDocumentData {
  title: string;
  courseCode?: string;
  courseName: string;
  universityId: string;
  lecturerName?: string;
  description?: string;
  sections: {
    title: StandardSectionTitle;
    files: File[];
  }[];
}


export interface Lecturer {
    id: number;
    name: string;
    universityId: string;
}

export interface Course {
    id: number;
    name: string;
    code?: string;
    universityId: string; // A course still belongs to a university, even if names overlap
}

export interface Comment {
    id: number;
    reviewId: number;
    authorName: string;
    content: string;
    createdAt: string;
}

export interface Review {
    id: number;
    lecturerId: number;
    courseName?: string;
    rating: number; // 1-5
    content: string;
    createdAt: string;
    comments?: Comment[];
}

export type NewReviewData = Omit<Review, 'id' | 'date' | 'comments'>;

export interface AdvancedSearchFilters {
    lecturer: string;
    course: string;
    content: string;
}



// The data structure for reviews, grouped by lecturer, from the backend RPC call

export interface LecturerWithReviews {

  lecturerId: number;

  lecturerName: string;

  universityId: string;

  reviews: Review[];

}



// --- Download Manager Types ---



export type DownloadStatus = 'pending' | 'starting' | 'downloading' | 'assembling' | 'done' | 'error' | 'cancelled';



export interface DownloadTask {

    fileId: number;

    fileName: string;

    status: DownloadStatus;

    progress: number; // 0-100

    error?: string;

}



export interface DocumentDetails {

    fileName: string;

    totalSizeKB: number;

    isMultipart: boolean;

    parts: string[]; // Array of Telegram part IDs

}
