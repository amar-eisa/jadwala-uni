import * as React from 'react';
import { cn } from '@/lib/utils';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, icon, id, value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== '';
    
    return (
      <div className="relative group">
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary z-10">
            {icon}
          </div>
        )}
        <input
          id={id}
          ref={ref}
          value={value}
          placeholder=" "
          className={cn(
            "peer w-full h-13 rounded-2xl border border-input bg-background/80 backdrop-blur-sm px-4 pt-5 pb-2 text-base",
            "ring-offset-background transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "hover:border-primary/50",
            icon && "pr-10",
            className
          )}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            "absolute text-muted-foreground transition-all duration-200 pointer-events-none",
            icon ? "right-10" : "right-4",
            // Float up when focused or has value
            hasValue || false
              ? "top-2 text-xs text-primary font-medium"
              : "top-1/2 -translate-y-1/2 text-sm",
            "peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-focus:font-medium peer-focus:translate-y-0",
            "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-primary peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:translate-y-0"
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';

export { FloatingInput };
