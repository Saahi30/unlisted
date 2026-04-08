'use client';

import { useAppStore } from '@/lib/store';
import { useState, useRef, useEffect } from 'react';

const themes = [
    {
        id: 'classic' as const,
        name: 'Classic',
        description: 'Gold & Navy',
        colors: { bg: '#FAFAF8', primary: '#1C2B3A', accent: '#C8A96E' },
    },
    {
        id: 'midnight' as const,
        name: 'Midnight',
        description: 'Dark Mode',
        colors: { bg: '#111820', primary: '#C8A96E', accent: '#1A2332' },
    },
    {
        id: 'ocean' as const,
        name: 'Ocean',
        description: 'Cool Blue',
        colors: { bg: '#F0F5FA', primary: '#1E3A5F', accent: '#3B82C4' },
    },
    {
        id: 'forest' as const,
        name: 'Forest',
        description: 'Earthy Green',
        colors: { bg: '#F5F3EE', primary: '#2D5A3D', accent: '#8B6F47' },
    },
    {
        id: 'royal' as const,
        name: 'Royal',
        description: 'Purple & Gold',
        colors: { bg: '#F8F5FA', primary: '#4A2D6E', accent: '#D4A843' },
    },
];

export default function ThemeSelector() {
    const { theme, setTheme } = useAppStore();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const current = themes.find(t => t.id === theme) || themes[0];

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-surface transition-colors border border-border"
                title="Change theme"
            >
                <span
                    className="w-4 h-4 rounded-full border border-border-strong shadow-sm"
                    style={{
                        background: `linear-gradient(135deg, ${current.colors.primary} 50%, ${current.colors.accent} 50%)`,
                    }}
                />
                <span className="hidden sm:inline">{current.name}</span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface-elevated border border-border rounded-xl shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold px-3 py-2">Choose Theme</p>
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => {
                                setTheme(t.id);
                                setOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                                theme === t.id
                                    ? 'bg-primary/10 ring-1 ring-primary/20'
                                    : 'hover:bg-surface'
                            }`}
                        >
                            <span
                                className="w-6 h-6 rounded-full border-2 shadow-sm shrink-0"
                                style={{
                                    background: `linear-gradient(135deg, ${t.colors.primary} 50%, ${t.colors.accent} 50%)`,
                                    borderColor: theme === t.id ? t.colors.primary : 'transparent',
                                }}
                            />
                            <div>
                                <p className={`text-sm font-semibold ${theme === t.id ? 'text-foreground' : 'text-foreground-secondary'}`}>
                                    {t.name}
                                </p>
                                <p className="text-[10px] text-muted">{t.description}</p>
                            </div>
                            {theme === t.id && (
                                <svg className="w-4 h-4 text-primary ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
