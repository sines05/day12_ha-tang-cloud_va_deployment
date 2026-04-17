import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-black text-white flex flex-col border-r-4 border-white">
                <div className="p-6 border-b-4 border-white">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-yellow-300">
                        Admin Hub
                    </h2>
                </div>
                
                <nav className="flex-grow p-4 space-y-4">
                    <NavLink 
                        to="/admin/mailer" 
                        className={({ isActive }) => 
                            `block p-4 border-4 border-white font-black uppercase transition-all duration-100 ${
                                isActive 
                                ? 'bg-pink-500 translate-x-1 translate-y-1 shadow-none' 
                                : 'bg-black hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'
                            }`
                        }
                    >
                        Mail Center
                    </NavLink>
                    
                    <div className="pt-8 opacity-50 cursor-not-allowed">
                        <div className="p-4 border-2 border-dashed border-gray-600 font-bold uppercase text-xs">
                            Dashboard (Soon)
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t-4 border-white">
                    <NavLink 
                        to="/" 
                        className="block p-2 text-center font-bold uppercase hover:underline text-gray-400"
                    >
                        ← Back to Site
                    </NavLink>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};
