'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function BlogsPage() {
    const { blogs } = useAppStore();
    const publishedBlogs = blogs
        .filter(b => b.status === 'published')
        .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());

    return (
        <>
            <Header />
            <main className="min-h-screen pt-32 pb-20 bg-surface/30">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="max-w-3xl mb-16">
                        <h1 className="text-5xl font-display font-light tracking-tight text-foreground mb-4">
                            Insights & <span className="text-primary italic">Intelligence</span>
                        </h1>
                        <p className="text-lg text-muted leading-relaxed">
                            Stay ahead of the curve with exclusive intelligence on the unlisted market, upcoming IPOs, and strategic investment analysis.
                        </p>
                    </div>

                    {publishedBlogs.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-border p-20 text-center shadow-sm">
                            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
                                <Icon name="NewspaperIcon" size={32} className="text-muted/40" />
                            </div>
                            <h2 className="text-2xl font-display font-medium text-foreground mb-2">No Insights Yet</h2>
                            <p className="text-muted">We're penning down some exclusive intelligence. Check back shortly.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {publishedBlogs.map(blog => (
                                <Link
                                    key={blog.id}
                                    href={`/blogs/${blog.slug}`}
                                    className="group flex flex-col bg-white rounded-3xl border border-border overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-2 shadow-sm"
                                >
                                    <div className="h-48 bg-surface relative overflow-hidden">
                                        {/* Abstract geometric pattern for placeholder if no image */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Icon name="CpuChipIcon" size={48} className="text-primary/10" />
                                        </div>
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase text-primary border border-primary/10 shadow-sm">
                                                Market Insight
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col flex-1">
                                        <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase text-muted mb-4">
                                            <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span className="w-1 h-1 bg-muted rounded-full" />
                                            <div className="flex items-center gap-1">
                                                <Icon name="EyeIcon" size={12} />
                                                {blog.views} Reads
                                            </div>
                                        </div>
                                        <h2 className="text-xl font-display font-medium text-foreground mb-4 group-hover:text-primary transition-colors leading-tight">
                                            {blog.title}
                                        </h2>
                                        <p className="text-sm text-muted mb-8 line-clamp-3 leading-relaxed flex-1">
                                            {blog.excerpt || "Dive into this exclusive intelligence report curated by our investment analysts."}
                                        </p>
                                        <div className="flex items-center text-xs font-bold tracking-widest uppercase text-primary group-hover:gap-2 transition-all">
                                            Read Full Intel <Icon name="ArrowRightIcon" size={14} className="ml-1" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
