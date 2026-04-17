import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHead } from '@unhead/react';
import type { Document } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { FileTypeIcon } from '../components/FileTypeIcon';
import { FolderIcon } from '../components/icons/FolderIcon';
import { API_BASE_URL } from '../constants'; // Import API_BASE_URL
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

import { useDownloadContext } from '../contexts/DownloadContext';

export const DocumentDetailPage: React.FC = () => {
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const { documentSlug } = useParams<{ documentSlug: string }>();
    const navigate = useNavigate();
    const { universities, getDocument, selectedUniversityId, currentPage } = useAppContext();
    const { startDownload } = useDownloadContext();

    const [pendingDownload, setPendingDownload] = useState<{ fileId: number; fileName: string } | null>(null);
    const turnstileRef = useRef<TurnstileInstance>(null);

    const fetchDocument = useCallback(async () => {
        if (documentSlug) {
            setLoading(true);
            try {
                const doc = await getDocument(documentSlug);
                if (doc) {
                    setDocument(doc);
                } else {
                    setDocument(null);
                }
            } catch (error) {
                console.error("Failed to fetch document detail:", error);
                setDocument(null);
            } finally {
                setLoading(false);
            }
        }
    }, [documentSlug, getDocument]);

    useEffect(() => {
        fetchDocument();
    }, [fetchDocument]);

    useEffect(() => {
        if (document) {
            window.scrollTo(0, 0);
        }
    }, [document]);

    const handleBackClick = () => {
        const params = new URLSearchParams();
        if (selectedUniversityId) {
            params.set('universityId', selectedUniversityId);
        }
        if (currentPage > 1) {
            params.set('page', currentPage.toString());
        }
        navigate(`/documents?${params.toString()}`);
    };

    const handleDownloadClick = (fileId: number, fileName: string) => {
        setPendingDownload({ fileId, fileName });
        if (turnstileRef.current) {
            turnstileRef.current.execute();
        }
    };


    // Use head must be called unconditionally at the top level
    useHead({
        title: document ? `${document.title} - VNU Docs Hub` : (loading ? 'Loading...' : 'Document Not Found'),
        meta: document ? [
            { name: 'description', content: document.description ? document.description.substring(0, 160) + (document.description.length > 160 ? '...' : '') : `Download ${document.title}` },
            { property: 'og:type', content: 'article' },
            { property: 'og:title', content: document.title },
            { property: 'og:description', content: document.description ? document.description.substring(0, 160) + (document.description.length > 160 ? '...' : '') : `Download ${document.title}` },
            { property: 'og:image', content: `https://vnudocshub.com/image.png` },
            { property: 'og:url', content: `https://vnudocshub.com/documents/${document.slug}` }
        ] : []
    });

    if (loading) {
        return <div className="text-center p-10">Loading document...</div>;
    }

    if (!document) {
        return <div className="text-center p-10">Document not found.</div>;
    }



    const university = universities.find(uni => uni.id === document.universityId);
    const courseInfo = [university?.abbreviation, document.courseCode].filter(Boolean).join(' - ');
    const totalFiles = document.sections.reduce((sum, section) => sum + section.files.length, 0);

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={handleBackClick}
                className="mb-4 font-bold hover:underline"
            >
                &larr; Back to documents
            </button>
            <div
                className="bg-white border-2 border-black w-full"
                style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.8)' }}
            >
                <div className="flex-shrink-0 flex justify-center items-center p-4 border-b-2 border-black bg-yellow-300">
                    <h1 id="document-detail-title" className="text-xl font-bold uppercase text-center">{document.title}</h1>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-sm text-gray-700">
                            <span className="font-bold uppercase">{courseInfo}</span>
                            {courseInfo && ' - '}
                            <span>{document.courseName}</span>
                        </p>
                        {document.lecturerName && (
                            <p className="text-sm text-gray-700 mt-1">
                                <span className="font-bold uppercase">Lecturer:</span> {document.lecturerName}
                            </p>
                        )}
                        {document.description && (
                            <p className="mt-2 text-sm border-2 border-dashed border-gray-400 p-3 bg-gray-50">{document.description}</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        {document.sections.map((section, index) => (
                            <div key={index}>
                                <h3 className="flex items-center gap-2 font-bold text-lg border-b-2 border-black pb-1 mb-3">
                                    <FolderIcon className="h-6 w-6 text-gray-700" />
                                    <span>{section.title} ({section.files.length})</span>
                                </h3>
                                <ul className="space-y-2">
                                    {section.files.map(file => (
                                        <li key={file.id} className="flex items-center justify-between p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <FileTypeIcon fileType={file.fileType} className="h-8 w-8 flex-shrink-0" />
                                                <div className="truncate">
                                                    <p className="font-bold truncate" title={file.name}>{file.name}</p>
                                                    <p className="text-xs text-gray-600">{file.size} KB</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownloadClick(file.id, file.name)}
                                                disabled={pendingDownload?.fileId === file.id}
                                                className={`flex-shrink-0 flex items-center gap-1.5 ml-2 p-2 text-white border-2 border-black font-bold uppercase text-xs transition-all ${pendingDownload?.fileId === file.id
                                                    ? 'bg-gray-400 cursor-wait'
                                                    : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                                                    }`}
                                            >
                                                {pendingDownload?.fileId === file.id ? (
                                                    // Simple Loading Spinner SVG
                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <DownloadIcon />
                                                )}
                                                <span className="hidden sm:inline">
                                                    {pendingDownload?.fileId === file.id ? 'Verifying...' : 'Download'}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-shrink-0 p-4 border-t-2 border-black bg-gray-100">
                    <div className="text-sm font-bold text-center">
                        Total: {document.sections.length} sections, {totalFiles} files
                    </div>
                </div>
            </div>

            <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                options={{ size: 'invisible', execution: 'execute' }}
                ref={turnstileRef}
                onSuccess={(token) => {
                    if (pendingDownload) {
                        startDownload(pendingDownload.fileId, pendingDownload.fileName, token);
                        // Wait a moment for the state to update, then open the new tab
                        window.open(`/download?fileId=${pendingDownload.fileId}&fileName=${encodeURIComponent(pendingDownload.fileName)}`, '_blank', 'noopener,noreferrer');
                        setPendingDownload(null);
                        turnstileRef.current?.reset();
                    }
                }}
            />
        </div>
    );
};
