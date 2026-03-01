'use client';
import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CtaSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const router = useRouter();

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.querySelectorAll('.reveal').forEach((el, i) => {
                            setTimeout(() => el.classList.add('active'), i * 120);
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
        <section ref={sectionRef} className="px-6 md:px-12 mb-20 max-w-screen-xl mx-auto">
            <div className="relative w-full rounded-[2rem] bg-primary overflow-hidden px-8 py-20 md:py-28 text-center noise-overlay">
                {/* Ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                    <span className="reveal inline-block text-[10px] uppercase tracking-widest text-accent font-semibold mb-6 border border-accent/30 px-4 py-1.5 rounded-full">
                        Limited Allocations Available
                    </span>
                    <h2 className="reveal font-display text-4xl md:text-6xl font-light text-white tracking-tight leading-[1.05] mb-6">
                        Don't wait for<br /><span className="italic text-accent/80">the listing.</span>
                    </h2>
                    <p className="reveal text-white/60 text-sm md:text-base mb-10 max-w-md leading-relaxed font-light delay-100">
                        Join 12,400+ investors who access India's most promising companies at pre-IPO valuations. Open your account in 5 minutes.
                    </p>
                    <div className="reveal flex flex-col sm:flex-row items-center gap-4 w-full justify-center delay-200">
                        <button
                            onClick={() => router.push('/login')}
                            className="px-10 py-4 bg-white text-primary rounded-full text-sm font-semibold hover:bg-accent hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 min-w-[200px] tracking-wide">
                            Open Free Account
                        </button>
                        <button
                            onClick={() => router.push('/shares')}
                            className="px-10 py-4 bg-transparent border border-white/20 text-white rounded-full text-sm font-semibold hover:border-white/60 transition-all duration-300 min-w-[200px] tracking-wide">
                            Browse Companies
                        </button>
                    </div>
                    <p className="reveal text-white/30 text-xs mt-6 delay-300">
                        SEBI Registered · Shares held in your own Demat · Zero hidden charges
                    </p>
                </div>
            </div>
        </section>
    );
}
