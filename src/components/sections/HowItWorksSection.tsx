'use client';
import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';

const steps = [
    {
        num: '01',
        title: 'Open Your Account',
        desc: 'Complete KYC in under 5 minutes. Submit PAN, Aadhaar, and bank details — fully digital, zero paperwork.'
    },
    {
        num: '02',
        title: 'Browse & Discover',
        desc: 'Explore curated pre-IPO and unlisted companies with live offer prices, financials, and analyst notes.'
    },
    {
        num: '03',
        title: 'Buy & Hold Securely',
        desc: 'Shares are held in your demat account via NSDL/CDSL. Full transparency, no hidden custody fees.'
    },
    {
        num: '04',
        title: 'Physical to Digital',
        desc: 'Have old physical share certificates? We help you convert them into digital shares in your demat account seamlessly.'
    }];


export default function HowItWorksSection() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el, i) => {
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
            id="how-it-works"
            ref={sectionRef}
            className="py-28 px-6 md:px-12 max-w-screen-xl mx-auto">

            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">

                {/* Left: Image */}
                <div className="md:col-span-5 relative reveal-left">
                    <div className="rounded-2xl overflow-hidden aspect-[4/5] relative border border-border">
                        <AppImage
                            src="https://img.rocket.new/generatedImages/rocket_gen_img_1fb26a215-1772094131155.png"
                            alt="Investor reviewing pre-IPO company data on laptop"
                            className="w-full h-full object-cover"
                            fill />

                        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
                    </div>
                    {/* Decorative circle */}
                    <div className="absolute -top-8 -left-8 w-32 h-32 border border-accent/20 rounded-full -z-10" />
                    <div className="absolute -bottom-6 -right-6 w-20 h-20 border border-border rounded-full -z-10" />

                    {/* Stat card */}
                    <div className="absolute bottom-8 -right-4 md:-right-8 bg-white border border-border rounded-xl p-4 shadow-sm max-w-[160px] reveal delay-300">
                        <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Avg. Returns</p>
                        <p className="text-2xl font-display font-medium text-foreground">2.8×</p>
                        <p className="text-[10px] text-muted">at IPO listing</p>
                    </div>
                </div>

                {/* Right: Steps */}
                <div className="md:col-span-7">
                    <div className="mb-12 reveal">
                        <span className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-3 block">How It Works</span>
                        <h2 className="font-display text-4xl md:text-5xl font-light text-foreground tracking-tight leading-[1.1]">
                            Simple as<br /><span className="italic text-muted">four steps.</span>
                        </h2>
                    </div>

                    <div className="space-y-0">
                        {steps?.map((step, i) =>
                            <div
                                key={step?.num}
                                className={`reveal delay-${(i + 1) * 100} flex gap-8 py-8 border-b border-border group hover:bg-surface/50 -mx-4 px-4 rounded-lg transition-colors duration-300`}>

                                <span className="font-display text-5xl font-light text-border group-hover:text-accent transition-colors duration-300 leading-none pt-1 flex-shrink-0">
                                    {step?.num}
                                </span>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2 text-base">{step?.title}</h3>
                                    <p className="text-sm text-muted leading-relaxed font-light">{step?.desc}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 reveal delay-400">
                        <a
                            href="#"
                            className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-foreground hover:gap-5 transition-all duration-300 group">

                            Start Your KYC Now
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>);

}
