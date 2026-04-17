import React, { useState, useEffect, useRef } from 'react';
import { University, FileType, Lecturer, Course, StandardSectionTitles, StandardSectionTitle } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { Modal } from './Modal';
import { CloseIcon } from './icons/CloseIcon';
import { FileTypeIcon } from './FileTypeIcon';
import { useOnClickOutside } from '../hooks/useClickOutside';
import { useAppContext } from '../contexts/AppContext';
import { API_BASE_URL } from '../constants';

// --- NEW: WebSocket Upload Constants and API Calls ---
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
const CHUNK_SIZE = 19 * 1024 * 1024; // 19MB, slightly less than Telegram's 20MB limit for safety
const CONCURRENCY_LIMIT = 5; // Max parallel chunk uploads
const UPLOAD_RETRY_LIMIT = 20;

interface InitResponse {
  documentId: number;
  sections: { tempId: number; sectionId: number }[];
}

// Calls the new /init endpoint
const initDocument = async (data: {
    title: string;
    description: string;
    universityId: string;
    courseId: string;
    lecturerId: string;
    sections: { tempId: number, title: string }[];
}): Promise<InitResponse> => {
    const response = await fetch(`${API_BASE_URL}/documents/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to initialize document' }));
        throw new Error(error.error);
    }
    return response.json();
};

// Calls the new /create endpoint for a single file
const createDocumentFile = async (data: {
    section_id: number;
    name: string;
    file_type: string;
    size_kb: number;
    part_ids: string;
    is_multipart: boolean;
}): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/document-files/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create document file record' }));
        throw new Error(error.error);
    }
    return response.json();
};


interface UploadModalProps {
  onClose: () => void;
  universities: University[];
}

interface FormSection {
    id: number;
    title: StandardSectionTitle | '';
    files: File[];
}

const MAX_FILE_SIZE_MB = 200;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_MB = 10240;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv', // .csv
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint', // .ppt
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.rar', // .rar
    'application/x-rar-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/html',
    'application/x-ipynb+json', // .ipynb
    'application/json',
];

const fileInputAccept = ALLOWED_MIME_TYPES.join(',');

const getFileTypeEnum = (mimeType: string): FileType | null => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    if (mimeType === 'application/msword') return 'DOC';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'XLSX';
    if (mimeType === 'text/csv') return 'CSV';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'PPTX';
    if (mimeType === 'application/vnd.ms-powerpoint') return 'PPT';
    if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed' || mimeType === 'application/vnd.rar' || mimeType === 'application/x-rar-compressed') return 'RAR';
    if (mimeType === 'image/jpeg') return 'JPEG';
    if (mimeType === 'image/png') return 'PNG';
    if (mimeType === 'image/gif') return 'GIF';
    if (mimeType === 'text/plain') return 'TXT';
    if (mimeType === 'text/html') return 'HTML';
    if (mimeType === 'application/x-ipynb+json' || mimeType === 'application/json') return 'IPYNB';
    return null;
};

const PROVERBS = [
    { text: "Kiến tha cũng lâu đầy tổ.", origin: "Tục ngữ Việt Nam" },
    { text: "Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.", origin: "Tục ngữ Việt Nam" },
    { text: "Bộ lông làm đẹp con công, học vấn làm đẹp con người.", origin: "Ngạn ngữ Nga" },
    { text: "Người ta không thể học được cách cưỡi ngựa mà không bị ngã.", origin: "Ngạn ngữ Mông Cổ" },
    { text: "Người thực sự có giáo dục là người biết giáo dục mình.", origin: "Ngạn ngữ Anh" },
    { text: "Thế giới là một đóa hồng, hãy tận hưởng hương thơm và trao nó cho bè bạn.", origin: "Ngạn ngữ Ba Tư" },
    { text: "Khi ta tặng bạn hoa hồng, tay ta còn vương mãi mùi hương.", origin: "Ngạn ngữ Bungari" },
    { text: "Không phải sức lực mà lòng kiên nhẫn đã làm nên những công trình vĩ đại.", origin: "Ngạn ngữ Anh" },
    { text: "Hãy học cái khôn ngoan từ muôn vàn cái ngu của kẻ khác.", origin: "Ngạn ngữ Anh" },
    { text: "Đừng để một ai chẳng nhận được gì khi rời chỗ bạn cho dù bạn biết rằng không bao giờ gặp lại.", origin: "Ngạn ngữ Pháp" },
    { text: "Sự học như bơi thuyền ngược nước, không tiến ắt phải lùi.", origin: "Ngạn ngữ Trung Quốc" },
    { text: "Không trải qua cực khổ. Sao học hết điều hay.", origin: "Ngạn ngữ Trung Quốc" },
    { text: "Đừng xấu hổ khi không biết chỉ xấu hổ khi không học.", origin: "Ngạn ngữ Nga" },
    { text: "Nếu muốn đi thật nhanh, hãy đi một mình. Nếu muốn đi thật xa, hãy đi cùng nhau.", origin: "Ngạn ngữ châu Phi" }
];

const getRandomProverb = () => {
    if (PROVERBS.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * PROVERBS.length);
    return PROVERBS[randomIndex];
};

const removeDiacritics = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, universities }) => {
  const { allCourses, allLecturers, refreshDocuments, selectedUniversityId } = useAppContext();

  // Form State
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [universityId, setUniversityId] = useState(selectedUniversityId || universities[0]?.id || '');
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<FormSection[]>([{ id: 1, title: '', files: [] }]);
  
  // UI State
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sectionInputValues, setSectionInputValues] = useState<Map<number, string>>(new Map()); // New state for input values

  // Dropdown states
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [isLecturerDropdownOpen, setLecturerDropdownOpen] = useState(false);
  const lecturerDropdownRef = React.useRef<HTMLDivElement>(null);
  const [lecturerInputValue, setLecturerInputValue] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseSearch, setCourseSearch] = useState('');
  const [isCourseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [courseInputValue, setCourseInputValue] = useState('');
  const courseDropdownRef = useRef<HTMLDivElement>(null);
  const [openSectionDropdown, setOpenSectionDropdown] = useState<number | null>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);

  // Dropdown logic
  const universityLecturers = React.useMemo(() => allLecturers.filter(l => l.universityId === universityId), [allLecturers, universityId]);
  const getLecturerName = (id: string | null) => {
    if (id === 'none' || !id) return '';
    return universityLecturers.find(l => l.id.toString() === id)?.name || '';
  }
  React.useEffect(() => { setLecturerInputValue(getLecturerName(selectedLecturerId)); }, [selectedLecturerId, universityLecturers]);
  useEffect(() => { setSelectedLecturerId(''); setSelectedCourseId(''); }, [universityId]);
  useOnClickOutside(lecturerDropdownRef, () => setLecturerDropdownOpen(false));
  useOnClickOutside(courseDropdownRef, () => setCourseDropdownOpen(false));
  useOnClickOutside(sectionsRef, () => setOpenSectionDropdown(null));
  useEffect(() => {
    if (selectedCourseId) {
        const course = allCourses.find(c => c.id.toString() === selectedCourseId);
        if (course) setCourseInputValue(course.name);
    } else {
        setCourseInputValue('');
    }
  }, [selectedCourseId, allCourses]);
  const filteredLecturers = universityLecturers.filter(lecturer =>
    removeDiacritics(lecturer.name.toLowerCase()).includes(removeDiacritics(lecturerSearch.toLowerCase()))
  );
  const filteredCourses = allCourses.filter(course =>
      course.universityId === universityId &&
      removeDiacritics(`${course.name} ${course.code}`.toLowerCase())
          .includes(removeDiacritics(courseSearch.toLowerCase()))
  );

  // Section and File Management
  const addSection = () => {
    const newSection = { id: Date.now(), title: '', files: [] };
    setSections(prev => [...prev, newSection]);
    setSectionInputValues(prev => new Map(prev).set(newSection.id, '')); // Initialize input value
  };
  const removeSection = (id: number) => {
    setSections(prev => prev.filter(s => s.id !== id));
    setSectionInputValues(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };
  const updateSectionTitle = (id: number, newTitle: StandardSectionTitle | '') => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    setSectionInputValues(prev => new Map(prev).set(id, newTitle)); // Keep input in sync
  };
  const removeFile = (sectionId: number, fileIndex: number) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, files: s.files.filter((_, i) => i !== fileIndex) } : s));
  };
  const handleFileChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incomingFiles = Array.from(e.target.files) as File[];
    const existingFiles = sections.find(s => s.id === id)?.files || [];
    let currentErrors: string[] = [];
    const invalidTypeFiles = incomingFiles.filter(file => !ALLOWED_MIME_TYPES.includes(file.type));
    if (invalidTypeFiles.length > 0) currentErrors.push(`Invalid file types: ${invalidTypeFiles.map(f => f.name).join(', ')}.`);
    const validTypedFiles = incomingFiles.filter(file => ALLOWED_MIME_TYPES.includes(file.type));
    const oversizedFiles = validTypedFiles.filter(file => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFiles.length > 0) currentErrors.push(`Files over ${MAX_FILE_SIZE_MB}MB: ${oversizedFiles.map(f => f.name).join(', ')}.`);
    const validSizedFiles = validTypedFiles.filter(file => file.size <= MAX_FILE_SIZE_BYTES);
    const duplicateFiles = validSizedFiles.filter(newFile => existingFiles.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size));
    if (duplicateFiles.length > 0) currentErrors.push(`Duplicate files: ${duplicateFiles.map(f => f.name).join(', ')}.`);
    const uniqueNewFiles = validSizedFiles.filter(newFile => !existingFiles.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size));
    setError(currentErrors.length > 0 ? currentErrors.join(' ') : null);
    e.target.value = '';
    setSections(prev => prev.map(s => s.id === id ? { ...s, files: [...s.files, ...uniqueNewFiles] } : s));
  };

  // --- NEW: WebSocket-based Submit Handler ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (uploadState === 'uploading') return;

    // --- Validation ---
    if (!title || !universityId) { setError('Please fill out Title and University.'); return; }
    const validSections = sections.filter(s => s.title.trim() && s.files.length > 0);
    if (sections.length === 0 || validSections.length !== sections.length) { setError('Each section must have a title and at least one file.'); return; }
    const allFiles = validSections.flatMap(section => section.files);
    if (allFiles.length === 0) { setError('Please add at least one file.'); return; }
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) { setError(`Total upload size exceeds the ${MAX_TOTAL_SIZE_MB}MB limit.`); return; }

    setUploadState('uploading');
    setUploadProgress(0);

    try {
        // 1. Initialize Document and Sections
        const sectionsWithTempIds = validSections.map(s => ({ tempId: s.id, title: s.title }));
        const initData = await initDocument({
            title,
            description,
            universityId,
            courseId: selectedCourseId,
            lecturerId: selectedLecturerId && selectedLecturerId !== 'none' ? selectedLecturerId : '',
            sections: sectionsWithTempIds,
        });
        const sectionIdMap = new Map(initData.sections.map(s => [s.tempId, s.sectionId]));
        let uploadedSize = 0;

        // 2. Process and upload all files
        const allFileUploadPromises = [];

        const processFile = async (file: File, section: FormSection) => {
            const realSectionId = sectionIdMap.get(section.id);
            if (!realSectionId) {
                throw new Error(`Could not find a matching database ID for section "${section.title}"`);
            }

            const updateProgress = (chunkSize: number) => {
                uploadedSize += chunkSize;
                const percentComplete = (uploadedSize / totalSize) * 100;
                setUploadProgress(percentComplete);
            };

            // HYBRID LOGIC: Choose upload method based on file size
            if (file.size < CHUNK_SIZE) {
                // Path for small files: uses fire-and-forget HTTP POST
                await uploadSimple(file, realSectionId, () => updateProgress(file.size));
            } else {
                // Path for large files: uses WebSocket streaming
                let finalPartIds: string[] = [];
                const totalParts = Math.ceil(file.size / CHUNK_SIZE);
                let allPartIds: string[] = [];

                for (let i = 0; i < totalParts; i += CONCURRENCY_LIMIT) {
                    const batchPromises: Promise<string>[] = [];
                    const batchEnd = Math.min(i + CONCURRENCY_LIMIT, totalParts);
                    
                    for (let j = i; j < batchEnd; j++) {
                        const start = j * CHUNK_SIZE;
                        const end = start + CHUNK_SIZE;
                        const chunk = file.slice(start, end);
                        const partName = `${file.name}.part${j + 1}`;
                        
                        const uploadPromise = uploadFileViaWebSocket(
                            chunk,
                            { docId: initData.documentId, partName: partName },
                            () => updateProgress(chunk.size)
                        );
                        batchPromises.push(uploadPromise);
                    }
                    const batchPartIds = await Promise.all(batchPromises);
                    allPartIds.push(...batchPartIds);
                }
                finalPartIds = allPartIds;

                // After a large file (and all its parts) is uploaded, create its record in the DB
                await createDocumentFile({
                    section_id: realSectionId,
                    name: file.name,
                    file_type: getFileTypeEnum(file.type) || 'UNKNOWN',
                    size_kb: Math.round(file.size / 1024),
                    part_ids: finalPartIds.join(','),
                    is_multipart: true,
                });
            }
        };

        for (const section of validSections) {
            for (const file of section.files) {
                await processFile(file, section);
            }
        }

        // Wait for all files to be processed and their DB records created
        await Promise.all(allFileUploadPromises);

        setUploadState('success');
        refreshDocuments();

    } catch (err: any) {
        setError(err.message || 'An unknown upload error occurred.');
        setUploadState('error');
        // TODO: Consider calling a cleanup endpoint on the backend if init succeeded but uploads failed.
    }
  };

  // New helper for simple HTTP uploads
  const uploadSimple = async (file: File, sectionId: number, onProgress: () => void): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('section_id', sectionId.toString());
    formData.append('file_type', getFileTypeEnum(file.type) || 'UNKNOWN');
    formData.append('size_kb', Math.round(file.size / 1024).toString());

    const response = await fetch(`${API_BASE_URL}/upload-simple`, {
        method: 'POST',
        body: formData,
    });

    if (response.status !== 202) {
        const error = await response.json().catch(() => ({ error: 'Simple upload failed to be accepted by the server.' }));
        throw new Error(error.error);
    }
    
    // Fire-and-forget: server accepted it, so we can update progress to 100%
    onProgress();
  };

  // USER'S TESTED AND PROVIDED VERSION
  // FINAL, ROBUST IMPLEMENTATION
  const uploadFileViaWebSocket = async (
    file: File | Blob,
    nameInfo: { docId: number, partName: string },
    onProgress: () => void
  ): Promise<string> => {
    
    // 1. "Dumb" inner function that tries to upload only ONCE.
    const tryUploadChunkOnce = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            const doName = `${nameInfo.docId}-${nameInfo.partName}-${file.size}-${Math.random()}`;
            const url = new URL(WS_BASE_URL + '/documents/upload');
            url.searchParams.set('doName', doName);
            const ws = new WebSocket(url.toString());

            ws.onopen = () => {
                ws.send(JSON.stringify({ action: 'start', fileName: nameInfo.partName, fileType: file.type, fileSize: file.size }));
                
                const reader = file.stream().getReader();
                const pump = () => {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            ws.send(JSON.stringify({ action: 'end' }));
                            return;
                        }
                        if (ws.readyState !== WebSocket.OPEN) {
                            reject(new Error('WebSocket closed during file stream.'));
                            return;
                        }
                        if (value) {
                            // CRITICAL FIX: Sub-chunk the data to respect WebSocket message size limits.
                            const SUB_CHUNK_SIZE = 16 * 1024; // Send in 16KB pieces
                            for (let i = 0; i < value.length; i += SUB_CHUNK_SIZE) {
                                ws.send(value.subarray(i, i + SUB_CHUNK_SIZE));
                            }
                        }
                        
                        // Backpressure handling: wait if the buffer is getting full.
                        if (ws.bufferedAmount > 1024 * 1024) { // 1MB buffer pressure
                            setTimeout(pump, 100);
                        } else {
                            pump();
                        }
                    }).catch(err => reject(new Error(`File stream reader error: ${err.message}`)));
                };
                pump();
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.status === 'success' && msg.partId) {
                        ws.close(1000, 'Upload successful');
                        resolve(msg.partId);
                    } else {
                        reject(new Error(msg.error || 'Unknown server error'));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse server message.'));
                }
            };

            ws.onerror = () => reject(new Error('WebSocket connection error.'));
            ws.onclose = (event) => {
                // A successful upload resolves via onmessage, so any close is considered a failure for this attempt.
                if (event.code !== 1000) {
                    reject(new Error(`WebSocket closed unexpectedly. Code: ${event.code}`));
                }
            };
        });
    };

    // 2. "Smart" outer function that handles retries using a simple loop.
    for (let attempt = 0; attempt < UPLOAD_RETRY_LIMIT; attempt++) {
        try {
            const partId = await tryUploadChunkOnce();
            // If we get here, the upload was successful.
            onProgress();
            return partId;
        } catch (error) {
            if (attempt === UPLOAD_RETRY_LIMIT - 1) {
                // This was the last attempt, throw the final error.
                throw new Error(`Upload failed for ${nameInfo.partName} after ${UPLOAD_RETRY_LIMIT} attempts.`);
            }
            // Wait with exponential backoff and jitter before the next loop iteration.
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await new Promise(res => setTimeout(res, delay));
        }
    }

    // This should be unreachable.
    throw new Error(`Upload logic failed unexpectedly for ${nameInfo.partName}.`);
  };


  // --- Render Logic ---
  const renderContent = () => {
    if (uploadState === 'success') {
      const randomProverb = getRandomProverb();
      return (
        <div className="p-6 text-center">
          <h3 className="text-2xl font-bold text-green-600">Cảm ơn bạn đã đóng góp!</h3>
          <p className="mt-2 text-gray-700">Tài liệu của bạn đang được xử lý và sẽ sớm có sẵn sau khi được kiểm duyệt.</p>
          {randomProverb && (
            <div className="mt-4">
              <p className="text-gray-600 italic">"{randomProverb.text}"</p>
              <p className="text-gray-500 text-sm mt-1">-- {randomProverb.origin} --</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="mt-6 w-full p-3 bg-black text-white font-bold uppercase border-2 border-black hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      );
    }

    if (uploadState === 'uploading' || uploadState === 'error') {
        return (
            <div className="p-6">
                <h3 className="text-lg font-bold text-center mb-4">{uploadState === 'uploading' ? 'Đang tải lên...' : 'Tải lên thất bại'}</h3>
                <div className="w-full bg-gray-200 rounded-full h-6 border-2 border-black overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-150 ${uploadState === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
                {uploadState === 'uploading' && <div className="text-center font-bold mt-2">{Math.round(uploadProgress)}%</div>}
                {uploadState === 'error' && (
                    <div className="mt-4 text-center text-red-600 font-bold p-2 border-2 border-red-500 bg-red-100">{error}</div>
                )}
                 <button
                    onClick={uploadState === 'error' ? () => { setUploadState('idle'); setError(null); } : onClose}
                    className="mt-6 w-full p-3 bg-black text-white font-bold uppercase border-2 border-black hover:bg-gray-800"
                >
                    {uploadState === 'error' ? 'Thử lại' : 'Hủy'}
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-grow" ref={sectionsRef}>
                <h3 className="font-bold uppercase text-lg border-b-2 border-black pb-1">Document Info</h3>
                
                <div>
                    <label htmlFor="title" className="block font-bold mb-1 uppercase text-sm">Tiêu đề</label>
                    <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 bg-white border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-blue-500" required maxLength={255} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative" ref={courseDropdownRef}>
                        <label htmlFor="course-search" className="block font-bold mb-1 uppercase text-sm">Môn học (Tùy chọn)</label>
                        <input
                            id="course-search"
                            type="text"
                            value={courseInputValue}
                            onChange={(e) => {
                                setCourseInputValue(e.target.value);
                                setCourseSearch(e.target.value);
                                if (selectedCourseId) setSelectedCourseId('');
                            }}
                            onFocus={() => {
                                setCourseSearch('');
                                setCourseDropdownOpen(true);
                            }}
                            placeholder="Type to search course..."
                            className="w-full p-2 bg-white border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                        {isCourseDropdownOpen && (
                            <div className="absolute z-20 w-full mt-1 bg-white border-2 border-black max-h-60 overflow-y-auto">
                                {filteredCourses.map(course => (
                                    <div
                                        key={course.id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                            setSelectedCourseId(course.id.toString());
                                            setCourseDropdownOpen(false);
                                        }}
                                    >
                                        {course.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                     <div>
                        <label htmlFor="universityId" className="block font-bold mb-1 uppercase text-sm">Trường</label>
                        <select id="universityId" value={universityId} onChange={(e) => setUniversityId(e.target.value)} className="w-full p-2 bg-white border-2 border-black text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500" required >
                            {universities.map(uni => <option key={uni.id} value={uni.id}>{uni.abbreviation}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="courseCode" className="block font-bold mb-1 uppercase text-sm">Mã môn học (Tùy chọn)</label>
                        <input id="courseCode" type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full p-2 bg-white border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., MAT101" />
                    </div>
                    <div className="relative" ref={lecturerDropdownRef}>
                        <label htmlFor="lecturer-search" className="block font-bold mb-1 uppercase text-sm">Giảng viên (Tùy chọn)</label>
                        <input
                            id="lecturer-search"
                            type="text"
                            value={lecturerInputValue}
                            onChange={(e) => {
                                setLecturerInputValue(e.target.value);
                                setLecturerSearch(e.target.value);
                                if (selectedLecturerId !== '') setSelectedLecturerId('');
                            }}
                            onFocus={() => {
                                setLecturerSearch('');
                                setLecturerDropdownOpen(true);
                            }}
                            placeholder="Choose or type to search..."
                            className="w-full p-2 bg-white border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {isLecturerDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border-2 border-black max-h-60 overflow-y-auto">
                                <div
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-black"
                                    onClick={() => {
                                        setSelectedLecturerId('none');
                                        setLecturerDropdownOpen(false);
                                    }}
                                >
                                    Không rõ
                                </div>
                                {filteredLecturers.map(lecturer => (
                                    <div
                                        key={lecturer.id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer text-black"
                                        onClick={() => {
                                            setSelectedLecturerId(lecturer.id.toString());
                                            setLecturerDropdownOpen(false);
                                        }}
                                    >
                                        {lecturer.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block font-bold mb-1 uppercase text-sm">Mô tả (Tùy chọn)</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 bg-white border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none" />
                </div>

                <h3 className="font-bold uppercase text-lg border-b-2 border-black pb-1">Files & Sections</h3>

                {error && (
                    <div className="bg-red-500 text-white border-2 border-black font-bold uppercase px-4 py-3 rounded relative mb-4" style={{ boxShadow: '4px 4px 0px #000' }} role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {sections.map((section, index) => (
                    <div key={section.id} className="p-4 border-2 border-dashed border-black bg-gray-50 space-y-3 relative">
                        {sections.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeSection(section.id)}
                                className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full border-2 border-black"
                                aria-label="Remove Section"
                            >
                                <TrashIcon />
                            </button>
                        )}
                        <div className="relative">
                            <label htmlFor={`sectionTitle-${section.id}`} className="block font-bold mb-1 uppercase text-sm">Đề mục {index + 1}</label>
                            <input
                                id={`sectionTitle-${section.id}`}
                                type="text"
                                value={sectionInputValues.get(section.id) || ''}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    setSectionInputValues(prev => new Map(prev).set(section.id, newValue));
                                    setOpenSectionDropdown(section.id); // Open dropdown on type
                                }}
                                onFocus={() => setOpenSectionDropdown(section.id)}
                                onBlur={() => {
                                    // When input loses focus, update the actual section title with the current input value
                                    // unless a dropdown item was just clicked (handled by onClick of dropdown item)
                                    // A small delay might be needed to allow onClick to fire first
                                    setTimeout(() => {
                                        if (openSectionDropdown === section.id) { // Only if dropdown is still open
                                            updateSectionTitle(section.id, sectionInputValues.get(section.id) || '');
                                            setOpenSectionDropdown(null);
                                        }
                                    }, 100); // Small delay
                                }}
                                className="w-full p-2 bg-white border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Chọn hoặc nhập một đề mục..."
                            />
                            {openSectionDropdown === section.id && (
                                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-black max-h-60 overflow-y-auto">
                                    {StandardSectionTitles.filter(titleOption =>
                                        titleOption.toLowerCase().includes((sectionInputValues.get(section.id) || '').toLowerCase())
                                    ).map(titleOption => (
                                        <div
                                            key={titleOption}
                                            className="p-2 font-bold hover:bg-gray-100 cursor-pointer"
                                            onMouseDown={(e) => e.preventDefault()} // Prevent input blur from closing dropdown immediately
                                            onClick={() => {
                                                updateSectionTitle(section.id, titleOption);
                                                setOpenSectionDropdown(null);
                                            }}
                                        >
                                            {titleOption}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {section.files.length > 0 && (
                            <ul className="space-y-1 text-sm">
                                {section.files.map((file, fileIdx) => (
                                    <li key={fileIdx} className="flex items-center justify-between bg-white p-1 border border-gray-300">
                                        <span className="flex items-center gap-2 truncate pr-2">
                                            {getFileTypeEnum(file.type) && <FileTypeIcon fileType={getFileTypeEnum(file.type) as FileType} className="h-5 w-5 flex-shrink-0" />}
                                            {file.name} ({(file.size/1024).toFixed(1)} KB)
                                        </span>
                                        <button type="button" onClick={() => removeFile(section.id, fileIdx)} className="text-red-600 hover:text-red-800 flex-shrink-0" aria-label={`Remove ${file.name}`}>
                                            <CloseIcon />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div>
                            <label htmlFor={`file-upload-${section.id}`} className="w-full cursor-pointer text-center block p-2 bg-blue-500 text-white border-2 border-black font-bold uppercase text-sm hover:bg-blue-600">
                                THÊM FILES
                            </label>
                            <input id={`file-upload-${section.id}`} type="file" multiple onChange={(e) => handleFileChange(section.id, e)} className="hidden" accept={fileInputAccept} />
                        </div>
                    </div>
                ))}
                
                <button
                    type="button"
                    onClick={addSection}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-yellow-300 text-black border-2 border-black font-bold uppercase text-sm hover:bg-yellow-400"
                >
                    <PlusIcon />
                    THÊM ĐỀ MỤC
                </button>
            </div>
            <div className="flex-shrink-0 p-4 border-t-2 border-black bg-gray-100">
                <button type="submit" className="w-full p-3 bg-black text-white font-bold uppercase border-2 border-black">Submit Document</button>
            </div>
        </form>
    );
  };

  return (
    <Modal title="Upload Document" onClose={onClose}>
        {renderContent()}
    </Modal>
  );
};