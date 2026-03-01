import React from 'react';
import AppLogo from '@/components/ui/AppLogo';

export default function Footer() {
    return (
        <footer className="border-t border-border py-8 px-6 md:px-12 bg-background">
            <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <AppLogo size={28} text="ShareSaathi" />

                <div className="flex items-center gap-8 text-sm font-medium text-muted">
                    <a href="#" className="hover:text-foreground transition-colors">How It Works</a>
                    <a href="#" className="hover:text-foreground transition-colors">Companies</a>
                    <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                    <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                </div>

                <div className="flex items-center gap-5">
                    {/* Twitter/X */}
                    <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-foreground transition-all duration-300">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </a>
                    {/* LinkedIn */}
                    <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-foreground transition-all duration-300">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                            <rect width="4" height="12" x="2" y="9" />
                            <circle cx="4" cy="4" r="2" />
                        </svg>
                    </a>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto mt-6 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted">
                <span>© 2026 ShareSaathi Trading Pvt. Ltd. All rights reserved.</span>
                <span className="text-xs">SEBI Registered Intermediary · IN-DP-NSDL-XXX-2021</span>
            </div>
        </footer>
    );
}
