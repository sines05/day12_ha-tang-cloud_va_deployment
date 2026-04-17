import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useHead } from '@unhead/react';
import type { DownloadTask } from '../types';
import { useDownloadContext } from '../contexts/DownloadContext';
import { useAppContext } from '../contexts/AppContext';

// Helper to parse query parameters
function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

const getStatusText = (status: string | undefined) => {
    switch (status) {
        case 'starting':
            return 'Starting download';
        case 'downloading':
            return 'Downloading file';
        case 'assembling':
            return 'Assembling file';
        case 'done':
            return 'Download complete! You can close this window.';
        case 'error':
            return 'An error occurred.';
        case 'cancelled':
            return 'Download cancelled.';
        default:
            return 'Connecting';
    }
};

export const DownloadingPage: React.FC = () => {
    const query = useQuery();
    const fileId = query.get('fileId');
    const fileName = query.get('fileName');

    const { downloadTasks } = useDownloadContext();
    const { holidayTheme } = useAppContext();
    const initialTask = fileId ? downloadTasks[parseInt(fileId, 10)] : null;

    const [task, setTask] = useState<DownloadTask | null>(initialTask);
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prevDots => (prevDots.length >= 3 ? '' : prevDots + '.'));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!fileId) {
            setTask({ fileId: 0, fileName: 'Invalid Link', status: 'error', progress: 0, error: 'File ID is missing in URL.' });
            return;
        };

        const channel = new BroadcastChannel('download-progress');

        channel.onmessage = (event: MessageEvent<DownloadTask>) => {
            // Check if the message is for this download tab
            if (event.data.fileId === parseInt(fileId, 10)) {
                setTask(event.data);
                // Only auto-close on success
                if (event.data.status === 'done') {
                    setTimeout(() => window.close(), 7000);
                }
            }
        };

        channel.postMessage({ type: 'request-status', fileId: parseInt(fileId, 10) });

        return () => {
            channel.close();
        };
    }, [fileId]);

    const currentProgress = task?.progress ?? 0;
    const currentStatus = getStatusText(task?.status);
    const errorMessage = task?.error;
    const showDots = task?.status === 'starting' || task?.status === 'downloading' || task?.status === 'assembling' || !task;

    if (task?.status === 'error') {
        useHead({ title: 'Download Error' });
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-red-50">
                <div className="text-center p-8 bg-white border-2 border-red-500 shadow-lg">
                    <h1 className="text-2xl font-bold uppercase text-red-600 mb-2">Download Failed</h1>
                    <p className="text-lg font-semibold max-w-lg">{errorMessage || 'An unknown error occurred.'}</p>
                    <p className="mt-4 text-sm text-gray-600">
                        You can close this window.
                    </p>
                </div>
            </div>
        );
    }

    useHead({ title: `Downloading ${fileName || 'File'}` });

    return (
        <div className="relative flex flex-col items-center justify-center h-screen bg-white">
            <div className="relative z-10 text-center mb-8" style={{ animation: 'fade-in 0.5s ease-out forwards' }}>
                {holidayTheme ? (
                    <img src={holidayTheme.logo} alt="Vnudocshub Logo" className="h-16 w-auto mx-auto mb-4" />
                ) : (
                    <div className="h-16 w-48 bg-gray-200 animate-pulse mx-auto mb-4" />
                )}
                <p className="text-gray-700 font-bold text-xl">Cảm ơn bạn đã sử dụng Vnudocshub</p>
            </div>

            <div className="relative z-10 text-center p-8 bg-white border-2 border-black shadow-lg w-full max-w-md" style={{ animation: 'fade-in-slide-up 0.5s ease-out 0.2s forwards', boxShadow: '8px 8px 0px rgba(0,0,0,0.8)', opacity: 0 }}>
                <h1 className="text-2xl font-bold uppercase mb-2">Your Download is in Progress</h1>
                {fileName && <p className="text-lg font-semibold text-blue-500 break-all max-w-lg truncate" title={fileName}>{fileName}</p>}

                <div className="w-full bg-white rounded-full h-4 mt-6 overflow-hidden border-2 border-black">
                    <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                            width: `${currentProgress}%`,
                            transition: 'width 0.5s ease-in-out',
                            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.25) 0, rgba(255, 255, 255, 0.25) 20px, transparent 20px, transparent 40px)',
                            animation: 'barber-pole 1s linear infinite',
                        }}
                    ></div>
                </div>

                <p className="mt-4 text-sm text-gray-800 font-semibold">
                    {currentStatus}{showDots ? dots : ''}
                </p>
            </div>
            <style>{`
                @keyframes barber-pole {
                    from { background-position: 0 0; }
                    to { background-position: 40px 0; }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fade-in-slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
