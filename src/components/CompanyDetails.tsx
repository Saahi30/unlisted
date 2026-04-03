import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Company } from '@/lib/mock-data';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CompanyDetails({ company }: { company: Company }) {
    const [activeTab, setActiveTab] = useState('overview');

    let parsedContent: any = null;
    try {
        if (company.aiContext) {
            parsedContent = JSON.parse(company.aiContext);
        }
    } catch (e) {
        // If it's not JSON, we'll treat the whole aiContext as overview
        parsedContent = { overview: company.aiContext || company.description };
    }

    if (!parsedContent) {
        parsedContent = { overview: company.description };
    }

    const availableTabs = [];
    if (parsedContent.overview) availableTabs.push({ id: 'overview', label: 'Overview' });
    if (parsedContent.financials) availableTabs.push({ id: 'financials', label: 'Financials' });
    if (parsedContent.funding) availableTabs.push({ id: 'funding', label: 'Funding & Peers' });
    if (parsedContent.faq) availableTabs.push({ id: 'faq', label: 'FAQs' });

    if (availableTabs.length === 0) return null;

    // Default to the first available tab if the current active tab is not valid
    if (!availableTabs.find(t => t.id === activeTab)) {
        setActiveTab(availableTabs[0].id);
    }

    return (
        <div className="mt-12">
            <div className="flex gap-2 overflow-x-auto border-b border-slate-200 mb-6 no-scrollbar">
                {availableTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6 animate-in fade-in duration-500">
                <Card>
                    <CardContent className="pt-6 prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-blue-600">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {parsedContent[activeTab] || ''}
                        </ReactMarkdown>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
