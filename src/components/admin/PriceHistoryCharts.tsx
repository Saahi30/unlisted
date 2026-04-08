'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PriceHistoryCharts() {
    const { companies, historicalPrices, addHistoricalPrice, removeHistoricalPrice } = useAppStore();
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [newEntry, setNewEntry] = useState({ date: new Date().toISOString().split('T')[0], value: 0 });
    const [showAddForm, setShowAddForm] = useState(false);
    const [showFillingDatePicker, setShowFillingDatePicker] = useState(false);
    const [fillingDate, setFillingDate] = useState(new Date().toISOString().split('T')[0]);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);

    const companyPrices = useMemo(() =>
        historicalPrices
            .filter(p => p.companyId === selectedCompanyId)
            .sort((a, b) => a.priceDate.localeCompare(b.priceDate)),
        [historicalPrices, selectedCompanyId]
    );

    const maxPrice = Math.max(...companyPrices.map(p => p.priceValue), 1);
    const minPrice = Math.min(...companyPrices.map(p => p.priceValue), 0);
    const priceRange = maxPrice - minPrice || 1;

    const priceChange = companyPrices.length >= 2
        ? ((companyPrices[companyPrices.length - 1].priceValue - companyPrices[0].priceValue) / companyPrices[0].priceValue * 100).toFixed(1)
        : '0';

    const handleAddPrice = async () => {
        if (!newEntry.date || newEntry.value <= 0) return;
        await addHistoricalPrice(selectedCompanyId, newEntry.date, newEntry.value);
        setNewEntry({ date: new Date().toISOString().split('T')[0], value: 0 });
        setShowAddForm(false);
    };

    const handleRemovePrice = async (id: string) => {
        if (confirm('Remove this price entry?')) {
            await removeHistoricalPrice(id);
        }
    };

    // Company stats summary
    const companyStats = useMemo(() =>
        companies.map(c => {
            const prices = historicalPrices.filter(p => p.companyId === c.id).sort((a, b) => a.priceDate.localeCompare(b.priceDate));
            const latest = prices[prices.length - 1]?.priceValue || c.currentAskPrice;
            const first = prices[0]?.priceValue || c.currentAskPrice;
            const change = first > 0 ? ((latest - first) / first * 100).toFixed(1) : '0';
            return { id: c.id, name: c.name, sector: c.sector, latest, change: Number(change), dataPoints: prices.length };
        }).sort((a, b) => b.dataPoints - a.dataPoints),
        [companies, historicalPrices]
    );

    // Upload new price sheet
    const handleUploadSheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadStatus('Processing...');

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

            let imported = 0;
            for (const row of rows) {
                const companyName = String(row['Company Name'] || '').trim();
                const date = String(row['date'] || '').trim();
                const buyPrice = Number(row['buy price'] || 0);
                const sellPrice = Number(row['sell price'] || 0);

                if (!companyName || !date) continue;

                const company = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
                if (!company) continue;

                // Add buy price as historical price entry
                if (buyPrice > 0) {
                    await addHistoricalPrice(company.id, date, buyPrice);
                    imported++;
                }
            }

            setUploadStatus(`Imported ${imported} price entries.`);
            setTimeout(() => setUploadStatus(null), 3000);
        } catch {
            setUploadStatus('Error reading file. Please check the format.');
            setTimeout(() => setUploadStatus(null), 3000);
        }

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Download filling sheet (company names + date filled, buy/sell empty)
    const handleDownloadFillingSheet = () => {
        const rows = companies.map(c => ({
            'Company Name': c.name,
            'date': fillingDate,
            'buy price': '',
            'sell price': '',
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [{ wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Price Sheet');
        XLSX.writeFile(wb, `price_filling_sheet_${fillingDate}.xlsx`);
        setShowFillingDatePicker(false);
    };

    // Download current sheet with all prices
    const handleDownloadCurrentSheet = (format: 'csv' | 'excel' | 'pdf') => {
        // Build rows: each company with its latest price data
        const rows = companies.map(c => {
            const prices = historicalPrices
                .filter(p => p.companyId === c.id)
                .sort((a, b) => b.priceDate.localeCompare(a.priceDate));
            const latestDate = prices[0]?.priceDate || '-';
            return {
                'Company Name': c.name,
                'date': latestDate,
                'buy price': c.currentBidPrice,
                'sell price': c.currentAskPrice,
            };
        });

        if (format === 'csv') {
            const ws = XLSX.utils.json_to_sheet(rows);
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `current_prices_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [{ wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Current Prices');
            XLSX.writeFile(wb, `current_prices_${new Date().toISOString().split('T')[0]}.xlsx`);
        } else if (format === 'pdf') {
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text('Current Company Prices', 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

            autoTable(doc, {
                startY: 35,
                head: [['Company Name', 'Date', 'Buy Price', 'Sell Price']],
                body: rows.map(r => [r['Company Name'], r['date'], `₹${r['buy price']}`, `₹${r['sell price']}`]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [99, 102, 241] },
            });

            doc.save(`current_prices_${new Date().toISOString().split('T')[0]}.pdf`);
        }

        setShowDownloadOptions(false);
    };

    return (
        <div className="space-y-6">
            {/* Sheet Management Buttons */}
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white py-3 px-4">
                    <CardTitle className="font-display font-medium text-sm">Price Sheet Management</CardTitle>
                    <CardDescription className="text-xs">Upload new price data, download filling sheets, or export current prices.</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3 items-start">
                        {/* Upload New Sheet */}
                        <div className="relative">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleUploadSheet}
                            />
                            <Button
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-1.5"
                            >
                                <Icon name="ArrowUpTrayIcon" size={14} />
                                Upload New Sheet
                            </Button>
                            {uploadStatus && (
                                <span className="ml-2 text-xs text-muted">{uploadStatus}</span>
                            )}
                        </div>

                        {/* Download Filling Sheet */}
                        <div className="relative">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setShowFillingDatePicker(!showFillingDatePicker); setShowDownloadOptions(false); }}
                                className="gap-1.5"
                            >
                                <Icon name="DocumentArrowDownIcon" size={14} />
                                Download Filling Sheet
                            </Button>
                            {showFillingDatePicker && (
                                <div className="absolute top-full left-0 mt-2 bg-white border border-border rounded-lg shadow-lg p-3 z-50 min-w-[220px]">
                                    <label className="text-xs font-semibold text-muted block mb-1.5">Select Date</label>
                                    <Input
                                        type="date"
                                        className="h-8 text-xs mb-2"
                                        value={fillingDate}
                                        onChange={e => setFillingDate(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" className="h-7 text-xs flex-1" onClick={handleDownloadFillingSheet}>
                                            Download
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowFillingDatePicker(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Download Current Sheet */}
                        <div className="relative">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setShowDownloadOptions(!showDownloadOptions); setShowFillingDatePicker(false); }}
                                className="gap-1.5"
                            >
                                <Icon name="ArrowDownTrayIcon" size={14} />
                                Download Current Sheet
                            </Button>
                            {showDownloadOptions && (
                                <div className="absolute top-full left-0 mt-2 bg-white border border-border rounded-lg shadow-lg p-2 z-50 min-w-[160px]">
                                    <p className="text-[10px] font-semibold text-muted px-2 pb-1.5 border-b border-border/50 mb-1">Choose format</p>
                                    <button
                                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-surface/50 rounded flex items-center gap-2"
                                        onClick={() => handleDownloadCurrentSheet('csv')}
                                    >
                                        <Icon name="DocumentTextIcon" size={14} className="text-green-600" />
                                        CSV (.csv)
                                    </button>
                                    <button
                                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-surface/50 rounded flex items-center gap-2"
                                        onClick={() => handleDownloadCurrentSheet('excel')}
                                    >
                                        <Icon name="TableCellsIcon" size={14} className="text-emerald-600" />
                                        Excel (.xlsx)
                                    </button>
                                    <button
                                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-surface/50 rounded flex items-center gap-2"
                                        onClick={() => handleDownloadCurrentSheet('pdf')}
                                    >
                                        <Icon name="DocumentIcon" size={14} className="text-red-600" />
                                        PDF (.pdf)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Company Selector */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b border-border/50 bg-white py-3 px-4">
                            <CardTitle className="font-display font-medium text-sm">Select Company</CardTitle>
                        </CardHeader>
                        <div className="p-3">
                            <div className="relative mb-3">
                                <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <Input placeholder="Search..." className="pl-9 h-8 text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="max-h-96 overflow-y-auto space-y-1">
                                {filteredCompanies.map(c => {
                                    const stats = companyStats.find(s => s.id === c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedCompanyId(c.id)}
                                            className={`w-full text-left p-2.5 rounded-lg text-xs transition-all ${selectedCompanyId === c.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-surface/50 border border-transparent'}`}
                                        >
                                            <div className="font-medium">{c.name}</div>
                                            <div className="flex justify-between text-[10px] text-muted mt-0.5">
                                                <span>{c.sector}</span>
                                                <span className={stats && stats.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {stats ? `${stats.change > 0 ? '+' : ''}${stats.change}%` : '-'}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Chart Area */}
                <div className="lg:col-span-3 space-y-4">
                    {selectedCompany && (
                        <>
                            {/* Header Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <Card className="border-border">
                                    <CardContent className="p-4">
                                        <div className="text-[10px] font-bold text-muted uppercase">Current Price</div>
                                        <div className="text-lg font-bold">₹{selectedCompany.currentAskPrice.toLocaleString()}</div>
                                    </CardContent>
                                </Card>
                                <Card className="border-border">
                                    <CardContent className="p-4">
                                        <div className="text-[10px] font-bold text-muted uppercase">Change</div>
                                        <div className={`text-lg font-bold ${Number(priceChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {Number(priceChange) > 0 ? '+' : ''}{priceChange}%
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-border">
                                    <CardContent className="p-4">
                                        <div className="text-[10px] font-bold text-muted uppercase">High</div>
                                        <div className="text-lg font-bold">₹{maxPrice.toLocaleString()}</div>
                                    </CardContent>
                                </Card>
                                <Card className="border-border">
                                    <CardContent className="p-4">
                                        <div className="text-[10px] font-bold text-muted uppercase">Data Points</div>
                                        <div className="text-lg font-bold">{companyPrices.length}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Chart */}
                            <Card className="border-border shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                                    <div>
                                        <CardTitle className="font-display font-medium text-lg">{selectedCompany.name} Price History</CardTitle>
                                        <CardDescription>{selectedCompany.sector}</CardDescription>
                                    </div>
                                    <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                                        <Icon name="PlusIcon" size={14} className="mr-1" /> Add Entry
                                    </Button>
                                </CardHeader>

                                {showAddForm && (
                                    <div className="p-4 border-b border-border bg-primary/5 flex gap-3 items-end">
                                        <div>
                                            <label className="text-xs font-bold text-muted block mb-1">Date</label>
                                            <Input type="date" className="h-8 text-xs w-40" value={newEntry.date} onChange={e => setNewEntry({ ...newEntry, date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-muted block mb-1">Price (INR)</label>
                                            <Input type="number" className="h-8 text-xs w-32" value={newEntry.value || ''} onChange={e => setNewEntry({ ...newEntry, value: Number(e.target.value) })} />
                                        </div>
                                        <Button size="sm" className="h-8" onClick={handleAddPrice}>Save</Button>
                                        <Button size="sm" variant="outline" className="h-8" onClick={() => setShowAddForm(false)}>Cancel</Button>
                                    </div>
                                )}

                                <CardContent className="p-6">
                                    {companyPrices.length === 0 ? (
                                        <div className="text-center py-12 text-muted">
                                            <Icon name="ChartBarIcon" size={32} className="mx-auto mb-2 text-muted/50" />
                                            <p className="italic">No historical price data available.</p>
                                            <p className="text-xs mt-1">Add price entries to see the chart.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* SVG Line Chart */}
                                            <div className="relative h-64 mb-4">
                                                <svg viewBox={`0 0 ${companyPrices.length * 50 + 20} 200`} className="w-full h-full" preserveAspectRatio="none">
                                                    {/* Grid lines */}
                                                    {[0, 25, 50, 75, 100].map(pct => (
                                                        <line key={pct} x1="0" y1={200 - pct * 2} x2={companyPrices.length * 50 + 20} y2={200 - pct * 2} stroke="#e5e7eb" strokeWidth="0.5" />
                                                    ))}
                                                    {/* Area fill */}
                                                    <path
                                                        d={`M 10 ${200 - ((companyPrices[0].priceValue - minPrice) / priceRange) * 180} ${companyPrices.map((p, i) => `L ${i * 50 + 10} ${200 - ((p.priceValue - minPrice) / priceRange) * 180}`).join(' ')} L ${(companyPrices.length - 1) * 50 + 10} 200 L 10 200 Z`}
                                                        fill="url(#gradient)"
                                                        opacity="0.15"
                                                    />
                                                    <defs>
                                                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="var(--primary, #6366f1)" />
                                                            <stop offset="100%" stopColor="transparent" />
                                                        </linearGradient>
                                                    </defs>
                                                    {/* Line */}
                                                    <polyline
                                                        points={companyPrices.map((p, i) => `${i * 50 + 10},${200 - ((p.priceValue - minPrice) / priceRange) * 180}`).join(' ')}
                                                        fill="none"
                                                        stroke="var(--primary, #6366f1)"
                                                        strokeWidth="2"
                                                        strokeLinejoin="round"
                                                    />
                                                    {/* Points */}
                                                    {companyPrices.map((p, i) => (
                                                        <circle key={p.id} cx={i * 50 + 10} cy={200 - ((p.priceValue - minPrice) / priceRange) * 180} r="3" fill="var(--primary, #6366f1)" />
                                                    ))}
                                                </svg>
                                            </div>

                                            {/* Data table */}
                                            <div className="border border-border rounded-lg overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-surface/50">
                                                            <th className="text-left p-2 pl-4 font-semibold text-muted">Date</th>
                                                            <th className="text-right p-2 font-semibold text-muted">Price</th>
                                                            <th className="text-right p-2 font-semibold text-muted">Change</th>
                                                            <th className="text-right p-2 pr-4 font-semibold text-muted">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/50">
                                                        {[...companyPrices].reverse().slice(0, 20).map((p, i, arr) => {
                                                            const prev = arr[i + 1];
                                                            const change = prev ? ((p.priceValue - prev.priceValue) / prev.priceValue * 100).toFixed(1) : '-';
                                                            return (
                                                                <tr key={p.id} className="hover:bg-surface/30">
                                                                    <td className="p-2 pl-4 font-mono">{p.priceDate}</td>
                                                                    <td className="p-2 text-right font-semibold">₹{p.priceValue.toLocaleString()}</td>
                                                                    <td className={`p-2 text-right font-medium ${change !== '-' && Number(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {change !== '-' ? `${Number(change) > 0 ? '+' : ''}${change}%` : '-'}
                                                                    </td>
                                                                    <td className="p-2 pr-4 text-right">
                                                                        <button className="text-red-500 hover:text-red-600 text-[10px] font-bold uppercase" onClick={() => handleRemovePrice(p.id)}>Remove</button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
