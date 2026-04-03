import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Company, CompanyFinancial } from '@/lib/mock-data';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TrendingUp, TrendingDown, Minus, Building2, FileText, BarChart3, Banknote, Info } from 'lucide-react';

function fmt(val: number | null | undefined, suffix = ''): string {
    if (val === null || val === undefined) return '—';
    if (Math.abs(val) >= 1) return val.toLocaleString('en-IN', { maximumFractionDigits: 2 }) + suffix;
    return val.toString() + suffix;
}

function colorClass(val: number | null | undefined): string {
    if (val === null || val === undefined) return 'text-slate-600';
    if (val > 0) return 'text-green-700';
    if (val < 0) return 'text-red-600';
    return 'text-slate-600';
}

function FundamentalsGrid({ company }: { company: Company }) {
    const items = [
        { label: 'Market Cap', value: company.marketCap ? `₹${fmt(company.marketCap)} Cr` : '—' },
        { label: 'P/E Ratio', value: company.peRatio ? fmt(company.peRatio) : 'N/A' },
        { label: 'P/B Ratio', value: company.pbRatio ? fmt(company.pbRatio) : 'N/A' },
        { label: 'ROE', value: company.roe != null ? fmt(company.roe, '%') : 'N/A' },
        { label: 'Debt/Equity', value: company.debtToEquity != null ? fmt(company.debtToEquity) : 'N/A' },
        { label: 'Book Value', value: company.bookValue != null ? `₹${fmt(company.bookValue)}` : 'N/A' },
        { label: 'Face Value', value: company.faceValue ? `₹${fmt(company.faceValue)}` : '—' },
        { label: '52W High', value: company.week52High ? `₹${fmt(company.week52High)}` : '—' },
        { label: '52W Low', value: company.week52Low ? `₹${fmt(company.week52Low)}` : '—' },
        { label: 'Lot Size', value: company.lotSize ? `${company.lotSize} Shares` : '—' },
        { label: 'Total Shares', value: company.totalShares ? company.totalShares.toLocaleString('en-IN') : '—' },
        { label: 'ISIN', value: company.isin || '—' },
    ];

    const detailItems = [
        { label: 'Depository', value: company.depository || '—' },
        { label: 'RTA', value: company.rta || '—' },
        { label: 'CIN', value: company.cin || '—' },
        { label: 'PAN', value: company.panNumber || '—' },
    ].filter(i => i.value !== '—');

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map(item => (
                    <div key={item.label} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{item.label}</div>
                        <div className="text-sm font-semibold text-slate-800 mt-0.5">{item.value}</div>
                    </div>
                ))}
            </div>
            {detailItems.length > 0 && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    {detailItems.map(item => (
                        <span key={item.label}><span className="font-medium text-slate-600">{item.label}:</span> {item.value}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

function FinancialTable({ financials, rows }: { financials: CompanyFinancial[], rows: { label: string; key: keyof CompanyFinancial; bold?: boolean; suffix?: string }[] }) {
    if (financials.length === 0) return <p className="text-sm text-slate-500">No financial data available.</p>;

    const visibleRows = rows.filter(row =>
        financials.some(f => f[row.key] !== null && f[row.key] !== undefined)
    );

    if (visibleRows.length === 0) return <p className="text-sm text-slate-500">No data available for this section.</p>;

    return (
        <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-white min-w-[140px]">Metric</th>
                        {financials.map(f => (
                            <th key={f.fiscalYear} className="text-right py-2.5 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[90px]">{f.fiscalYear}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {visibleRows.map((row, idx) => (
                        <tr key={row.key as string} className={`border-b border-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/30 transition-colors`}>
                            <td className={`py-2 px-2 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} ${row.bold ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{row.label}</td>
                            {financials.map(f => {
                                const val = f[row.key] as number | null | undefined;
                                return (
                                    <td key={f.fiscalYear} className={`py-2 px-2 text-right tabular-nums ${row.bold ? 'font-semibold' : 'font-medium'} ${colorClass(val)}`}>
                                        {fmt(val, row.suffix || '')}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const incomeStatementRows: { label: string; key: keyof CompanyFinancial; bold?: boolean; suffix?: string }[] = [
    { label: 'Revenue', key: 'revenue', bold: true },
    { label: 'Cost of Material', key: 'costOfMaterial' },
    { label: 'Change in Inventory', key: 'changeInInventory' },
    { label: 'Gross Margins', key: 'grossMargins', suffix: '%' },
    { label: 'Employee Expenses', key: 'employeeExpenses' },
    { label: 'Other Expenses', key: 'otherExpenses' },
    { label: 'EBITDA', key: 'ebitda', bold: true },
    { label: 'OPM', key: 'opm', suffix: '%' },
    { label: 'Other Income', key: 'otherIncome' },
    { label: 'Finance Cost', key: 'financeCost' },
    { label: 'Depreciation & Amortization', key: 'depreciation' },
    { label: 'EBIT', key: 'ebit', bold: true },
    { label: 'EBIT Margins', key: 'ebitMargins', suffix: '%' },
    { label: 'PBT', key: 'pbt', bold: true },
    { label: 'PBT Margins', key: 'pbtMargins', suffix: '%' },
    { label: 'Tax', key: 'tax' },
    { label: 'PAT', key: 'pat', bold: true },
    { label: 'NPM', key: 'npm', suffix: '%' },
    { label: 'EPS (₹)', key: 'eps' },
];

const balanceSheetRows: { label: string; key: keyof CompanyFinancial; bold?: boolean; suffix?: string }[] = [
    { label: 'Fixed Assets', key: 'fixedAssets' },
    { label: 'CWIP', key: 'cwip' },
    { label: 'Investments', key: 'investments' },
    { label: 'Trade Receivables', key: 'tradeReceivables' },
    { label: 'Inventory', key: 'inventory' },
    { label: 'Other Assets', key: 'otherAssets' },
    { label: 'Total Assets', key: 'totalAssets', bold: true },
    { label: 'Share Capital', key: 'shareCapital' },
    { label: 'Reserves', key: 'reserves' },
    { label: 'Borrowings', key: 'borrowings' },
    { label: 'Trade Payables', key: 'tradePayables' },
    { label: 'Other Liabilities', key: 'otherLiabilities' },
    { label: 'Total Liabilities', key: 'totalLiabilities', bold: true },
];

const cashFlowRows: { label: string; key: keyof CompanyFinancial; bold?: boolean; suffix?: string }[] = [
    { label: 'PBT', key: 'pbtCashflow' },
    { label: 'Working Capital Change', key: 'workingCapitalChange' },
    { label: 'Cash from Operations', key: 'cashFromOperations', bold: true },
    { label: 'Purchase of PPE', key: 'purchaseOfPpe' },
    { label: 'Cash from Investment', key: 'cashFromInvestment', bold: true },
];

export default function CompanyDetails({ company, financials }: { company: Company; financials: CompanyFinancial[] }) {
    const [activeTab, setActiveTab] = useState('fundamentals');

    const companyFinancials = financials.filter(f => f.companyId === company.id);
    const hasFinancials = companyFinancials.length > 0;

    let parsedContent: any = null;
    try {
        if (company.aiContext) {
            parsedContent = JSON.parse(company.aiContext);
        }
    } catch {
        parsedContent = { overview: company.aiContext || company.description };
    }
    if (!parsedContent) {
        parsedContent = { overview: company.description };
    }

    const hasFundamentals = company.marketCap || company.peRatio || company.roe || company.bookValue;

    const tabs = [
        ...(hasFundamentals ? [{ id: 'fundamentals', label: 'Fundamentals', icon: Building2 }] : []),
        ...(hasFinancials ? [
            { id: 'income', label: 'P&L Statement', icon: FileText },
            { id: 'balance', label: 'Balance Sheet', icon: BarChart3 },
            { id: 'cashflow', label: 'Cash Flow', icon: Banknote },
        ] : []),
        ...(parsedContent.overview ? [{ id: 'overview', label: 'Overview', icon: Info }] : []),
    ];

    if (tabs.length === 0) return null;

    if (!tabs.find(t => t.id === activeTab)) {
        setActiveTab(tabs[0].id);
    }

    return (
        <div className="mt-8">
            <div className="flex gap-1 overflow-x-auto border-b border-slate-200 mb-6 no-scrollbar">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="animate-in fade-in duration-300">
                {activeTab === 'fundamentals' && hasFundamentals && (
                    <Card>
                        <CardContent className="pt-6">
                            <FundamentalsGrid company={company} />
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'income' && hasFinancials && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-slate-700">Income Statement (P&L) — ₹ Crore</h3>
                                <PatTrendBadge financials={companyFinancials} />
                            </div>
                            <FinancialTable financials={companyFinancials} rows={incomeStatementRows} />
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'balance' && hasFinancials && (
                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4">Balance Sheet — ₹ Crore</h3>
                            <FinancialTable financials={companyFinancials} rows={balanceSheetRows} />
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'cashflow' && hasFinancials && (
                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4">Cash Flow Statement — ₹ Crore</h3>
                            <FinancialTable financials={companyFinancials} rows={cashFlowRows} />
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'overview' && parsedContent.overview && (
                    <Card>
                        <CardContent className="pt-6 prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-blue-600">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {parsedContent.overview}
                            </ReactMarkdown>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function PatTrendBadge({ financials }: { financials: CompanyFinancial[] }) {
    if (financials.length < 2) return null;
    const latest = financials[financials.length - 1]?.pat;
    const prev = financials[financials.length - 2]?.pat;
    if (latest == null || prev == null) return null;

    const isUp = latest > prev;
    const isDown = latest < prev;
    const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
    const color = isUp ? 'text-green-600 bg-green-50' : isDown ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50';

    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${color}`}>
            <Icon className="h-3 w-3" />
            PAT {isUp ? 'Growing' : isDown ? 'Declining' : 'Flat'}
        </span>
    );
}
