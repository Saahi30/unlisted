'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/utils/supabase/client';

interface FeedbackDialogProps {
    orderId: string;
    userId: string;
    companyName: string;
    onClose: () => void;
    onSubmitted: () => void;
}

export default function FeedbackDialog({ orderId, userId, companyName, onClose, onSubmitted }: FeedbackDialogProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setSubmitting(true);

        const supabase = createClient();
        await supabase.from('feedback').insert({
            user_id: userId,
            order_id: orderId,
            rating,
            comment: comment.trim() || null,
            type: 'transaction',
        });

        setSubmitting(false);
        onSubmitted();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <h3 className="font-display text-lg font-medium text-foreground">Rate Your Experience</h3>
                    <button onClick={onClose} className="text-muted hover:text-foreground p-1.5 rounded-lg transition-colors">
                        <Icon name="XMarkIcon" size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-muted mb-6">
                        How was your transaction experience for <span className="font-semibold text-foreground">{companyName}</span>?
                    </p>

                    {/* Star rating */}
                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110"
                            >
                                <Icon
                                    name="StarIcon"
                                    size={36}
                                    variant={(hoveredRating || rating) >= star ? 'solid' : 'outline'}
                                    className={(hoveredRating || rating) >= star ? 'text-amber-400' : 'text-border'}
                                />
                            </button>
                        ))}
                    </div>

                    {rating > 0 && (
                        <p className="text-center text-sm font-medium mb-4 text-foreground">
                            {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
                        </p>
                    )}

                    {/* Comment */}
                    <div>
                        <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Comments (optional)</label>
                        <textarea
                            className="w-full h-20 p-3 text-sm border border-border rounded-lg bg-surface/30 focus:ring-1 focus:ring-primary outline-none resize-none"
                            placeholder="Tell us about your experience..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        className="bg-primary hover:bg-primary/90 text-white"
                        onClick={handleSubmit}
                        disabled={rating === 0 || submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Rating'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
