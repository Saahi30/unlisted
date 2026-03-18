import React from 'react';
import { MOCK_COMPANIES } from '@/lib/mock-data';

const companyNames = MOCK_COMPANIES.map(c => c.name.split(' ')[0]); // Get first name for marquee

export default function MarqueeSection() {
    const doubled = [...companyNames, ...companyNames];
    return (
        <div className="w-full overflow-hidden border-y border-border bg-white py-4">
            <div className="flex whitespace-nowrap animate-marquee">
                {doubled?.map((name, i) => (
                    <div key={i} className="flex items-center gap-10 px-6">
                        <span className="text-sm font-display italic text-muted tracking-wide">{name}</span>
                        <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}
