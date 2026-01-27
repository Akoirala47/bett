import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    gradient?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, children, gradient, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                    "glass-card rounded-2xl p-6",
                    gradient && "bg-gradient-to-br from-white/5 to-white/0",
                    className
                )}
                {...props as HTMLMotionProps<"div">}
            >
                {children}
            </motion.div>
        );
    }
);
Card.displayName = 'Card';
