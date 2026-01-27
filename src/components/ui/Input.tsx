import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    error?: string;
    label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, leftIcon, rightIcon, error, label, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[var(--accent-primary)] transition-colors">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "input-premium w-full rounded-xl px-4 py-3 placeholder:text-gray-600 focus:placeholder:text-gray-500",
                            leftIcon && "pl-10",
                            rightIcon && "pr-10",
                            error && "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_1px_rgba(239,68,68,1)]",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <motion.span
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 ml-1 font-medium"
                    >
                        {error}
                    </motion.span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
