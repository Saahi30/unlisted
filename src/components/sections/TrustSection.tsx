'use client';
import React, { useEffect, useRef } from 'react';

const stats = [
    { value: '₹847Cr+', label: 'Total Volume Traded', sub: 'Since 2021' },
    { value: '12,400+', label: 'Verified Investors', sub: 'Pan India' },
    { value: '95+', label: 'Companies Listed', sub: 'Pre-IPO & Unlisted' },
    { value: '4.8★', label: 'Investor Rating', sub: 'Google · App Store' },
];

export default function TrustSection() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.querySelectorAll('.reveal, .reveal-left').forEach((el, i) => {
                            setTimeout(() => el.classList.add('active'), i * 120);
                        });
                    }
                });
            },
            { threshold: 0.1 }
        );
        if (sectionRef?.current) observer?.observe(sectionRef?.current);
        return () => observer?.disconnect();
    }, []);

    return (
        <section
            id="why-us"
            ref={sectionRef}
            className="py-28 px-6 md:px-12 max-w-screen-xl mx-auto"
        >
            {/* Stats Grid */}
            <div className="mb-20">
                <div className="reveal mb-12">
                    <span className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-3 block">Why ShareSaathi</span>
                    <h2 className="font-display text-4xl md:text-5xl font-light text-foreground tracking-tight">
                        Numbers that<br /><span className="italic text-muted">speak for us.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
                    {stats?.map((stat, i) => (
                        <div
                            key={stat?.label}
                            className={`reveal delay-${i * 100} bg-background p-8 md:p-10 group hover:bg-surface transition-colors duration-300`}
                        >
                            <p className="font-display text-3xl md:text-4xl font-light text-foreground mb-2 group-hover:text-accent transition-colors duration-300">
                                {stat?.value}
                            </p>
                            <p className="text-sm font-medium text-foreground mb-1">{stat?.label}</p>
                            <p className="text-xs text-muted">{stat?.sub}</p>
                        </div>
                    ))}
                </div>
            </div>
            {/* Testimonial */}
            <div className="max-w-3xl mx-auto text-center reveal">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-border mb-8 mx-auto">
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                </svg>
                <blockquote className="font-display text-2xl md:text-3xl font-light text-foreground mb-8 leading-snug tracking-tight">
                    "I bought Swiggy at ₹280 per share, 14 months before their IPO. The listing gave me a 47% gain in a single day. ShareSaathi made the entire process seamless."
                </blockquote>
                <div className="flex flex-col items-center">
                    <div className="w-10 h-px bg-border mb-4" />
                    <p className="text-sm font-semibold text-foreground">Arjun Mehta</p>
                    <p className="text-xs text-muted mt-1 uppercase tracking-widest">Portfolio Manager · Mumbai</p>
                </div>
            </div>
            {/* Trust Badges */}
            <div className="mt-20 pt-12 border-t border-border reveal">
                <p className="text-[10px] uppercase tracking-widest text-muted text-center mb-8">Trusted & Regulated</p>
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
                    {['SEBI Registered', 'NSDL Partner', 'CDSL Approved', 'ISO 27001 Certified']?.map((badge) => (
                        <div key={badge} className="flex items-center gap-2 text-xs font-medium text-muted">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent flex-shrink-0">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {badge}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
