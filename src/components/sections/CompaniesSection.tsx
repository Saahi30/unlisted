'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { useAppStore } from '@/lib/store';
import { Company } from '@/lib/mock-data';


export default function CompaniesSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const { companies } = useAppStore();
    const featuredCompanies = companies.filter(c => c.isFeatured);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.querySelectorAll('.reveal').forEach((el, i) => {
                            setTimeout(() => el.classList.add('active'), i * 150);
                        });
                    }
                });
            },
            { threshold: 0.1 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            id="companies"
            ref={sectionRef}
            className="py-20 bg-dark text-white overflow-hidden relative rounded-t-[2.5rem] noise-overlay">

            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="px-6 md:px-12 mb-12 flex items-end justify-between max-w-screen-xl mx-auto relative z-10">
                <div className="reveal">
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-widest mb-3 block">Available Now</span>
                    <h3 className="font-display text-3xl md:text-4xl font-light text-white tracking-tight">
                        Featured Companies
                    </h3>
                </div>
                <div className="flex gap-3 reveal delay-100">
                    <button
                        id="scroll-left-btn"
                        className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center hover:bg-white hover:text-dark transition-all duration-300"
                        aria-label="Scroll left">

                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        id="scroll-right-btn"
                        className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center hover:bg-white hover:text-dark transition-all duration-300"
                        aria-label="Scroll right">

                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <CompanyCarousel companies={featuredCompanies} />
        </section>);

}

type CompanyItem = Company;

function CompanyCarousel({ companies }: { companies: CompanyItem[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const leftBtn = document.getElementById('scroll-left-btn');
        const rightBtn = document.getElementById('scroll-right-btn');
        const scroll = (dir: number) => {
            scrollRef.current?.scrollBy({ left: dir * 420, behavior: 'smooth' });
        };
        leftBtn?.addEventListener('click', () => scroll(-1));
        rightBtn?.addEventListener('click', () => scroll(1));
        return () => {
            leftBtn?.removeEventListener('click', () => scroll(-1));
            rightBtn?.removeEventListener('click', () => scroll(1));
        };
    }, []);

    return (
        <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto no-scrollbar px-6 md:px-12 pb-12 snap-x">

            {companies.map((co, i) =>
                <div
                    key={co.name}
                    className={`min-w-[85vw] md:min-w-[380px] snap-center group relative card-shadow-offset reveal delay-${Math.min(i * 100, 400)}`}>

                    <div className="relative h-[460px] overflow-hidden rounded-xl border border-white/10">
                        <AppImage
                            src={co.img || ''}
                            alt={co.imgAlt || ''}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-75 group-hover:opacity-95"
                            fill />

                        <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent" />

                        {/* Top badge */}
                        <div className="absolute top-5 left-5">
                            <span className="text-[9px] uppercase tracking-widest font-semibold bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-full text-white/80">
                                {co.category}
                            </span>
                        </div>

                        {/* Bottom info */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <h4 className="font-display text-xl font-medium text-white mb-1">{co.name}</h4>
                            <p className="text-xs text-white/60 mb-4">Min. Investment: {co.minInvest}</p>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] text-white/50 mb-0.5">Current Price</p>
                                    <p className="text-2xl font-semibold text-white">₹{co.currentAskPrice}</p>
                                </div>
                                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${co.positive ? 'bg-green-400/15 text-green-400' : 'bg-red-400/15 text-red-400'}`}>
                                    {co.change}
                                </span>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Link
                                    href={`/shares/${co.id}`}
                                    className="flex-1 py-3 bg-white text-dark text-[10px] text-center font-semibold uppercase tracking-widest rounded-lg hover:bg-accent hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                >
                                    Details
                                </Link>
                                <Link
                                    href={`/dashboard/customer/buy/${co.id}`}
                                    className="flex-1 py-3 bg-accent text-white text-[10px] text-center font-semibold uppercase tracking-widest rounded-lg hover:bg-white hover:text-dark transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 delay-75 shadow-lg shadow-accent/20"
                                >
                                    Buy Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>);

}
