import { API_BASE_URL } from '../constants';

/**
 * A helper function to handle fetch requests and JSON parsing for Admin API.
 */
const fetchJson = async (url: string, options?: RequestInit) => {
    // Automatically inject admin password from session if exists
    const adminPassword = sessionStorage.getItem('vnu_admin_pwd');
    
    const headers = new Headers(options?.headers || {});
    if (adminPassword) {
        headers.set('X-Admin-Password', adminPassword);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Admin Request failed with status ' + response.status }));
        throw new Error(errorBody.error || 'An unknown admin error occurred');
    }
    return response.json();
};

export const adminApi = {
    /**
     * Verifies the admin password.
     */
    verifyPassword: (password: string): Promise<{ message: string }> => {
        return fetchJson(`${API_BASE_URL}/admin/verify-password`, {
            method: 'POST',
            body: JSON.stringify({ password }),
        });
    },

    /**
     * Sends an email via the admin mailer endpoint.
     */
    sendAdminEmail: (data: { 
        to: string | string[]; 
        subject: string; 
        html?: string; 
        template_id?: string; 
        params?: Record<string, any>;
        use_layout?: boolean;
    }): Promise<{ message: string; id: string }> => {
        return fetchJson(`${API_BASE_URL}/admin/send-email`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};
