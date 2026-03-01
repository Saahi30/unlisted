import React from 'react';

const companies = [
    'Swiggy', 'NSDL', 'HDB Financial', 'Boat Lifestyle', 'Ola Electric',
    'PhonePe', 'Groww', 'Zepto', 'Meesho', 'Pine Labs',
    'IndiaMart', 'Nykaa Fashion', 'BYJU\'S', 'Razorpay', 'Lenskart',
];

export default function MarqueeSection() {
    const doubled = [...companies, ...companies];
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
