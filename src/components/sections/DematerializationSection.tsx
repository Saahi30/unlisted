'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';

export default function DematerializationSection() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el, i) => {
                            setTimeout(() => el.classList.add('active'), i * 150);
                        });
                    }
                });
            },
            { threshold: 0.15 }
        );
        if (sectionRef?.current) observer?.observe(sectionRef?.current);
        return () => observer?.disconnect();
    }, []);

    return (
        <section
            id="dematerialization"
            ref={sectionRef}
            className="py-24 px-6 md:px-12 max-w-screen-xl mx-auto overflow-hidden"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Left: Content */}
                <div className="order-2 lg:order-1">
                    <div className="reveal mb-8">
                        <span className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-4 block">Physical to Digital</span>
                        <h2 className="font-display text-4xl md:text-5xl font-light text-foreground tracking-tight leading-[1.1] mb-6">
                            Have old physical<br /><span className="italic text-muted font-normal">share certificates?</span>
                        </h2>
                        <p className="text-muted text-base md:text-lg max-w-lg font-light leading-relaxed">
                            Don't let your legacy investments sit idle in paper form. We specialize in converting your physical share holdings into digital format (Demat) seamlessly.
                        </p>
                    </div>

                    <div className="space-y-8 mb-10">
                        <div className="flex gap-5 reveal delay-100">
                            <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">Hassle-free Processing</h4>
                                <p className="text-sm text-muted">We handle the coordination with RTAs and companies directly so you don't have to.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 reveal delay-200">
                            <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">Rapid Turnaround</h4>
                                <p className="text-sm text-muted">Get your physical shares digitised in record time with our streamlined documentation assistance.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 reveal delay-300">
                            <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">IEPF Recovery Support</h4>
                                <p className="text-sm text-muted">If your shares have been transferred to IEPF, our legal experts help you recover your lost wealth.</p>
                            </div>
                        </div>
                    </div>

                    <div className="reveal delay-400">
                        <Link 
                            href="/dashboard/customer/dematerialize"
                            className="inline-flex items-center gap-4 px-8 py-4 bg-primary text-white rounded-full text-sm font-semibold hover:bg-accent transition-all duration-300 shadow-lg shadow-primary/10 group"
                        >
                            Start Dematerialization Now
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
                                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Right: Visual */}
                <div className="relative order-1 lg:order-2">
                    <div className="reveal-right rounded-[2rem] overflow-hidden aspect-[4/3] lg:aspect-square relative border border-border bg-surface shadow-2xl">
                        <AppImage 
                            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f" 
                            alt="Digitization of financial records" 
                            className="w-full h-full object-cover mix-blend-multiply opacity-80"
                            fill
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-accent/10" />
                        
                        {/* Overlay Card */}
                        <div className="absolute bottom-10 left-10 right-10 p-6 bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl flex items-center gap-4 reveal delay-500">
                            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                                    <path d="M4 4v16c0 1.1.9 2 2 2h12a2 2 0 002-2V8.342a2 2 0 00-.602-1.43l-4.44-4.342A2 2 0 0013.56 2H6a2 2 0 00-2 2z" />
                                    <path d="M14 2.5V8a1 1 0 001 1h5.5" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-0.5">Physical Shares</p>
                                <p className="text-lg font-display text-primary leading-none">Recover your wealth.</p>
                            </div>
                            <div className="ml-auto">
                                <div className="w-px h-10 bg-border mx-4" />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-accent">TRUSTED</span>
                                <span className="text-[8px] text-muted tracking-tighter">BY 500+ HNI</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Decorative Blobs */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/5 rounded-full blur-[60px] -z-10" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-[60px] -z-10" />
                </div>
            </div>
        </section>
    );
}
