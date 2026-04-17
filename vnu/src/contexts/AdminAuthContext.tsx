import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminAuthContextType {
    isAdminAuthenticated: boolean;
    adminPassword: string | null;
    login: (password: string) => void;
    logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [adminPassword, setAdminPassword] = useState<string | null>(() => {
        return sessionStorage.getItem('vnu_admin_pwd');
    });

    const isAdminAuthenticated = !!adminPassword;

    const login = (password: string) => {
        sessionStorage.setItem('vnu_admin_pwd', password);
        setAdminPassword(password);
    };

    const logout = () => {
        sessionStorage.removeItem('vnu_admin_pwd');
        setAdminPassword(null);
    };

    return (
        <AdminAuthContext.Provider value={{ isAdminAuthenticated, adminPassword, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};
