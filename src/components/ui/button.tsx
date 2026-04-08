import * as React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"

        // Basic variants (could use class-variance-authority, but keeping it simple for MVP)
        const baseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

        const variants = {
            default: "bg-cta text-white hover:bg-cta-hover shadow",
            destructive: "bg-red-500 text-white shadow-sm hover:bg-red-500/90",
            outline: "border border-border bg-transparent shadow-sm hover:bg-surface hover:border-border-strong text-foreground",
            secondary: "bg-surface text-foreground shadow-sm hover:bg-surface/80",
            ghost: "hover:bg-surface hover:text-foreground text-foreground-secondary",
            link: "text-accent underline-offset-4 hover:underline",
        };

        const sizes = {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-10 rounded-md px-8",
            icon: "h-9 w-9",
        };

        return (
            <Comp
                className={cn(baseClass, variants[variant], sizes[size], className)}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button };
