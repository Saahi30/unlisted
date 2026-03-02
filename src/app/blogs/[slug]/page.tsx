'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAppStore } from '@/lib/store';
import Icon from '@/components/ui/AppIcon';
import BlogAssistant from '@/components/chat/BlogAssistant';

export default function BlogDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { blogs, incrementBlogViews } = useAppStore();

    const blog = blogs.find(b => b.slug === slug);
    const [viewTracked, setViewTracked] = useState(false);

    useEffect(() => {
        if (blog && !viewTracked) {
            incrementBlogViews(blog.id);
            setViewTracked(true);
        }
    }, [blog, viewTracked, incrementBlogViews]);

    if (!blog) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="text-center">
                    <h1 className="text-4xl font-display font-light mb-4 text-foreground">Insight <span className="text-primary italic">Not Found</span></h1>
                    <button onClick={() => router.push('/blogs')} className="text-primary font-bold uppercase tracking-widest text-xs border-b-2 border-primary/20 hover:border-primary pb-1 transition-all">
                        Back to Intel Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <BlogAssistant blog={blog} />

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-6 md:px-12">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted mb-12 animate-in slide-in-from-left-4 duration-500">
                        <button onClick={() => router.push('/blogs')} className="hover:text-primary transition-colors">Intel Hub</button>
                        <Icon name="ChevronRightIcon" size={12} />
                        <span className="text-foreground">Market Insight</span>
                    </nav>

                    <article className="max-w-4xl mx-auto">
                        <header className="mb-16 animate-in slide-in-from-bottom-6 duration-700">
                            <div className="flex items-center gap-4 text-[11px] font-bold tracking-widest uppercase text-primary mb-6">
                                <span className="px-3 py-1 bg-primary/5 border border-primary/10 rounded-full">Excluvise Intel</span>
                                <span className="text-muted">|</span>
                                <span className="text-muted">{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-display font-light leading-[1.05] tracking-tight text-foreground mb-8">
                                {blog.title}
                            </h1>

                            <div className="flex items-center gap-8 py-8 border-y border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm border border-border/30">
                                        SS
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">ShareSaathi Intelligence</p>
                                        <p className="text-[10px] text-muted font-medium">Head of Research</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-[10px] font-bold tracking-widest uppercase text-muted">
                                    <div className="flex items-center gap-1.5">
                                        <Icon name="ClockIcon" size={14} />
                                        <span>4 MIN READ</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Icon name="EyeIcon" size={14} />
                                        <span>{blog.views} READS</span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <div className="prose prose-lg prose-slate max-w-none prose-headings:font-display prose-headings:font-light prose-headings:tracking-tight prose-a:text-primary animate-in slide-in-from-bottom-8 duration-1000">
                            {/* In a real app we'd use something like react-markdown or dangerouslySetInnerHTML with sanitizer */}
                            <div className="whitespace-pre-wrap leading-relaxed space-y-8 text-slate-700 font-light text-xl">
                                {blog.content}
                            </div>
                        </div>

                        {/* CTA at the bottom */}
                        <div className="mt-20 p-12 bg-slate-900 rounded-[48px] text-center shadow-2xl overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-70" />
                            <div className="relative z-10">
                                <h3 className="text-3xl font-display font-light text-white mb-6">Invest in the <span className="text-primary italic">Source</span></h3>
                                <p className="text-white/60 text-lg font-light mb-10 max-w-xl mx-auto leading-relaxed">
                                    Our analysts track these companies 24/7. Don't just read the news—own the upside.
                                </p>
                                <button
                                    onClick={() => router.push('/#companies')}
                                    className="px-8 py-4 bg-primary text-white text-xs font-bold tracking-[0.2em] uppercase rounded-full hover:bg-primary/90 transition-all hover:scale-105 shadow-xl shadow-primary/20"
                                >
                                    View Live Listings
                                </button>
                            </div>
                        </div>
                    </article>
                </div>
            </main>

            <Footer />
        </div>
    );
}
