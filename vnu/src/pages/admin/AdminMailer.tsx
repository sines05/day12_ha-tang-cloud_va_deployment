import React, { useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { QuillEditor } from '../../components/QuillEditor';

export const AdminMailer: React.FC = () => {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [mode, setMode] = useState<'html' | 'template'>('html');
    const [content, setContent] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [params, setParams] = useState('');
    const [useLayout, setUseLayout] = useState(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status.type === 'loading') return;
        
        setStatus({ type: 'loading', message: 'Sending magic email...' });

        try {
            let parsedParams = {};
            if (params.trim()) {
                try {
                    parsedParams = JSON.parse(params);
                } catch (err) {
                    throw new Error('Invalid JSON in Template Params');
                }
            }

            const res = await adminApi.sendAdminEmail({
                to: to.split(',').map(email => email.trim()),
                subject,
                ...(mode === 'html' ? { html: content, use_layout: useLayout } : { template_id: templateId, params: parsedParams }),
            });

            setStatus({ type: 'success', message: `Email sent successfully! ID: ${res.id}` });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Failed to send email' });
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-12">
                <h1 className="text-6xl font-black uppercase italic tracking-tighter text-black mb-2">
                    Mail Center
                </h1>
                <p className="text-xl font-bold text-gray-600 uppercase">Resend Direct Communication</p>
            </header>

            <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                {status.type && (
                    <div className={`p-6 border-b-4 border-black font-black uppercase text-xl ${
                        status.type === 'success' ? 'bg-green-400' : 
                        status.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                    }`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSend} className="flex flex-col">
                    <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-gray-500">Recipients</label>
                                <input 
                                    type="text" 
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    placeholder="email1@example.com, email2@example.com..."
                                    className="w-full p-4 border-4 border-black bg-white font-bold focus:bg-yellow-50 outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-gray-500">Email Subject</label>
                                <input 
                                    type="text" 
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Enter subject line..."
                                    className="w-full p-4 border-4 border-black bg-white font-bold focus:bg-yellow-50 outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1 space-y-4">
                                <label className="block text-sm font-black uppercase tracking-widest text-gray-500">Composition Mode</label>
                                <div className="flex gap-4">
                                    {(['html', 'template'] as const).map((m) => (
                                        <button 
                                            key={m}
                                            type="button"
                                            onClick={() => setMode(m)}
                                            className={`flex-1 p-3 border-4 border-black font-black uppercase text-sm transition-all ${
                                                mode === m 
                                                ? 'bg-black text-white translate-x-1 translate-y-1 shadow-none' 
                                                : 'bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                            }`}
                                        >
                                            {m === 'html' ? 'Rich Text / HTML' : 'Resend Template'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {mode === 'html' && (
                                <div className="flex-1 space-y-4">
                                    <label className="block text-sm font-black uppercase tracking-widest text-gray-500">Layout Settings</label>
                                    <button
                                        type="button"
                                        onClick={() => setUseLayout(!useLayout)}
                                        className={`w-full p-3 border-4 border-black font-black uppercase text-sm flex items-center justify-between transition-all ${
                                            useLayout ? 'bg-yellow-300 shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                        }`}
                                    >
                                        <span>Use Standard Template</span>
                                        <div className={`w-6 h-6 border-2 border-black ${useLayout ? 'bg-black' : 'bg-white'}`}>
                                            {useLayout && (
                                                <svg viewBox="0 0 24 24" className="w-full h-full text-yellow-300 p-0.5" fill="none" stroke="currentColor" strokeWidth="4">
                                                    <path d="M20 6L9 17L4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                        {mode === 'html' ? (
                            <div className="space-y-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-gray-500">Message Content</label>
                                <div className="border-4 border-black bg-white">
                                    <QuillEditor
                                        value={content}
                                        onChange={(html) => setContent(html)}
                                        placeholder="Compose your email message here..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="block text-sm font-black uppercase tracking-widest text-gray-500">Template ID</label>
                                    <input 
                                        type="text" 
                                        value={templateId}
                                        onChange={(e) => setTemplateId(e.target.value)}
                                        placeholder="e.g. welcome-email-v2"
                                        className="w-full p-4 border-4 border-black bg-white font-bold focus:bg-yellow-50 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-black uppercase tracking-widest text-gray-500">JSON Parameters</label>
                                    <textarea 
                                        value={params}
                                        onChange={(e) => setParams(e.target.value)}
                                        placeholder='{ "username": "Admin", "link": "https://..." }'
                                        rows={6}
                                        className="w-full p-4 border-4 border-black bg-white font-bold focus:bg-yellow-50 outline-none font-mono text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t-4 border-black bg-gray-50">
                        <button 
                            type="submit" 
                            disabled={status.type === 'loading'}
                            className="group relative w-full p-6 bg-pink-500 text-white font-black text-3xl uppercase border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:bg-pink-600 transition-all disabled:bg-gray-400"
                        >
                            {status.type === 'loading' ? 'Broadcasting...' : 'Blast Mail 🚀'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
