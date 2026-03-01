'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/lib/auth-context';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const { user, isLoading } = useAuth();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 48);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 transition-all duration-500 ${scrolled
                ? 'bg-background/90 backdrop-blur-md border-b border-border shadow-sm'
                : 'bg-transparent'
                }`}
        >
            <AppLogo size={32} text="ShareSaathi" />

            <div className="hidden md:flex items-center gap-10 text-xs font-medium tracking-widest uppercase text-muted">
                <a href="#how-it-works" className="hover:text-foreground transition-colors link-underline">How It Works</a>
                <a href="#companies" className="hover:text-foreground transition-colors link-underline">Companies</a>
                <a href="#why-us" className="hover:text-foreground transition-colors link-underline">Why Us</a>
            </div>

            <div className="flex items-center gap-4">
                {!isLoading && (
                    user ? (
                        <Link
                            href={`/dashboard/${user.role}`}
                            className="px-6 py-2.5 bg-foreground text-background text-xs font-semibold tracking-widest uppercase rounded-full hover:bg-foreground/90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-foreground/10"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="px-6 py-2.5 bg-primary text-white text-xs font-semibold tracking-widest uppercase rounded-full hover:bg-primary/90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md shadow-primary/20"
                        >
                            Login
                        </Link>
                    )
                )}
            </div>
        </nav>
    );
}
