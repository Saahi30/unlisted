import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Building2, TrendingUp, Info, HelpCircle, Users, Activity, Layers, Coins } from 'lucide-react';

export default function ZeptoDetails() {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'financials', label: 'Financials' },
        { id: 'funding', label: 'Funding & Peers' },
        { id: 'faq', label: 'FAQs' }
    ];

    return (
        <div className="mt-12">
            <div className="flex gap-2 overflow-x-auto border-b border-slate-200 mb-6 no-scrollbar">
                {tabs.map(tab => (
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

            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <Card>
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-600" /> Instrument & Pricing Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Instrument Type</p>
                                    <p className="font-medium text-slate-900">CCPS (792.6461 Eq. Equiv)</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Lot Size</p>
                                    <p className="font-medium text-slate-900">2 shares</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Depositories</p>
                                    <p className="font-medium text-slate-900">NSDL & CDSL</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">PAN (Company)</p>
                                    <p className="font-medium text-slate-900">AAICK4821A</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">CIN</p>
                                    <p className="font-medium text-slate-900 text-sm">U72900MH2020PTC351339</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">RTA</p>
                                    <p className="font-medium text-slate-900">KFin Technologies</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Mkt Cap</p>
                                    <p className="font-medium text-slate-900">₹51,229 crore</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">P/B Ratio</p>
                                    <p className="font-medium text-slate-900">78.26</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">D/E Ratio</p>
                                    <p className="font-medium text-slate-900">0.26</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">ROE</p>
                                    <p className="font-medium text-red-600">-202.02%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Book Value</p>
                                    <p className="font-medium text-slate-900">₹0.69</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Face Value</p>
                                    <p className="font-medium text-slate-900">₹10</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-600" /> Business Model
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="text-sm text-slate-600 leading-relaxed max-w-none">
                                    Zepto is a quick commerce company promising 10–15 minute delivery of groceries and daily essentials.
                                    They operate a dark store (micro-fulfilment center) model in dense urban areas.
                                </p>
                                <ul className="mt-4 space-y-2 text-sm text-slate-600 list-disc pl-5">
                                    <li>Hyperlocal logistics to minimize delivery time.</li>
                                    <li>Tech-enabled supply chain with demand forecasting.</li>
                                    <li>In-house inventory management for most SKUs.</li>
                                    <li>Asset-heavy model optimized for speed & reliability.</li>
                                </ul>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Coins className="h-5 w-5 text-blue-600" /> Revenue Streams
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-3 text-sm text-slate-600 list-disc pl-5">
                                    <li><strong>Direct sale of products:</strong> Margin = retail price – procurement cost.</li>
                                    <li><strong>Private label brands:</strong> Higher-margin in-house brands (staples, dairy, snacks).</li>
                                    <li><strong>Delivery charges:</strong> Applied on low value orders or peak slots.</li>
                                    <li><strong>Advertising income:</strong> Sponsored listings, in-app brand placements.</li>
                                    <li><strong>Platform fees:</strong> Paid by FMCG brands for promotions, prioritization.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'financials' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <Card>
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-600" /> P&L Statement (₹ in Crores)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 p-0 md:p-6 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="font-semibold text-slate-900 w-[40%]">Particulars</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-900">FY 2022</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-900">FY 2023</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-900">FY 2024</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Revenue</TableCell>
                                        <TableCell className="text-right text-slate-600">141</TableCell>
                                        <TableCell className="text-right text-slate-600">2,024</TableCell>
                                        <TableCell className="text-right font-semibold text-slate-900">4,455</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium text-slate-500">Cost of Materials</TableCell>
                                        <TableCell className="text-right text-slate-500">213</TableCell>
                                        <TableCell className="text-right text-slate-500">1,894</TableCell>
                                        <TableCell className="text-right text-slate-500">3,500</TableCell>
                                    </TableRow>
                                    <TableRow className="bg-blue-50/50">
                                        <TableCell className="font-bold">EBITDA</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">-371</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">-1,215</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">-1,164</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium text-slate-500">Other Expenses</TableCell>
                                        <TableCell className="text-right text-slate-500">314</TableCell>
                                        <TableCell className="text-right text-slate-500">1,171</TableCell>
                                        <TableCell className="text-right text-slate-500">1,662</TableCell>
                                    </TableRow>
                                    <TableRow className="bg-slate-50">
                                        <TableCell className="font-bold">PAT (Net Profit)</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">-390</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">-1,272</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">-1,298</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium text-slate-500">EPS (Diluted)</TableCell>
                                        <TableCell className="text-right text-slate-500">-1,477.27</TableCell>
                                        <TableCell className="text-right text-slate-500">-1,514.29</TableCell>
                                        <TableCell className="text-right text-slate-500">-1,366.32</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-blue-600" /> Balance Sheet (FY24 in Cr)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                        <span className="text-sm font-medium text-slate-900">Total Assets</span>
                                        <span className="text-sm font-bold text-slate-900">₹1,932</span>
                                    </div>
                                    <ul className="text-sm text-slate-600 space-y-2">
                                        <li className="flex justify-between"><span>Fixed Assets</span> <span>₹468</span></li>
                                        <li className="flex justify-between"><span>Trade Receivables</span> <span>₹324</span></li>
                                        <li className="flex justify-between"><span>Inventory</span> <span>₹127</span></li>
                                        <li className="flex justify-between"><span>Other Assets</span> <span>₹1,011</span></li>
                                    </ul>
                                    <div className="flex justify-between items-center pt-2 pb-2 border-b border-t border-slate-100 mt-4">
                                        <span className="text-sm font-medium text-slate-900">Total Liabilities</span>
                                        <span className="text-sm font-bold text-slate-900">₹1,932</span>
                                    </div>
                                    <ul className="text-sm text-slate-600 space-y-2">
                                        <li className="flex justify-between"><span>Share Capital</span> <span>₹9.5</span></li>
                                        <li className="flex justify-between"><span>Reserves</span> <span>₹633</span></li>
                                        <li className="flex justify-between"><span>Borrowings</span> <span>₹164</span></li>
                                        <li className="flex justify-between"><span>Trade Payables</span> <span>₹574</span></li>
                                        <li className="flex justify-between"><span>Other Liabilities</span> <span>₹551.5</span></li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Download className="h-5 w-5 text-blue-600" /> Documents & Reports
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-3">
                                <Button variant="outline" className="w-full justify-between h-auto py-3">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-semibold text-slate-900">KPL Merger with KPTL</span>
                                        <span className="text-xs text-slate-500">Date: 04 Feb 2025</span>
                                    </div>
                                    <Download className="h-4 w-4 text-slate-400" />
                                </Button>
                                <Button variant="outline" className="w-full justify-between h-auto py-3">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-semibold text-slate-900">Valuation Report of Zepto</span>
                                        <span className="text-xs text-slate-500">Date: 02 Oct 2024</span>
                                    </div>
                                    <Download className="h-4 w-4 text-slate-400" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'funding' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600" /> Funding History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="relative border-l border-slate-200 ml-3 space-y-6">
                                    <li className="pl-6 relative">
                                        <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                                        <p className="text-sm font-semibold text-slate-900">Sept 2024</p>
                                        <p className="text-sm text-slate-600 mt-1">Founding round at $5B valuation (~₹41,000 Cr).</p>
                                    </li>
                                    <li className="pl-6 relative">
                                        <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                                        <p className="text-sm font-semibold text-slate-700">Aug 2023</p>
                                        <p className="text-sm text-slate-600 mt-1">$200M Series E at ~$1.4B valuation.</p>
                                    </li>
                                    <li className="pl-6 relative">
                                        <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                                        <p className="text-sm font-semibold text-slate-700">May 2022</p>
                                        <p className="text-sm text-slate-600 mt-1">$200M Series D at $900M valuation (Kaiser Permanente, Nexus).</p>
                                    </li>
                                    <li className="pl-6 relative">
                                        <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                                        <p className="text-sm font-semibold text-slate-700">Dec 2021</p>
                                        <p className="text-sm text-slate-600 mt-1">$100M Series C at $570M valuation (Glade Brook, YC).</p>
                                    </li>
                                    <li className="pl-6 relative">
                                        <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                                        <p className="text-sm font-semibold text-slate-700">Aug 2021</p>
                                        <p className="text-sm text-slate-600 mt-1">$60M Series A led by Nexus Venture Partners.</p>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" /> Competitors
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="mb-6">
                                    <h4 className="font-semibold text-slate-900 mb-2">Direct Competitors</h4>
                                    <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                                        <li><strong>Blinkit (Zomato):</strong> High geographic coverage, sub-10 minute promise.</li>
                                        <li><strong>Swiggy Instamart:</strong> Built efficiently on Swiggy's food logistics infrastructure.</li>
                                        <li><strong>BigBasket BB Now:</strong> Tata-backed quick commerce expanding rapidly.</li>
                                        <li><strong>Dunzo Daily:</strong> Google-backed but localized.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-2">Indirect Competitors</h4>
                                    <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                                        <li><strong>Amazon Fresh, Flipkart Quick:</strong> Slower speeds but massive assortment and pricing power.</li>
                                        <li><strong>ONDC Network:</strong> Empowering local kiranas to aggregate natively.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'faq' && (
                <div className="space-y-4 animate-in fade-in duration-500 max-w-3xl">
                    <Card>
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-blue-600" /> Frequently Asked Questions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div>
                                <h4 className="font-semibold text-slate-900 text-base mb-1">How can I buy Zepto unlisted shares?</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Simply confirm the trade price on our platform and provide your CMR, PAN, and a cancelled cheque. 
                                    Once you transfer the funds via RTGS/NEFT/IMPS (no cash), the shares are securely credited to your Demat account within 24 hours.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-base mb-1">Are there lock-in periods?</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Yes. For ordinary retail and HNI investors, pre-IPO shares carry a strict 6-month lock-in starting from the IPO listing date.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-base mb-1">How are unlisted shares taxed?</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    <strong>LTCG:</strong> For unlisted shares held over 2 years, tax is a flat 12.5% (effective July 2024, no indexation). <br/>
                                    <strong>STCG:</strong> If held for &lt; 2 years, gains are added to your income and taxed at your applicable slab rate.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-base mb-1">Is this legal and regulated?</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Yes, buying and selling unlisted shares is completely legal in India. It is governed under standard SEBI and Companies Act guidelines. However, you must conduct individual due diligence.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-base mb-1">Where do these shares come from?</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    We source them securely from employees leveraging ESOPs and from initial or early-stage investors who are looking to liquidate part of their holdings.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

// Ensure ZeptoDetails can accept an optional company prop to fallback if needed.
