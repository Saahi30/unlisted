'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/button';

interface Material {
    id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    template_body: string;
    file_url: string | null;
    company_id: string | null;
    min_tier: string;
    is_active: boolean;
}

const TIER_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum'];

export default function AgentMarketingTab({ currentTier }: { currentTier: string }) {
    const { user } = useAuth();
    const supabase = createClient();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('all');
    const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
    const [customValues, setCustomValues] = useState<Record<string, string>>({});

    const tierIdx = TIER_ORDER.indexOf(currentTier || 'Bronze');

    useEffect(() => {
        const fetch = async () => {
            if (!user) return;
            const { data } = await supabase.from('agent_marketing_materials').select('*').eq('is_active', true);

            if (data) setMaterials(data);
            else {
                setMaterials([
                    { id: '1', title: 'WhatsApp: General Investment Pitch', description: 'Standard WhatsApp forward', type: 'template', category: 'whatsapp', template_body: 'Hi {{client_name}}!\n\nAre you looking to invest in high-growth unlisted companies?\n\nI can help you access pre-IPO shares at competitive prices.\n\nBenefits:\n- Potential listing gains\n- Portfolio diversification\n- Expert guidance\n\nInterested? Reply YES!\n\nRegards,\n{{agent_name}}\nShareSaathi Partner', file_url: null, company_id: null, min_tier: 'Bronze', is_active: true },
                    { id: '2', title: 'WhatsApp: Company-Specific Pitch', description: 'Promote a specific company', type: 'template', category: 'whatsapp', template_body: 'Hi {{client_name}}!\n\n*{{company_name}}* shares available!\n\nPrice: ₹{{price}} per share\n\nKey Highlights:\n- Strong financials\n- IPO expected soon\n\nSecure your shares: {{payment_link}}\n\nRegards,\n{{agent_name}}', file_url: null, company_id: null, min_tier: 'Bronze', is_active: true },
                    { id: '3', title: 'Email: Monthly Newsletter', description: 'Professional monthly update', type: 'template', category: 'email', template_body: 'Subject: Monthly Unlisted Shares Update\n\nDear {{client_name}},\n\nHere are this month\'s top opportunities:\n\n{{company_list}}\n\nFor personalized recommendations, reply to this email.\n\nBest regards,\n{{agent_name}}\nShareSaathi Partner', file_url: null, company_id: null, min_tier: 'Silver', is_active: true },
                    { id: '4', title: 'Social Media: Investment Tips', description: 'Social media post template', type: 'template', category: 'social', template_body: 'Did you know? Pre-IPO investing can offer significant returns.\n\n3 things to consider:\n1. Company fundamentals\n2. IPO timeline\n3. Your risk appetite\n\nWant to explore? DM me!\n\n#UnlistedShares #PreIPO #Investment', file_url: null, company_id: null, min_tier: 'Bronze', is_active: true },
                ]);
            }
            setLoading(false);
        };
        fetch();
    }, [user]);

    const canAccess = (minTier: string) => TIER_ORDER.indexOf(minTier) <= tierIdx;

    const fillTemplate = (template: string) => {
        let filled = template;
        filled = filled.replace(/\{\{agent_name\}\}/g, customValues.agent_name || user?.name || 'Agent');
        filled = filled.replace(/\{\{client_name\}\}/g, customValues.client_name || '[Client Name]');
        filled = filled.replace(/\{\{company_name\}\}/g, customValues.company_name || '[Company Name]');
        filled = filled.replace(/\{\{price\}\}/g, customValues.price || '[Price]');
        filled = filled.replace(/\{\{payment_link\}\}/g, customValues.payment_link || '[Payment Link]');
        filled = filled.replace(/\{\{company_list\}\}/g, customValues.company_list || '[Company List]');
        filled = filled.replace(/\{\{month\}\}/g, new Date().toLocaleDateString('en-IN', { month: 'long' }));
        filled = filled.replace(/\{\{insights\}\}/g, customValues.insights || '[Market Insights]');
        return filled;
    };

    const getPlaceholders = (template: string) => {
        const matches = template.match(/\{\{(\w+)\}\}/g) || [];
        return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))].filter(p => p !== 'agent_name');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const shareViaWhatsApp = (text: string) => {
        const encoded = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    };

    const categories = ['all', 'whatsapp', 'email', 'social'];
    const filteredMaterials = filterCategory === 'all' ? materials : materials.filter(m => m.category === filterCategory);

    const categoryIcons: Record<string, string> = { whatsapp: 'ChatBubbleLeftIcon', email: 'EnvelopeIcon', social: 'GlobeAltIcon', general: 'DocumentTextIcon' };
    const categoryColors: Record<string, string> = { whatsapp: 'bg-green-50 text-green-600 border-green-200', email: 'bg-purple-50 text-purple-600 border-purple-200', social: 'bg-blue-50 text-blue-600 border-blue-200' };

    if (loading) return <div className="text-center p-8 text-muted">Loading Marketing Toolkit...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-display font-bold text-lg text-foreground">Marketing Toolkit</h3>
                    <p className="text-sm text-muted">Ready-to-use templates for WhatsApp, Email, and Social Media</p>
                </div>
                <div className="flex gap-2">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterCategory === cat ? 'bg-primary text-white' : 'bg-white border border-border text-muted hover:text-foreground'}`}>
                            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Template Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMaterials.map(mat => {
                    const accessible = canAccess(mat.min_tier);
                    return (
                        <div key={mat.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${accessible ? 'border-border hover:shadow-md cursor-pointer' : 'border-border opacity-60'}`} onClick={() => accessible && setPreviewMaterial(mat)}>
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${categoryColors[mat.category] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            <Icon name={categoryIcons[mat.category] || 'DocumentTextIcon'} size={16} />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface text-muted">{mat.type}</span>
                                    </div>
                                    {!accessible && (
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                            <Icon name="LockClosedIcon" size={10} /> {mat.min_tier}+
                                        </span>
                                    )}
                                </div>
                                <h4 className="font-bold text-foreground text-sm">{mat.title}</h4>
                                <p className="text-xs text-muted mt-1">{mat.description}</p>
                                <p className="text-xs text-muted mt-3 line-clamp-2 italic bg-surface/50 p-2 rounded-lg">{mat.template_body?.slice(0, 100)}...</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Preview Modal */}
            {previewMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-border bg-surface/30 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-display text-lg font-bold">{previewMaterial.title}</h3>
                                <p className="text-xs text-muted mt-0.5">{previewMaterial.description}</p>
                            </div>
                            <button onClick={() => { setPreviewMaterial(null); setCustomValues({}); }} className="text-muted hover:text-foreground p-1.5 rounded-lg"><Icon name="XMarkIcon" size={20} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {/* Customization Fields */}
                            <div>
                                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Customize Template</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {getPlaceholders(previewMaterial.template_body).map(placeholder => (
                                        <div key={placeholder}>
                                            <label className="text-[10px] font-bold text-muted uppercase block mb-1">{placeholder.replace(/_/g, ' ')}</label>
                                            <input
                                                type="text"
                                                value={customValues[placeholder] || ''}
                                                onChange={e => setCustomValues({ ...customValues, [placeholder]: e.target.value })}
                                                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                                                placeholder={`Enter ${placeholder.replace(/_/g, ' ')}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div>
                                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Preview</p>
                                <div className={`p-4 rounded-xl border whitespace-pre-wrap text-sm leading-relaxed ${previewMaterial.category === 'whatsapp' ? 'bg-green-50/50 border-green-200' : 'bg-surface/50 border-border'}`}>
                                    {fillTemplate(previewMaterial.template_body)}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-white flex items-center gap-3 shrink-0">
                            <Button onClick={() => copyToClipboard(fillTemplate(previewMaterial.template_body))} variant="outline" className="flex-1">
                                <Icon name="DocumentDuplicateIcon" size={16} className="mr-1" /> Copy Text
                            </Button>
                            {previewMaterial.category === 'whatsapp' && (
                                <Button onClick={() => shareViaWhatsApp(fillTemplate(previewMaterial.template_body))} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                                    <Icon name="ChatBubbleLeftIcon" size={16} className="mr-1" /> Share via WhatsApp
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
