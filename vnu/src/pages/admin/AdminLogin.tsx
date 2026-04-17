import React, { useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminApi } from '../../services/adminApi';
import { useNavigate } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<{ type: 'error' | 'loading' | null; message: string }>({ type: null, message: '' });
    const { login } = useAdminAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Verifying...' });

        try {
            await adminApi.verifyPassword(password);
            login(password);
            navigate('/admin/mailer');
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Incorrect password' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-pink-100 p-6">
            <div className="w-full max-w-md bg-white border-8 border-black p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                <div className="mb-10 text-center">
                    <h1 className="text-5xl font-black uppercase italic tracking-tighter text-black mb-2">
                        Forbidden
                    </h1>
                    <p className="font-bold text-gray-500 uppercase tracking-widest">Admin Access Only</p>
                </div>

                {status.type === 'error' && (
                    <div className="mb-6 p-4 border-4 border-black bg-red-400 font-black uppercase text-sm">
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xl font-black uppercase tracking-tight">Access Secret</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-6 border-4 border-black bg-yellow-50 font-bold focus:bg-white outline-none transition-colors text-2xl text-center tracking-widest"
                            required
                            autoFocus
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={status.type === 'loading'}
                        className="w-full p-6 bg-black text-white font-black text-2xl uppercase border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,105,180,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:bg-gray-400"
                    >
                        {status.type === 'loading' ? 'Checking...' : 'Enter Sanctuary →'}
                    </button>
                    
                    <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest pt-4">
                        Authorized Personnel Only
                    </p>
                </form>
            </div>
        </div>
    );
};
