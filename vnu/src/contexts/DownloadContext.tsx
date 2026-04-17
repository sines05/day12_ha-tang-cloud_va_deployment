import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { API_BASE_URL } from '../constants';
import type { DownloadTask, DocumentDetails } from '../types'; // Add DocumentDetails type

interface DownloadContextType {
    downloadTasks: Record<number, DownloadTask>;
    startDownload: (fileId: number, fileName: string, turnstileToken?: string) => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

// Cache for document details
const documentDetailsCache = new Map<number, DocumentDetails>();

export const DownloadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [downloadTasks, setDownloadTasks] = useState<Record<number, DownloadTask>>({});

    const startDownload = useCallback(async (fileId: number, fileName: string, turnstileToken?: string) => {
        // Use functional form of setState to prevent race conditions and avoid dependency
        setDownloadTasks(prevTasks => {
            if (prevTasks[fileId] && (prevTasks[fileId].status === 'downloading' || prevTasks[fileId].status === 'assembling')) {
                console.log(`Download for file ID ${fileId} is already in progress.`);
                return prevTasks;
            }
            // Announce the start immediately
            const newTasks = { ...prevTasks, [fileId]: { fileId, fileName, status: 'starting', progress: 0 } };

            // Broadcast the very initial state
            const channel = new BroadcastChannel('download-progress');
            channel.postMessage(newTasks[fileId]);
            channel.close();

            return newTasks;
        });

        const channel = new BroadcastChannel('download-progress');
        const CONCURRENCY_LIMIT = 4;

        const updateAndBroadcast = (taskUpdate: Partial<DownloadTask>) => {
            setDownloadTasks(prevTasks => {
                const updatedTask = { ...prevTasks[fileId], fileId, fileName, ...taskUpdate };
                channel.postMessage(updatedTask);
                return { ...prevTasks, [fileId]: updatedTask };
            });
        };

        channel.onmessage = (event) => {
            if (event.data.type === 'request-status' && event.data.fileId === fileId) {
                setDownloadTasks(currentTasks => {
                    const currentTask = currentTasks[fileId];
                    if (currentTask) {
                        channel.postMessage(currentTask);
                    }
                    return currentTasks;
                });
            }
        };

        try {
            let details: DocumentDetails | undefined;
            if (documentDetailsCache.has(fileId)) {
                details = documentDetailsCache.get(fileId);
            } else {
                details = await api.getDocumentDetails(fileId, turnstileToken);
                if (details) {
                    documentDetailsCache.set(fileId, details);
                }
            }

            if (!details || details.parts.length === 0) {
                throw new Error('Could not retrieve file details or file has no content.');
            }

            const totalParts = details.parts.length;
            let downloadedParts = 0;
            const partBlobs: (Blob | undefined)[] = new Array(totalParts);
            const partsQueue = details.parts.map((partId, index) => ({ partId, index }));

            updateAndBroadcast({ status: 'downloading', progress: 0 });

            const downloadPartWithRetry = async (partId: string, maxRetries = 20): Promise<Blob> => {
                let attempt = 0;
                while (attempt < maxRetries) {
                    try {
                        const headers: Record<string, string> = {};
                        if (details?.downloadToken) {
                            headers['Authorization'] = `Bearer ${details.downloadToken}`;
                        }

                        const response = await fetch(`${API_BASE_URL}/download/part/${partId}`, { headers });
                        if (response.status === 429 || response.status >= 500) {
                            throw new Error(`Server error or rate limit: ${response.status}`);
                        }
                        if (response.status === 401 || response.status === 403) {
                            throw new Error(`Authorization failed: ${response.status}`);
                        }
                        if (!response.ok) {
                            throw new Error(`Part ${partId} failed with non-retriable status: ${response.status}`);
                        }
                        return await response.blob();
                    } catch (error: any) {
                        attempt++;
                        if (attempt >= maxRetries || error.message.includes('non-retriable') || error.message.includes('Authorization failed')) {
                            throw error;
                        }
                        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
                throw new Error(`Download for part ${partId} failed unexpectedly after all retries.`);
            };

            const downloadWorker = async () => {
                while (partsQueue.length > 0) {
                    const partInfo = partsQueue.shift();
                    if (!partInfo) continue;

                    const { partId, index } = partInfo;
                    const blob = await downloadPartWithRetry(partId);

                    partBlobs[index] = blob;
                    downloadedParts++;
                    const progress = Math.floor((downloadedParts / totalParts) * 98);
                    updateAndBroadcast({ progress });
                }
            };

            const workers = Array(CONCURRENCY_LIMIT).fill(0).map(downloadWorker);
            await Promise.all(workers);

            updateAndBroadcast({ status: 'assembling', progress: 99 });

            const finalBlobs = partBlobs.filter((b): b is Blob => b !== undefined);
            if (finalBlobs.length !== totalParts) {
                throw new Error('Mismatch in downloaded parts. Assembly failed.');
            }

            const finalBlob = new Blob(finalBlobs, { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(finalBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            updateAndBroadcast({ status: 'done', progress: 100 });

        } catch (err: any) {
            updateAndBroadcast({ status: 'error', error: 'An unexpected error occurred during download.' });
        } finally {
            setTimeout(() => channel.close(), 5000);
        }
    }, []); // Empty dependency array is correct because we use functional updates for setState

    const value = useMemo(() => ({
        downloadTasks,
        startDownload
    }), [downloadTasks, startDownload]);

    return (
        <DownloadContext.Provider value={value}>
            {children}
        </DownloadContext.Provider>
    );
};

export const useDownloadContext = (): DownloadContextType => {
    const context = useContext(DownloadContext);
    if (context === undefined) {
        throw new Error('useDownloadContext must be used within a DownloadProvider');
    }
    return context;
};
