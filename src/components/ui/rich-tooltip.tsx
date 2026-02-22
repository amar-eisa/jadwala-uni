import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RichTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom';
}

export function RichTooltip({ children, content, className, side = 'top' }: RichTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(true), 300);
  };

  const handleLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: side === 'top' ? 6 : -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === 'top' ? 6 : -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 min-w-[220px] max-w-[280px]",
              "rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl p-4 shadow-xl",
              side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
              "left-1/2 -translate-x-1/2",
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
