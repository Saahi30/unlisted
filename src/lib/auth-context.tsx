'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export type UserRole = 'customer' | 'admin' | 'staffmanager' | 'rm' | 'agent';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    assignedRmId?: string; // For customers
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (role: UserRole) => void;
    logout: () => void;
}

const mockUsers: Record<UserRole, User> = {
    customer: { id: 'cust_1', name: 'John Doe', email: 'john@example.com', role: 'customer' },
    admin: { id: 'adm_1', name: 'Admin Supervisor', email: 'admin@sharesaathi.com', role: 'admin' },
    staffmanager: { id: 'mgr_1', name: 'Sales Director', email: 'manager@sharesaathi.com', role: 'staffmanager' },
    rm: { id: 'sls_1', name: 'Relationship Agent', email: 'agent@sharesaathi.com', role: 'rm' },
    agent: { id: 'agt_1', name: 'Partner Broker', email: 'partner@sharesaathi.com', role: 'agent' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // For now, if there is a session, map it to our internal app User type
                // Here we could fetch the user's role/profile from a users table
                setUser({
                    id: session.user.id,
                    name: session.user.user_metadata?.name || session.user.email || 'Customer',
                    email: session.user.email || '',
                    role: (session.user.user_metadata?.role as UserRole) || 'customer'
                });
            } else {
                // Fallback to local storage for quick simulated access
                const storedAuth = localStorage.getItem('sharesaathi_auth');
                if (storedAuth) {
                    try { setUser(JSON.parse(storedAuth)); } catch (e) { }
                }
            }
            setIsLoading(false);
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setUser({
                    id: session.user.id,
                    name: session.user.user_metadata?.name || session.user.email || 'Customer',
                    email: session.user.email || '',
                    role: (session.user.user_metadata?.role as UserRole) || 'customer'
                });
                localStorage.setItem('sharesaathi_auth', JSON.stringify({
                    id: session.user.id, name: session.user.user_metadata?.name, email: session.user.email, role: session.user.user_metadata?.role || 'customer'
                }));
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('sharesaathi_auth');
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const login = (role: UserRole) => {
        // Keeps the mock simulator working for testing while we transition
        const u = mockUsers[role];
        setUser(u);
        localStorage.setItem('sharesaathi_auth', JSON.stringify(u));
        router.push(`/dashboard/${role}`);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('sharesaathi_auth');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
