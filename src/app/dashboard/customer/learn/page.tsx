'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';

interface Module {
    id: string;
    title: string;
    description: string;
    category: string;
    duration: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    icon: string;
    lessons: { id: string; title: string; content: string }[];
}

const MODULES: Module[] = [
    {
        id: 'mod_1',
        title: 'What Are Unlisted Shares?',
        description: 'Understand the fundamentals of unlisted equity — what they are, how they differ from listed stocks, and why investors are interested.',
        category: 'Basics',
        duration: '8 min',
        difficulty: 'beginner',
        icon: 'AcademicCapIcon',
        lessons: [
            { id: 'l1', title: 'Unlisted vs Listed Shares', content: 'Listed shares trade on recognized stock exchanges (BSE/NSE) with real-time pricing and high liquidity. Unlisted shares trade in the secondary (over-the-counter) market through intermediaries. Key differences:\n\n• **Price discovery**: Listed shares have transparent, real-time prices. Unlisted prices are negotiated between buyer and seller.\n• **Liquidity**: Listed shares can be sold instantly. Unlisted shares may take days to find a buyer.\n• **Regulation**: Listed companies face strict SEBI disclosure norms. Unlisted companies have lighter reporting requirements.\n• **Settlement**: Listed trades settle in T+1. Unlisted transfers take 3-7 business days via off-market transfer.' },
            { id: 'l2', title: 'Who Issues Unlisted Shares?', content: 'Unlisted shares come from several sources:\n\n• **Pre-IPO companies**: Companies preparing for a public listing (e.g., Swiggy, Razorpay before their IPO)\n• **ESOPs**: Employee stock options from startups — employees often sell these in the secondary market\n• **Delisted companies**: Previously listed companies that voluntarily or involuntarily exited exchanges\n• **Private companies**: Firms that have never gone public but have tradeable shares from early investors\n\nMost unlisted share activity in India revolves around pre-IPO companies where investors hope to buy at a discount before the IPO listing price.' },
            { id: 'l3', title: 'Why Invest in Unlisted Shares?', content: 'Key reasons investors choose unlisted shares:\n\n• **Early access**: Buy into high-growth companies before the general public can at IPO\n• **Potential returns**: If a company lists at a premium, early investors can see 2-10x returns\n• **Portfolio diversification**: Exposure to sectors/companies not available on exchanges\n• **Valuation arbitrage**: Secondary market prices are sometimes lower than intrinsic value\n\n**Risks to consider**: Lower liquidity, limited information, no guaranteed exit, potential for total loss if company fails. Only invest money you can afford to lock in for 2-5 years.' },
        ],
    },
    {
        id: 'mod_2',
        title: 'How Demat Works',
        description: 'Learn the complete dematerialization process — converting physical share certificates to electronic format in your Demat account.',
        category: 'Processes',
        duration: '10 min',
        difficulty: 'beginner',
        icon: 'DocumentTextIcon',
        lessons: [
            { id: 'l4', title: 'What is a Demat Account?', content: 'A Demat (dematerialized) account holds your shares in electronic form, similar to how a bank account holds money. In India, two depositories manage Demat accounts:\n\n• **NSDL** (National Securities Depository Limited)\n• **CDSL** (Central Depository Services Limited)\n\nYou open a Demat account through a **Depository Participant (DP)** — your broker (Zerodha, Groww, Upstox, etc.). Each account has a unique **DP ID + Client ID** combination that identifies your holdings.' },
            { id: 'l5', title: 'The Dematerialization Process', content: 'Converting physical certificates to electronic shares:\n\n**Step 1**: Fill a **Dematerialization Request Form (DRF)** available from your DP\n**Step 2**: Submit the DRF along with original share certificates to your DP\n**Step 3**: DP forwards the request to the **RTA** (Registrar & Transfer Agent) of the company\n**Step 4**: RTA verifies certificates, confirms with the depository, and credits shares to your Demat\n**Step 5**: Physical certificates are destroyed; shares appear electronically in your account\n\n**Timeline**: 15-21 working days on average\n**Cost**: ₹25-50 per certificate (varies by DP)' },
            { id: 'l6', title: 'Off-Market Transfer', content: 'When you buy unlisted shares, the seller transfers them via **off-market transfer** (not through the exchange):\n\n• Seller initiates a **DIS (Delivery Instruction Slip)** or uses online transfer via their DP\n• Seller enters your DP ID, Client ID, ISIN, and quantity\n• Transfer happens within 24-48 hours once both parties confirm\n• No brokerage or STT charges on off-market transfers\n• Capital gains tax still applies based on holding period\n\nAlways verify the ISIN number matches the company you\'re buying. Keep your CMR (Client Master Report) handy for the seller.' },
        ],
    },
    {
        id: 'mod_3',
        title: 'Reading Financial Statements',
        description: 'Decode balance sheets, P&L statements, and cash flow to evaluate unlisted companies like a pro.',
        category: 'Analysis',
        duration: '15 min',
        difficulty: 'intermediate',
        icon: 'ChartBarIcon',
        lessons: [
            { id: 'l7', title: 'The Income Statement (P&L)', content: 'The Profit & Loss statement shows revenue and expenses over a period:\n\n• **Revenue**: Total money earned from core operations\n• **EBITDA**: Earnings Before Interest, Tax, Depreciation & Amortization — shows operating profitability\n• **OPM (Operating Profit Margin)**: EBITDA / Revenue — higher is better\n• **PAT (Profit After Tax)**: The bottom line — actual profit for shareholders\n• **EPS (Earnings Per Share)**: PAT / Total Shares — useful for per-share valuation\n\n**For unlisted companies**: Focus on revenue growth rate (>20% YoY is good), improving margins, and the path to profitability. Many pre-IPO companies are not yet profitable — that\'s okay if revenue is growing fast.' },
            { id: 'l8', title: 'The Balance Sheet', content: 'The balance sheet is a snapshot of what a company owns and owes:\n\n**Assets** (what it owns):\n• Fixed Assets: Property, equipment, land\n• Current Assets: Cash, receivables, inventory\n• Investments: Stakes in other companies\n\n**Liabilities** (what it owes):\n• Borrowings: Loans and debt\n• Trade Payables: Money owed to suppliers\n• Shareholder Equity: Capital + Reserves\n\n**Key ratios**:\n• **Debt-to-Equity**: Borrowings / Equity — below 1.0 is healthy\n• **Book Value**: (Total Assets - Total Liabilities) / Shares — floor value per share\n• **Current Ratio**: Current Assets / Current Liabilities — above 1.5 means good liquidity' },
            { id: 'l9', title: 'Cash Flow Analysis', content: 'Cash flow shows actual money movement (unlike P&L which includes non-cash items):\n\n• **Operating Cash Flow (OCF)**: Cash from core business. Positive OCF means the business generates real cash.\n• **Investing Cash Flow**: Cash spent on assets, acquisitions. Negative is normal for growing companies.\n• **Financing Cash Flow**: Cash from fundraising, debt, or dividends.\n\n**Why it matters for unlisted shares**:\n• A company can show profits on P&L but be cash-negative (aggressive accounting)\n• Positive operating cash flow is the #1 sign of a healthy business\n• Compare OCF to PAT — if OCF is consistently lower, investigate why\n• For pre-IPO companies, check the burn rate (how fast they spend cash) vs. runway (how long cash lasts)' },
        ],
    },
    {
        id: 'mod_4',
        title: 'Taxation of Unlisted Shares',
        description: 'Complete guide to capital gains tax, TDS, and ITR filing for unlisted share investments.',
        category: 'Tax & Legal',
        duration: '12 min',
        difficulty: 'intermediate',
        icon: 'CalculatorIcon',
        lessons: [
            { id: 'l10', title: 'Capital Gains Tax Rules', content: 'Unlisted shares have specific tax treatment:\n\n**Short-Term Capital Gains (STCG)** — held less than 24 months:\n• Taxed at your **income tax slab rate** (up to 30% + surcharge + cess)\n• Added to your total income for the year\n\n**Long-Term Capital Gains (LTCG)** — held more than 24 months:\n• Taxed at **12.5%** flat rate (as per Budget 2025)\n• **No indexation benefit** available for unlisted shares\n• Much more favorable — always try to hold for 24+ months if possible\n\n**Tip**: The holding period is calculated from the date of allotment/transfer (when shares hit your Demat) to the date of sale.' },
            { id: 'l11', title: 'ITR Filing for Unlisted Shares', content: 'How to report unlisted shares in your tax return:\n\n• **Schedule CG**: Report capital gains from sale in the relevant assessment year\n• **Schedule FA**: If shares are in a foreign company, report under foreign assets\n• **Schedule AL**: Report unlisted shareholdings if total income exceeds ₹50 lakhs\n\n**Documents needed**:\n• Purchase and sale invoices/contract notes\n• Demat statements showing transfer dates\n• Cost of acquisition proof\n• ShareSaathi provides a downloadable tax report to simplify this\n\n**Common mistakes**: Not reporting unsold holdings (must declare in Schedule AL), using wrong holding period, not accounting for transfer charges in cost basis.' },
        ],
    },
    {
        id: 'mod_5',
        title: 'IPO Analysis Framework',
        description: 'How to evaluate an upcoming IPO — pricing, GMP, allotment odds, and listing day strategy.',
        category: 'Analysis',
        duration: '10 min',
        difficulty: 'advanced',
        icon: 'RocketLaunchIcon',
        lessons: [
            { id: 'l12', title: 'Understanding IPO Pricing', content: 'Key concepts for IPO valuation:\n\n• **Price Band**: The range set by the company and investment banks (e.g., ₹350-385)\n• **GMP (Grey Market Premium)**: Unofficial premium at which IPO shares trade before listing. If GMP is ₹50 on a ₹385 IPO, expected listing is ~₹435\n• **Subscription Ratio**: How many times the IPO is oversubscribed (3x means 3 bids for every 1 share available)\n\n**For unlisted share holders**: Compare your purchase price to the IPO price band. If you bought at ₹300 and IPO is at ₹385, you already have a 28% built-in gain before listing.' },
            { id: 'l13', title: 'Listing Day Strategy', content: 'What happens when your unlisted company finally lists:\n\n• **Lock-in period**: Pre-IPO shares typically have NO lock-in for retail investors who bought in secondary market (unlike anchor/promoter shares)\n• **Listing day volatility**: Prices can swing 20-50% on day one. Have a target price in mind.\n• **Partial exit**: Consider selling 50% on listing to book profits, hold 50% for long-term\n• **Tax impact**: If you held for 24+ months before listing, gains taxed at 12.5% LTCG. After listing, it becomes a listed share — different tax rules apply for future sales.\n\n**Key rule**: Never let greed override your exit strategy. A 2-3x return in 2-3 years is exceptional.' },
        ],
    },
];

const difficultyConfig = {
    beginner: { label: 'Beginner', color: 'bg-green-100 text-green-700' },
    intermediate: { label: 'Intermediate', color: 'bg-blue-100 text-blue-700' },
    advanced: { label: 'Advanced', color: 'bg-purple-100 text-purple-700' },
};

export default function LearnPage() {
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [currentLesson, setCurrentLesson] = useState(0);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [filterCategory, setFilterCategory] = useState<string | null>(null);

    const categories = Array.from(new Set(MODULES.map(m => m.category)));
    const filtered = filterCategory ? MODULES.filter(m => m.category === filterCategory) : MODULES;

    const activeModule = MODULES.find(m => m.id === selectedModule);
    const activeLesson = activeModule?.lessons[currentLesson];

    const completedCount = MODULES.reduce((sum, m) => {
        const done = m.lessons.every(l => completedLessons.has(l.id));
        return sum + (done ? 1 : 0);
    }, 0);

    const totalLessonsCompleted = completedLessons.size;
    const totalLessons = MODULES.reduce((s, m) => s + m.lessons.length, 0);

    const markComplete = (lessonId: string) => {
        setCompletedLessons(prev => new Set([...prev, lessonId]));
    };

    if (activeModule && activeLesson) {
        const progress = ((currentLesson + 1) / activeModule.lessons.length) * 100;
        const isLastLesson = currentLesson === activeModule.lessons.length - 1;
        const isCompleted = completedLessons.has(activeLesson.id);

        return (
            <div className="container mx-auto px-4 md:px-8 py-8 max-w-3xl">
                {/* Back + Progress */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => { setSelectedModule(null); setCurrentLesson(0); }} className="text-muted hover:text-foreground transition-colors">
                        <Icon name="ArrowLeftIcon" size={18} />
                    </button>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">{activeModule.title}</p>
                        <p className="text-sm text-foreground font-semibold">Lesson {currentLesson + 1} of {activeModule.lessons.length}</p>
                    </div>
                    <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-surface rounded-full h-1.5 mb-8">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>

                {/* Lesson Content */}
                <Card className="border-border shadow-sm mb-6">
                    <CardHeader className="border-b border-border/50 bg-white pb-4">
                        <CardTitle className="font-display font-medium text-xl">{activeLesson.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                            {activeLesson.content.split('\n').map((line, i) => {
                                if (line.startsWith('**') && line.endsWith('**')) {
                                    return <h4 key={i} className="font-bold text-foreground mt-4 mb-2">{line.replace(/\*\*/g, '')}</h4>;
                                }
                                if (line.startsWith('• ')) {
                                    const text = line.slice(2);
                                    const parts = text.split(/\*\*(.*?)\*\*/);
                                    return (
                                        <div key={i} className="flex gap-2 ml-2 mb-1.5">
                                            <span className="text-primary mt-1">•</span>
                                            <p className="text-sm">{parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}</p>
                                        </div>
                                    );
                                }
                                if (line.trim() === '') return <div key={i} className="h-3" />;
                                const parts = line.split(/\*\*(.*?)\*\*/);
                                return <p key={i} className="text-sm mb-2">{parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}</p>;
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
                        disabled={currentLesson === 0}
                    >
                        <Icon name="ArrowLeftIcon" size={14} className="mr-1" /> Previous
                    </Button>

                    <div className="flex gap-2">
                        {!isCompleted && (
                            <Button variant="outline" onClick={() => markComplete(activeLesson.id)} className="text-green-600 border-green-200 hover:bg-green-50">
                                <Icon name="CheckCircleIcon" size={14} className="mr-1" /> Mark Complete
                            </Button>
                        )}
                        {isCompleted && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 px-3 py-2 bg-green-50 rounded-lg">
                                <Icon name="CheckCircleIcon" size={14} /> Completed
                            </span>
                        )}
                    </div>

                    {isLastLesson ? (
                        <Button onClick={() => { markComplete(activeLesson.id); setSelectedModule(null); setCurrentLesson(0); }} className="bg-primary text-white hover:bg-primary/90">
                            Finish Module <Icon name="CheckIcon" size={14} className="ml-1" />
                        </Button>
                    ) : (
                        <Button onClick={() => { markComplete(activeLesson.id); setCurrentLesson(currentLesson + 1); }} className="bg-primary text-white hover:bg-primary/90">
                            Next <Icon name="ArrowRightIcon" size={14} className="ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Learning Modules</h1>
            </div>
            <p className="text-muted mt-1 mb-8">Short courses on unlisted shares, reading financials, taxation, and more.</p>

            {/* Progress Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Modules Done</p>
                    <p className="text-2xl font-bold text-foreground">{completedCount}/{MODULES.length}</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Lessons Done</p>
                    <p className="text-2xl font-bold text-primary">{totalLessonsCompleted}/{totalLessons}</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Progress</p>
                    <p className="text-2xl font-bold text-foreground">{totalLessons > 0 ? Math.round((totalLessonsCompleted / totalLessons) * 100) : 0}%</p>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilterCategory(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${!filterCategory ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-border hover:border-primary/30'}`}
                >
                    All
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-border hover:border-primary/30'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(mod => {
                    const lessonsCompleted = mod.lessons.filter(l => completedLessons.has(l.id)).length;
                    const isModuleComplete = lessonsCompleted === mod.lessons.length;
                    const diff = difficultyConfig[mod.difficulty];

                    return (
                        <Card key={mod.id} className={`border-border shadow-sm hover:shadow-md transition-all cursor-pointer ${isModuleComplete ? 'ring-1 ring-green-200' : ''}`} onClick={() => { setSelectedModule(mod.id); setCurrentLesson(0); }}>
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="p-2 rounded-xl bg-primary/5">
                                        <Icon name={mod.icon} size={20} className="text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${diff.color}`}>{diff.label}</span>
                                            <span className="text-[10px] text-muted font-medium">{mod.duration}</span>
                                            {isModuleComplete && <Icon name="CheckBadgeIcon" size={16} className="text-green-500" />}
                                        </div>
                                        <h3 className="font-semibold text-foreground text-sm">{mod.title}</h3>
                                    </div>
                                </div>
                                <p className="text-xs text-muted leading-relaxed mb-3">{mod.description}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 w-24 bg-surface rounded-full h-1.5">
                                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${mod.lessons.length > 0 ? (lessonsCompleted / mod.lessons.length) * 100 : 0}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-muted">{lessonsCompleted}/{mod.lessons.length}</span>
                                    </div>
                                    <span className="text-xs font-bold text-primary">{isModuleComplete ? 'Review' : lessonsCompleted > 0 ? 'Continue' : 'Start'} →</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
