'use client';

import React, { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface PricePoint {
    date: string;
    value: number;
}

interface CompanyPriceChartProps {
    data: PricePoint[];
    color?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-border shadow-lg rounded-xl">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="text-sm font-bold text-primary">₹{payload[0].value.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

export default function CompanyPriceChart({ data, color = '#E63946' }: CompanyPriceChartProps) {
    const [selectedSpan, setSelectedSpan] = useState('Max');

    if (!data || data.length === 0) {
        return (
            <div className="h-64 w-full flex items-center justify-center bg-surface/30 rounded-xl border border-dashed border-border">
                <p className="text-sm text-muted">No historical price data available yet.</p>
            </div>
        );
    }

    // Sort data by date
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [data]);

    // Filter data based on selectedSpan
    const filteredData = useMemo(() => {
        if (selectedSpan === 'Max' || sortedData.length === 0) return sortedData;

        // Determine min date based on span, compared to the latest date in the dataset
        const latestDate = new Date(sortedData[sortedData.length - 1].date);
        const minDate = new Date(latestDate);

        switch (selectedSpan) {
            case '1D':
                minDate.setDate(latestDate.getDate() - 1);
                break;
            case '1W':
                minDate.setDate(latestDate.getDate() - 7);
                break;
            case '1M':
                minDate.setMonth(latestDate.getMonth() - 1);
                break;
            case '3M':
                minDate.setMonth(latestDate.getMonth() - 3);
                break;
            case '6M':
                minDate.setMonth(latestDate.getMonth() - 6);
                break;
            case '1Y':
                minDate.setFullYear(latestDate.getFullYear() - 1);
                break;
            case '3Y':
                minDate.setFullYear(latestDate.getFullYear() - 3);
                break;
            case '5Y':
                minDate.setFullYear(latestDate.getFullYear() - 5);
                break;
        }

        const minTime = minDate.getTime();
        // Always include at least current point if filtered results in 0, 
        // but filtering properly will give us only points within the range
        let filtered = sortedData.filter(d => new Date(d.date).getTime() >= minTime);
        
        // If the span is so short we got nothing, fallback to at least the last data point
        if (filtered.length === 0) {
           filtered = [sortedData[sortedData.length - 1]];
        }
        
        // If we only have 1 data point, chart looks empty, let's duplicate it to form a flat line from minDate
        if (filtered.length === 1 && selectedSpan !== '1D') {
            const firstPoint = { ...filtered[0], date: minDate.toISOString() };
            filtered = [firstPoint, ...filtered];
        }

        return filtered;
    }, [sortedData, selectedSpan]);

    const spans = ['1D', '1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'Max'];

    return (
        <div className="w-full">
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={filteredData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.1} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis
                            dataKey="date"
                            hide
                            tickFormatter={(str) => new Date(str).toLocaleDateString()}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            domain={['dataMin', 'auto']}
                            tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            {/* Time Span Toggles Component */}
            <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t border-slate-100 justify-start">
                {spans.map(span => (
                    <button 
                        key={span}
                        onClick={() => setSelectedSpan(span)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                            selectedSpan === span 
                                ? 'text-white' 
                                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:border-slate-300'
                        }`}
                        style={selectedSpan === span ? { backgroundColor: color, borderColor: color } : {}}
                    >
                        {span}
                    </button>
                ))}
            </div>
        </div>
    );
}
