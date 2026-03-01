'use client';
import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import { useRouter } from 'next/navigation';

export default function HeroSection() {
    const floatRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!floatRef.current) return;
            const x = (e.clientX / window.innerWidth - 0.5) * 12;
            const y = (e.clientY / window.innerHeight - 0.5) * 8;
            floatRef.current.style.transform = `translate(${x}px, ${y}px)`;
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    return (
        <header className="relative w-full min-h-screen pt-24 pb-16 px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-screen-xl mx-auto">

            {/* Rotating Badge */}
            <div className="absolute top-28 right-6 md:right-14 z-20 hidden md:block pointer-events-none">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="animate-spin-slow w-full h-full text-muted" viewBox="0 0 100 100">
                        <path id="circlePath2" d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                        <text fontSize="10" fontFamily="DM Sans" fontWeight="500" letterSpacing="2.5px" fill="currentColor">
                            <textPath href="#circlePath2" startOffset="0%">
                                UNLISTED · PRE-IPO · INDIA ·
                            </textPath>
                        </text>
                    </svg>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="absolute text-accent">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                    </svg>
                </div>
            </div>

            {/* Left Content */}
            <div className="lg:col-span-5 flex flex-col justify-center relative z-10">
                <div className="mb-10 reveal-left active transition-all duration-[1s]">
                    <span className="inline-block py-1.5 px-4 border border-border rounded-full text-[10px] uppercase tracking-widest text-muted mb-6 font-medium animate-in fade-in slide-in-from-left-4 duration-700">
                        Pre-IPO &amp; Unlisted Shares
                    </span>
                    <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light leading-[0.92] tracking-tight text-foreground mb-6 animate-in fade-in slide-in-from-left-8 duration-1000 delay-150">
                        Invest Before<br />
                        <span className="italic text-accent">the Crowd</span><br />
                        Does.
                    </h1>
                    <p className="text-muted text-sm leading-relaxed max-w-xs border-l-2 border-border pl-5 font-light animate-in fade-in slide-in-from-left-12 duration-1000 delay-300">
                        Access high-growth Indian companies — Swiggy, NSDL, HDB Financial — before they list. We also help convert your <span className="text-accent font-medium italic underline decoration-accent/20">physical shares</span> to digital in your Demat account.
                    </p>
                </div>

                {/* Account Opening Widget */}
                <div className="bg-white border border-border rounded-2xl p-6 max-w-sm w-full shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500 fill-mode-both">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-4">Start Investing Today</p>
                    <div className="space-y-3 mb-4">
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-primary transition-colors" />

                        <input
                            type="tel"
                            placeholder="Mobile Number"
                            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-primary transition-colors" />

                    </div>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-primary text-white py-3.5 rounded-lg text-xs font-semibold uppercase tracking-widest hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 group">
                        <span>Open Free Account</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                        </svg>
                    </button>
                    <p className="text-[10px] text-muted text-center mt-3">No account opening charges · SEBI Registered</p>
                </div>
            </div>

            {/* Right: Arch Image */}
            <div className="lg:col-span-7 h-[65vh] lg:h-[88vh] relative animate-in fade-in zoom-in-95 duration-1000 delay-300 fill-mode-both">
                <div
                    className="absolute inset-0 overflow-hidden shadow-2xl"
                    style={{ borderRadius: '10rem 10rem 0.75rem 0.75rem' }}>

                    <AppImage
                        src="https://img.rocket.new/generatedImages/rocket_gen_img_17cca8024-1766513023990.png"
                        alt="Stock market trading charts on multiple screens in a modern office"
                        className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-[2.5s]"
                        fill />

                    <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
                </div>

                {/* Floating Live Trade Card */}
                <div
                    ref={floatRef}
                    className="absolute bottom-10 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-white max-w-[220px] hidden md:block animate-float transition-transform duration-300 ease-out">

                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Live Trade</span>
                    </div>
                    <p className="text-sm font-display font-medium mb-0.5">Swiggy Ltd.</p>
                    <p className="text-xs opacity-70 mb-3">Pre-IPO · Series J</p>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[10px] opacity-60 mb-0.5">Offer Price</p>
                            <p className="text-lg font-semibold">₹385<span className="text-xs font-normal opacity-70">/share</span></p>
                        </div>
                        <span className="text-xs bg-green-400/20 text-green-300 px-2 py-1 rounded-full font-medium">+12.4%</span>
                    </div>
                </div>

                {/* Shadow offset decorative border */}
                <div
                    className="absolute top-6 -left-4 w-full h-full border border-accent/20 -z-10"
                    style={{ borderRadius: '10rem 10rem 0.75rem 0.75rem' }} />

            </div>
        </header>);

}
