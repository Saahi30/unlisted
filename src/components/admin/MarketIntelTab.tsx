'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/utils/supabase/client';

export default function MarketIntelTab() {
    const [prompt, setPrompt] = useState('');
    const [claudeResponse, setClaudeResponse] = useState('');
    const [generating, setGenerating] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // Existing data counts
    const [stats, setStats] = useState({ news: 0, ipoScores: 0, earnings: 0, lastUpdated: '' });
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            const [{ count: newsCount }, { count: ipoCount }, { count: earningsCount }] = await Promise.all([
                supabase.from('market_news').select('*', { count: 'exact', head: true }),
                supabase.from('ipo_scores').select('*', { count: 'exact', head: true }),
                supabase.from('earnings_data').select('*', { count: 'exact', head: true }),
            ]);
            const { data: latestNews } = await supabase
                .from('market_news')
                .select('published_at')
                .order('published_at', { ascending: false })
                .limit(1);

            setStats({
                news: newsCount || 0,
                ipoScores: ipoCount || 0,
                earnings: earningsCount || 0,
                lastUpdated: latestNews?.[0]?.published_at
                    ? new Date(latestNews[0].published_at).toLocaleString('en-IN')
                    : 'Never',
            });
        };
        fetchStats();
    }, [result, supabase]);

    const generatePrompt = async () => {
        setGenerating(true);
        setResult(null);
        try {
            const res = await fetch('/api/admin/market-intel/generate-prompt', { method: 'POST' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPrompt(data.prompt);
        } catch (err: any) {
            setResult({ success: false, message: err.message });
        }
        setGenerating(false);
    };

    const copyPrompt = () => {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const parseAndSave = async () => {
        if (!claudeResponse.trim()) return;
        setParsing(true);
        setResult(null);
        try {
            const res = await fetch('/api/admin/market-intel/parse-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ response: claudeResponse }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResult({ success: true, message: data.message });
            setClaudeResponse('');
        } catch (err: any) {
            setResult({ success: false, message: err.message });
        }
        setParsing(false);
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'News Articles', value: stats.news, icon: 'NewspaperIcon', bg: 'bg-blue-50', text: 'text-blue-600' },
                    { label: 'IPO Scorecards', value: stats.ipoScores, icon: 'ChartBarIcon', bg: 'bg-green-50', text: 'text-green-600' },
                    { label: 'Earnings Records', value: stats.earnings, icon: 'CurrencyRupeeIcon', bg: 'bg-amber-50', text: 'text-amber-600' },
                    { label: 'Last Updated', value: stats.lastUpdated, icon: 'ClockIcon', bg: 'bg-purple-50', text: 'text-purple-600' },
                ].map((s, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.text} flex items-center justify-center`}>
                                <Icon name={s.icon} size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-muted font-medium">{s.label}</p>
                                <p className="text-lg font-bold text-foreground">{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Step 1: Generate Prompt */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">1</span>
                        Generate Research Prompt
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted">
                        Click below to generate a research prompt using Groq. This prompt is tailored to your current company listings.
                    </p>
                    <Button onClick={generatePrompt} disabled={generating}>
                        {generating ? (
                            <>
                                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Icon name="SparklesIcon" size={16} className="mr-2" />
                                Generate Today&apos;s Prompt
                            </>
                        )}
                    </Button>

                    {prompt && (
                        <div className="relative">
                            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                                {prompt}
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={copyPrompt}
                                className="absolute top-2 right-2 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                            >
                                <Icon name={copied ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={14} className="mr-1" />
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Step 2: Paste into Claude */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">2</span>
                        Paste into Claude
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
                        <Icon name="InformationCircleIcon" size={20} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold mb-1">Instructions:</p>
                            <ol className="list-decimal list-inside space-y-1 text-blue-700">
                                <li>Copy the prompt above</li>
                                <li>Open <strong>claude.ai</strong> in a new tab</li>
                                <li>Paste the prompt and send it</li>
                                <li>Wait for Claude to search the web and respond</li>
                                <li>Copy Claude&apos;s entire response (the JSON output)</li>
                                <li>Paste it in Step 3 below</li>
                            </ol>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step 3: Paste Response */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">3</span>
                        Paste Claude&apos;s Response
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <textarea
                        value={claudeResponse}
                        onChange={(e) => setClaudeResponse(e.target.value)}
                        placeholder='Paste the JSON response from Claude here...'
                        className="w-full h-48 bg-surface/50 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-y"
                    />
                    <Button onClick={parseAndSave} disabled={parsing || !claudeResponse.trim()}>
                        {parsing ? (
                            <>
                                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Icon name="ArrowUpTrayIcon" size={16} className="mr-2" />
                                Parse &amp; Save to Database
                            </>
                        )}
                    </Button>

                    {result && (
                        <div className={`p-4 rounded-xl border text-sm font-medium flex gap-2 ${result.success
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <Icon name={result.success ? 'CheckCircleIcon' : 'XCircleIcon'} size={18} className="shrink-0" />
                            {result.message}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
