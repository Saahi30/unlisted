'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/button';

interface Module {
    id: string;
    title: string;
    description: string;
    category: string;
    content_type: string;
    content_body: string;
    duration_minutes: number;
    passing_score: number;
    is_mandatory: boolean;
    sort_order: number;
}

interface Progress {
    id: string;
    module_id: string;
    status: string;
    score: number | null;
    completed_at: string | null;
}

// Simple quiz questions for the AML module
const AML_QUIZ = [
    { q: 'What is the primary purpose of KYC verification?', options: ['Marketing', 'Preventing money laundering', 'Setting prices', 'Client entertainment'], answer: 1 },
    { q: 'When should you report a suspicious transaction?', options: ['Never', 'Only if over ₹10 lakh', 'Immediately to compliance', 'After the transaction completes'], answer: 2 },
    { q: 'Which document is NOT required for KYC?', options: ['PAN Card', 'Aadhar Card', 'Social media profile', 'Bank statement'], answer: 2 },
    { q: 'What does AML stand for?', options: ['All Money Lending', 'Anti-Money Laundering', 'Asset Management Liability', 'Automated Market Listing'], answer: 1 },
    { q: 'What is the maximum cash transaction limit without reporting?', options: ['₹50,000', '₹2,00,000', '₹10,00,000', 'No limit'], answer: 2 },
];

export default function AgentTrainingTab() {
    const { user } = useAuth();
    const supabase = createClient();
    const [modules, setModules] = useState<Module[]>([]);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActiveModule] = useState<Module | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        const fetch = async () => {
            if (!user) return;
            const { data: mData } = await supabase.from('agent_training_modules').select('*').order('sort_order');
            const { data: pData } = await supabase.from('agent_training_progress').select('*').eq('agent_id', user.id);

            if (mData) setModules(mData);
            else {
                setModules([
                    { id: 'm1', title: 'Welcome to ShareSaathi Partner Program', description: 'Learn the basics', category: 'general', content_type: 'article', content_body: '## Welcome!\n\nAs a partner, you earn margins on every sale.', duration_minutes: 5, passing_score: 70, is_mandatory: true, sort_order: 1 },
                    { id: 'm2', title: 'SEBI Compliance Fundamentals', description: 'Regulatory requirements', category: 'compliance', content_type: 'article', content_body: '## SEBI Compliance\n\nAlways provide accurate information.', duration_minutes: 15, passing_score: 70, is_mandatory: true, sort_order: 2 },
                    { id: 'm3', title: 'Effective Sales Techniques', description: 'Master selling unlisted shares', category: 'sales', content_type: 'article', content_body: '## Sales Techniques\n\nUnderstand your client needs first.', duration_minutes: 20, passing_score: 70, is_mandatory: false, sort_order: 3 },
                    { id: 'm4', title: 'Product Knowledge: IPOs', description: 'Pre-IPO investing', category: 'product', content_type: 'article', content_body: '## Pre-IPO Shares\n\nShares of companies planning to go public.', duration_minutes: 15, passing_score: 70, is_mandatory: false, sort_order: 4 },
                    { id: 'm5', title: 'Anti-Money Laundering (AML)', description: 'AML compliance quiz', category: 'compliance', content_type: 'quiz', content_body: '', duration_minutes: 10, passing_score: 70, is_mandatory: true, sort_order: 5 },
                ]);
            }

            if (pData) setProgress(pData);
            setLoading(false);
        };
        fetch();
    }, [user]);

    const getModuleProgress = (moduleId: string) => progress.find(p => p.module_id === moduleId);

    const startModule = async (mod: Module) => {
        setActiveModule(mod);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizScore(0);

        const existing = getModuleProgress(mod.id);
        if (!existing) {
            await supabase.from('agent_training_progress').upsert({
                agent_id: user?.id,
                module_id: mod.id,
                status: 'in_progress',
                started_at: new Date().toISOString(),
            });
            setProgress(prev => [...prev, { id: `p_${Date.now()}`, module_id: mod.id, status: 'in_progress', score: null, completed_at: null }]);
        }
    };

    const completeModule = async (mod: Module, score?: number) => {
        const status = mod.content_type === 'quiz' && score !== undefined && score < mod.passing_score ? 'failed' : 'completed';
        await supabase.from('agent_training_progress').upsert({
            agent_id: user?.id,
            module_id: mod.id,
            status,
            score: score || 100,
            completed_at: new Date().toISOString(),
        });
        setProgress(prev => prev.map(p => p.module_id === mod.id ? { ...p, status, score: score || 100, completed_at: new Date().toISOString() } : p));
        if (status === 'completed') setActiveModule(null);
    };

    const submitQuiz = () => {
        const correct = AML_QUIZ.reduce((acc, q, i) => acc + (quizAnswers[i] === q.answer ? 1 : 0), 0);
        const score = Math.round((correct / AML_QUIZ.length) * 100);
        setQuizScore(score);
        setQuizSubmitted(true);
        if (activeModule) completeModule(activeModule, score);
    };

    const completedCount = progress.filter(p => p.status === 'completed').length;
    const mandatoryModules = modules.filter(m => m.is_mandatory);
    const mandatoryCompleted = mandatoryModules.filter(m => getModuleProgress(m.id)?.status === 'completed').length;

    const filteredModules = filterCategory === 'all' ? modules : modules.filter(m => m.category === filterCategory);
    const categories = ['all', ...Array.from(new Set(modules.map(m => m.category)))];

    const categoryIcons: Record<string, string> = { general: 'BookOpenIcon', compliance: 'ShieldCheckIcon', sales: 'PresentationChartBarIcon', product: 'CubeIcon' };
    const statusColors: Record<string, string> = { completed: 'bg-green-50 text-green-700 border-green-200', in_progress: 'bg-blue-50 text-blue-700 border-blue-200', failed: 'bg-red-50 text-red-700 border-red-200', not_started: 'bg-slate-50 text-slate-600 border-slate-200' };

    if (loading) return <div className="text-center p-8 text-muted">Loading Training...</div>;

    // Active Module View
    if (activeModule) {
        const isQuiz = activeModule.content_type === 'quiz';

        return (
            <div className="space-y-6">
                <button onClick={() => setActiveModule(null)} className="flex items-center gap-2 text-sm text-muted hover:text-foreground">
                    <Icon name="ArrowLeftIcon" size={16} /> Back to Modules
                </button>

                <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-surface/30">
                        <div className="flex items-center gap-2 mb-2">
                            {activeModule.is_mandatory && <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold border border-red-200">MANDATORY</span>}
                            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold capitalize">{activeModule.category}</span>
                        </div>
                        <h2 className="text-xl font-bold text-foreground">{activeModule.title}</h2>
                        <p className="text-sm text-muted mt-1">{activeModule.description} &middot; {activeModule.duration_minutes} min</p>
                    </div>

                    <div className="p-6">
                        {isQuiz && !quizSubmitted ? (
                            <div className="space-y-6">
                                <p className="text-sm text-muted mb-4">Answer all questions. You need {activeModule.passing_score}% to pass.</p>
                                {AML_QUIZ.map((q, i) => (
                                    <div key={i} className="p-4 bg-surface/30 rounded-xl border border-border">
                                        <p className="font-semibold text-foreground text-sm mb-3">{i + 1}. {q.q}</p>
                                        <div className="space-y-2">
                                            {q.options.map((opt, j) => (
                                                <label key={j} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${quizAnswers[i] === j ? 'bg-primary/5 border-primary/30' : 'bg-white border-border hover:bg-surface/50'}`}>
                                                    <input type="radio" name={`q${i}`} checked={quizAnswers[i] === j} onChange={() => setQuizAnswers({ ...quizAnswers, [i]: j })} className="accent-primary" />
                                                    <span className="text-sm">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <Button onClick={submitQuiz} disabled={Object.keys(quizAnswers).length < AML_QUIZ.length} className="bg-primary text-white w-full py-3 font-bold">
                                    Submit Quiz
                                </Button>
                            </div>
                        ) : isQuiz && quizSubmitted ? (
                            <div className="text-center py-8">
                                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${quizScore >= activeModule.passing_score ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    <Icon name={quizScore >= activeModule.passing_score ? 'CheckCircleIcon' : 'XCircleIcon'} size={40} />
                                </div>
                                <h3 className="text-2xl font-bold">{quizScore}%</h3>
                                <p className={`text-sm font-medium mt-2 ${quizScore >= activeModule.passing_score ? 'text-green-600' : 'text-red-600'}`}>
                                    {quizScore >= activeModule.passing_score ? 'Congratulations! You passed!' : `You need ${activeModule.passing_score}% to pass. Try again!`}
                                </p>
                                <div className="mt-6 space-y-3">
                                    {AML_QUIZ.map((q, i) => (
                                        <div key={i} className={`p-3 rounded-lg text-left text-sm ${quizAnswers[i] === q.answer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                            <span className="font-medium">{q.q}</span>
                                            <span className="block text-xs mt-1">Your answer: {q.options[quizAnswers[i]]} {quizAnswers[i] !== q.answer && `| Correct: ${q.options[q.answer]}`}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex justify-center gap-3">
                                    <Button variant="outline" onClick={() => setActiveModule(null)}>Back to Modules</Button>
                                    {quizScore < activeModule.passing_score && (
                                        <Button onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }} className="bg-primary text-white">Retry Quiz</Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* Render markdown-like content */}
                                <div className="prose prose-sm max-w-none">
                                    {activeModule.content_body?.split('\n').map((line, i) => {
                                        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-foreground mt-6 mb-3">{line.replace('## ', '')}</h2>;
                                        if (line.startsWith('### ')) return <h3 key={i} className="text-md font-bold text-foreground mt-4 mb-2">{line.replace('### ', '')}</h3>;
                                        if (line.startsWith('- ')) return <li key={i} className="text-sm text-muted ml-4 mb-1">{line.replace('- ', '')}</li>;
                                        if (line.match(/^\d+\./)) return <li key={i} className="text-sm text-muted ml-4 mb-1 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
                                        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-bold text-foreground mb-1">{line.replace(/\*\*/g, '')}</p>;
                                        if (line.trim() === '') return <br key={i} />;
                                        return <p key={i} className="text-sm text-muted mb-2">{line}</p>;
                                    })}
                                </div>
                                <div className="mt-8 pt-6 border-t border-border flex justify-end">
                                    <Button onClick={() => completeModule(activeModule)} className="bg-primary text-white font-bold px-8">
                                        <Icon name="CheckCircleIcon" size={16} className="mr-2" /> Mark as Complete
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Progress Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Modules</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{modules.length}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-5 border border-green-200 shadow-sm">
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-bold text-green-700 mt-2">{completedCount}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Mandatory</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{mandatoryCompleted}/{mandatoryModules.length}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Completion</p>
                    <p className="text-2xl font-bold text-primary mt-2">{modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0}%</p>
                </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted font-medium">Overall Progress</span>
                    <span className="font-bold text-foreground">{completedCount}/{modules.length} modules</span>
                </div>
                <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${modules.length > 0 ? (completedCount / modules.length) * 100 : 0}%` }} />
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filterCategory === cat ? 'bg-primary text-white' : 'bg-white border border-border text-muted hover:text-foreground'}`}>
                        {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            {/* Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredModules.map(mod => {
                    const prog = getModuleProgress(mod.id);
                    const status = prog?.status || 'not_started';

                    return (
                        <div key={mod.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={() => startModule(mod)}>
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mod.category === 'compliance' ? 'bg-red-50 text-red-600' : mod.category === 'sales' ? 'bg-blue-50 text-blue-600' : mod.category === 'product' ? 'bg-purple-50 text-purple-600' : 'bg-primary/10 text-primary'}`}>
                                            <Icon name={categoryIcons[mod.category] || 'BookOpenIcon'} size={16} />
                                        </div>
                                        <div className="flex gap-1">
                                            {mod.is_mandatory && <span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-bold border border-red-200">REQUIRED</span>}
                                            <span className="text-[8px] bg-surface text-muted px-1.5 py-0.5 rounded-full font-bold capitalize">{mod.content_type}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${statusColors[status]}`}>
                                        {status === 'not_started' ? 'Start' : status.replace('_', ' ')}
                                    </span>
                                </div>
                                <h4 className="font-bold text-foreground text-sm">{mod.title}</h4>
                                <p className="text-xs text-muted mt-1">{mod.description}</p>
                                <div className="flex items-center gap-3 mt-3 text-[10px] text-muted">
                                    <span className="flex items-center gap-1"><Icon name="ClockIcon" size={12} />{mod.duration_minutes} min</span>
                                    {prog?.score != null && <span className="flex items-center gap-1"><Icon name="ChartBarIcon" size={12} />Score: {prog.score}%</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
