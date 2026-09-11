import React from 'react';
import { cn } from '../../lib/cn';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'danger';
}

export const Alert: React.FC<AlertProps> = ({ className, variant = 'default', ...props }) => {
  return (
    <div
      className={cn(
        'w-full rounded-md border px-3 py-2 text-sm',
        variant === 'danger'
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-border bg-muted text-foreground',
        className,
      )}
      {...props}
    />
  );
};
