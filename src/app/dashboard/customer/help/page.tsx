'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';

interface FaqItem {
    id: string;
    question: string;
    answer: string;
    category: string;
}

const FAQ_DATA: FaqItem[] = [
    // Unlisted Shares Basics
    { id: 'faq1', category: 'Unlisted Shares', question: 'What are unlisted shares?', answer: 'Unlisted shares are equity shares of companies that are not listed on any recognized stock exchange (BSE/NSE). These include pre-IPO companies, startups with ESOPs, and companies that have been delisted. They trade in the secondary market through intermediaries like ShareSaathi.' },
    { id: 'faq2', category: 'Unlisted Shares', question: 'How are unlisted shares priced?', answer: 'Unlisted share prices are determined by supply and demand in the secondary market. Key factors include company valuation, recent funding rounds, financial performance, IPO prospects, and overall market sentiment. Prices can vary between buyers and sellers, which is why we show both Ask (buy) and Bid (sell) prices.' },
    { id: 'faq3', category: 'Unlisted Shares', question: 'Are unlisted shares safe to invest in?', answer: 'Unlisted shares carry higher risk compared to listed shares due to lower liquidity, limited price discovery, and less regulatory oversight. However, they can offer significant returns if the company performs well or goes for an IPO. Always invest only what you can afford to hold long-term and diversify your portfolio.' },
    { id: 'faq4', category: 'Unlisted Shares', question: 'What is the minimum investment amount?', answer: 'The minimum investment varies by company and depends on the lot size and per-share price. Typically, minimum investments range from ₹25,000 to ₹1,00,000. Each company listing on our platform shows the minimum investment required.' },
    { id: 'faq5', category: 'Unlisted Shares', question: 'How long should I hold unlisted shares?', answer: 'Unlisted shares are generally a long-term investment (2-5 years). The ideal exit is usually at or after the company\'s IPO. Some investors also sell in the secondary market when prices are favorable. For tax purposes, holding for more than 24 months qualifies for long-term capital gains treatment.' },

    // Buying & Selling
    { id: 'faq6', category: 'Buying & Selling', question: 'How do I buy unlisted shares?', answer: 'Browse our catalog, select a company, choose quantity, and place an order. You can pay via Razorpay (instant), RTGS/NEFT (bank transfer), or connect with an RM. Once payment is confirmed, shares are transferred to your Demat account within 3-7 business days.' },
    { id: 'faq7', category: 'Buying & Selling', question: 'How do I sell my unlisted shares?', answer: 'Navigate to your portfolio, select the holding you wish to sell, and create a sell order. Our team will find a buyer at the best available price. Once matched, the buyer\'s payment is verified and shares are transferred from your Demat. Settlement takes 3-7 business days.' },
    { id: 'faq8', category: 'Buying & Selling', question: 'What payment methods are accepted?', answer: 'We accept Razorpay (credit/debit cards, UPI, net banking), RTGS/NEFT bank transfers, and RM-assisted transactions. For large orders (above ₹5 lakhs), we recommend RTGS for faster processing.' },

    // Demat Process
    { id: 'faq9', category: 'Demat Process', question: 'What is dematerialization?', answer: 'Dematerialization (demat) is the process of converting physical share certificates into electronic form held in your Demat account. This makes shares easier to trade, store, and track. You need a Demat account with a depository participant (like Zerodha, Groww, or Upstox).' },
    { id: 'faq10', category: 'Demat Process', question: 'How long does dematerialization take?', answer: 'The demat process typically takes 15-21 working days. Steps include: (1) Submit request on our platform, (2) Courier physical certificates to our office, (3) We submit to the RTA (Registrar & Transfer Agent), (4) RTA processes and credits shares to your Demat account.' },
    { id: 'faq11', category: 'Demat Process', question: 'What documents are needed for demat?', answer: 'You need: (1) Original physical share certificates, (2) Dematerialization Request Form (DRF) signed by all holders, (3) Your Demat account Client Master Report (CMR), (4) PAN card copy of all holders. Our team guides you through the entire process.' },

    // Taxation
    { id: 'faq12', category: 'Taxation', question: 'How are unlisted shares taxed?', answer: 'Short-term capital gains (held < 24 months): Taxed at your income tax slab rate. Long-term capital gains (held > 24 months): Taxed at 12.5% without indexation benefit. TDS may apply on certain transactions. Consult a tax advisor for your specific situation.' },
    { id: 'faq13', category: 'Taxation', question: 'Do I need to report unlisted shares in my ITR?', answer: 'Yes. All unlisted share holdings must be disclosed in your Income Tax Return under the appropriate schedule. Capital gains from sale must be reported in the year of sale. Our platform provides a downloadable tax report to simplify this process.' },

    // KYC & Account
    { id: 'faq14', category: 'Account & KYC', question: 'What is the KYC process?', answer: 'KYC (Know Your Customer) verification requires: (1) PAN card, (2) Aadhaar card, (3) Recent bank statement or cancelled cheque, (4) Demat account details (CMR copy). Verification is typically completed within 24-48 hours.' },
    { id: 'faq15', category: 'Account & KYC', question: 'Why is KYC necessary?', answer: 'KYC is mandated by SEBI and anti-money laundering regulations. It ensures the identity of investors and protects against fraud. Completing KYC is required before you can buy or sell shares on our platform.' },

    // Support
    { id: 'faq16', category: 'Support', question: 'How do I contact my RM?', answer: 'You can reach your assigned Relationship Manager through: (1) RM Chat in your dashboard, (2) Schedule a callback at your preferred time, (3) Raise a support ticket for tracked resolution. Your RM is available Mon-Fri, 10 AM - 5 PM IST.' },
    { id: 'faq17', category: 'Support', question: 'What if my order is delayed?', answer: 'Order processing typically takes 3-7 business days. If delayed: (1) Check your order status in the dashboard, (2) Contact your RM via chat, (3) Raise a support ticket. Common reasons for delay include payment verification, depository processing times, or incomplete KYC.' },
];

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const categories = useMemo(() => {
        return Array.from(new Set(FAQ_DATA.map(f => f.category)));
    }, []);

    const filteredFaqs = useMemo(() => {
        let result = FAQ_DATA;
        if (selectedCategory) result = result.filter(f => f.category === selectedCategory);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
        }
        return result;
    }, [searchQuery, selectedCategory]);

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-4xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Help Center</h1>
            </div>
            <p className="text-muted mt-1 mb-8">Find answers to common questions about unlisted shares, demat, and more.</p>

            {/* Search */}
            <div className="relative mb-6">
                <Icon name="MagnifyingGlassIcon" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search for answers..."
                    className="w-full bg-white border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <Link href="/dashboard/customer/rm-chat">
                    <div className="p-4 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all text-center cursor-pointer">
                        <Icon name="ChatBubbleLeftRightIcon" size={24} className="mx-auto text-primary mb-2" />
                        <p className="text-xs font-semibold text-foreground">Chat with RM</p>
                    </div>
                </Link>
                <Link href="/dashboard/customer/tickets">
                    <div className="p-4 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all text-center cursor-pointer">
                        <Icon name="TicketIcon" size={24} className="mx-auto text-orange-600 mb-2" />
                        <p className="text-xs font-semibold text-foreground">Raise a Ticket</p>
                    </div>
                </Link>
                <Link href="/dashboard/customer/callback">
                    <div className="p-4 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all text-center cursor-pointer">
                        <Icon name="PhoneIcon" size={24} className="mx-auto text-green-600 mb-2" />
                        <p className="text-xs font-semibold text-foreground">Request Callback</p>
                    </div>
                </Link>
                <a href="mailto:support@sharesaathi.com">
                    <div className="p-4 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all text-center cursor-pointer">
                        <Icon name="EnvelopeIcon" size={24} className="mx-auto text-blue-600 mb-2" />
                        <p className="text-xs font-semibold text-foreground">Email Support</p>
                    </div>
                </a>
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${!selectedCategory ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-border hover:border-primary/30'}`}
                >
                    All Topics
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-border hover:border-primary/30'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-2">
                {filteredFaqs.length === 0 ? (
                    <div className="py-16 text-center">
                        <Icon name="QuestionMarkCircleIcon" size={32} className="mx-auto text-muted mb-3" />
                        <p className="text-muted font-medium mb-2">No matching questions found.</p>
                        <p className="text-xs text-muted">Try a different search term or <Link href="/dashboard/customer/tickets" className="text-primary hover:underline">raise a ticket</Link>.</p>
                    </div>
                ) : (
                    filteredFaqs.map(faq => {
                        const isExpanded = expandedId === faq.id;
                        return (
                            <Card key={faq.id} className="border-border shadow-sm">
                                <CardContent className="p-0">
                                    <button
                                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface/30 transition-colors"
                                        onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                                    >
                                        <Icon name={isExpanded ? 'MinusCircleIcon' : 'PlusCircleIcon'} size={18} className="text-primary shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground">{faq.question}</p>
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{faq.category}</span>
                                        </div>
                                        <Icon name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} className="text-muted shrink-0" />
                                    </button>
                                    {isExpanded && (
                                        <div className="px-4 pb-4 pl-11 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-sm text-muted leading-relaxed">{faq.answer}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
