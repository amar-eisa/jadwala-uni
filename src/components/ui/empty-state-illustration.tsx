import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateIllustrationProps {
  type: 'rooms' | 'professors' | 'groups' | 'subjects' | 'timeSlots' | 'schedule';
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

function RoomsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
      {/* Building */}
      <rect x="25" y="35" width="70" height="55" rx="4" className="fill-muted stroke-muted-foreground/20" strokeWidth="1.5" />
      {/* Roof */}
      <path d="M20 38L60 15L100 38" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Door */}
      <rect x="50" y="62" width="20" height="28" rx="3" className="fill-primary/15 stroke-primary/40" strokeWidth="1.5" />
      <circle cx="66" cy="78" r="1.5" className="fill-primary/60" />
      {/* Windows */}
      <rect x="32" y="45" width="14" height="12" rx="2" className="fill-primary/10 stroke-primary/30" strokeWidth="1" />
      <rect x="74" y="45" width="14" height="12" rx="2" className="fill-primary/10 stroke-primary/30" strokeWidth="1" />
      <rect x="32" y="65" width="14" height="12" rx="2" className="fill-primary/10 stroke-primary/30" strokeWidth="1" />
      <rect x="74" y="65" width="14" height="12" rx="2" className="fill-primary/10 stroke-primary/30" strokeWidth="1" />
      {/* Window cross lines */}
      <line x1="39" y1="45" x2="39" y2="57" className="stroke-primary/20" strokeWidth="0.5" />
      <line x1="32" y1="51" x2="46" y2="51" className="stroke-primary/20" strokeWidth="0.5" />
      <line x1="81" y1="45" x2="81" y2="57" className="stroke-primary/20" strokeWidth="0.5" />
      <line x1="74" y1="51" x2="88" y2="51" className="stroke-primary/20" strokeWidth="0.5" />
      {/* Ground */}
      <line x1="10" y1="90" x2="110" y2="90" className="stroke-muted-foreground/15" strokeWidth="1.5" strokeLinecap="round" />
      {/* Decorative dots */}
      <circle cx="18" cy="88" r="1" className="fill-primary/20" />
      <circle cx="102" cy="88" r="1" className="fill-primary/20" />
      {/* Flag */}
      <line x1="60" y1="8" x2="60" y2="15" className="stroke-primary/40" strokeWidth="1" />
      <path d="M60 8L70 11L60 14" className="fill-primary/20 stroke-primary/40" strokeWidth="0.5" />
    </svg>
  );
}

function ProfessorsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
      {/* Graduation cap */}
      <path d="M60 25L20 45L60 65L100 45L60 25Z" className="fill-success/15 stroke-success/50" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M60 65L60 80" className="stroke-success/40" strokeWidth="1.5" />
      <path d="M35 55L35 72C35 72 47 82 60 82C73 82 85 72 85 72L85 55" className="stroke-success/30" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Tassel */}
      <line x1="100" y1="45" x2="100" y2="62" className="stroke-primary" strokeWidth="1.5" />
      <circle cx="100" cy="64" r="2.5" className="fill-primary/60" />
      {/* Person silhouette */}
      <circle cx="60" cy="92" r="8" className="fill-success/10 stroke-success/30" strokeWidth="1" />
      <path d="M44 110C44 102 51 96 60 96C69 96 76 102 76 110" className="stroke-success/20" strokeWidth="1.5" fill="none" />
      {/* Decorative sparkles */}
      <circle cx="30" cy="35" r="1.5" className="fill-success/25" />
      <circle cx="90" cy="35" r="1" className="fill-success/20" />
      <circle cx="25" cy="75" r="1" className="fill-primary/30" />
    </svg>
  );
}

function GroupsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
      {/* Center person */}
      <circle cx="60" cy="45" r="10" className="fill-[hsl(262,60%,55%)]/10 stroke-[hsl(262,60%,55%)]/40" strokeWidth="1.5" />
      <path d="M45 72C45 62 51 55 60 55C69 55 75 62 75 72" className="stroke-[hsl(262,60%,55%)]/30" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Left person */}
      <circle cx="30" cy="55" r="8" className="fill-primary/8 stroke-primary/30" strokeWidth="1" />
      <path d="M18 78C18 70 23 65 30 65C37 65 42 70 42 78" className="stroke-primary/20" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Right person */}
      <circle cx="90" cy="55" r="8" className="fill-primary/8 stroke-primary/30" strokeWidth="1" />
      <path d="M78 78C78 70 83 65 90 65C97 65 102 70 102 78" className="stroke-primary/20" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Connection lines */}
      <path d="M42 50L50 47" className="stroke-[hsl(262,60%,55%)]/15" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M70 47L78 50" className="stroke-[hsl(262,60%,55%)]/15" strokeWidth="1" strokeDasharray="2 2" />
      {/* Base line */}
      <line x1="15" y1="95" x2="105" y2="95" className="stroke-muted-foreground/10" strokeWidth="1" strokeLinecap="round" />
      {/* Decorative */}
      <circle cx="60" cy="30" r="1.5" className="fill-[hsl(262,60%,55%)]/20" />
      <circle cx="15" cy="60" r="1" className="fill-primary/15" />
      <circle cx="105" cy="60" r="1" className="fill-primary/15" />
    </svg>
  );
}

function SubjectsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
      {/* Book stack */}
      <rect x="30" y="70" width="60" height="10" rx="2" className="fill-warning/15 stroke-warning/30" strokeWidth="1" />
      <rect x="33" y="58" width="54" height="10" rx="2" className="fill-info/15 stroke-info/30" strokeWidth="1" />
      <rect x="28" y="46" width="64" height="10" rx="2" className="fill-primary/15 stroke-primary/30" strokeWidth="1" />
      {/* Open book on top */}
      <path d="M40 44L60 36L80 44" className="stroke-warning/50" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M40 44L40 26L60 18L60 36" className="fill-warning/8 stroke-warning/30" strokeWidth="1" strokeLinejoin="round" />
      <path d="M80 44L80 26L60 18L60 36" className="fill-warning/12 stroke-warning/30" strokeWidth="1" strokeLinejoin="round" />
      {/* Text lines on book */}
      <line x1="46" y1="28" x2="56" y2="24" className="stroke-warning/20" strokeWidth="1" strokeLinecap="round" />
      <line x1="46" y1="32" x2="54" y2="29" className="stroke-warning/15" strokeWidth="1" strokeLinecap="round" />
      <line x1="64" y1="24" x2="74" y2="28" className="stroke-warning/20" strokeWidth="1" strokeLinecap="round" />
      <line x1="64" y1="29" x2="72" y2="32" className="stroke-warning/15" strokeWidth="1" strokeLinecap="round" />
      {/* Pencil */}
      <line x1="88" y1="35" x2="95" y2="80" className="stroke-info/40" strokeWidth="2" strokeLinecap="round" />
      <path d="M95 80L96 85L93 82Z" className="fill-info/50" />
      {/* Ground */}
      <line x1="20" y1="82" x2="100" y2="82" className="stroke-muted-foreground/10" strokeWidth="1" strokeLinecap="round" />
      {/* Sparkle */}
      <circle cx="22" cy="30" r="1.5" className="fill-warning/25" />
      <circle cx="98" cy="22" r="1" className="fill-info/25" />
    </svg>
  );
}

function TimeSlotsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
      {/* Clock face */}
      <circle cx="60" cy="55" r="35" className="fill-[hsl(340,70%,50%)]/5 stroke-[hsl(340,70%,50%)]/25" strokeWidth="1.5" />
      <circle cx="60" cy="55" r="30" className="stroke-[hsl(340,70%,50%)]/10" strokeWidth="0.5" />
      {/* Hour markers */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 60 + 26 * Math.sin(rad);
        const y1 = 55 - 26 * Math.cos(rad);
        const x2 = 60 + 30 * Math.sin(rad);
        const y2 = 55 - 30 * Math.cos(rad);
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-[hsl(340,70%,50%)]/30" strokeWidth="1.5" strokeLinecap="round" />;
      })}
      {/* Hour hand */}
      <line x1="60" y1="55" x2="60" y2="35" className="stroke-[hsl(340,70%,50%)]/50" strokeWidth="2.5" strokeLinecap="round" />
      {/* Minute hand */}
      <line x1="60" y1="55" x2="78" y2="48" className="stroke-[hsl(340,70%,50%)]/35" strokeWidth="1.5" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="60" cy="55" r="3" className="fill-[hsl(340,70%,50%)]/30" />
      <circle cx="60" cy="55" r="1.5" className="fill-[hsl(340,70%,50%)]/60" />
      {/* Decorative time blocks */}
      <rect x="15" y="92" width="18" height="6" rx="2" className="fill-primary/10 stroke-primary/20" strokeWidth="0.5" />
      <rect x="37" y="92" width="18" height="6" rx="2" className="fill-success/10 stroke-success/20" strokeWidth="0.5" />
      <rect x="59" y="92" width="18" height="6" rx="2" className="fill-warning/10 stroke-warning/20" strokeWidth="0.5" />
      <rect x="81" y="92" width="18" height="6" rx="2" className="fill-[hsl(340,70%,50%)]/10 stroke-[hsl(340,70%,50%)]/20" strokeWidth="0.5" />
      {/* Sparkle */}
      <circle cx="95" cy="25" r="1.5" className="fill-[hsl(340,70%,50%)]/20" />
      <circle cx="25" cy="30" r="1" className="fill-primary/25" />
    </svg>
  );
}

function ScheduleIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
      {/* Calendar body */}
      <rect x="20" y="30" width="80" height="65" rx="6" className="fill-muted/50 stroke-muted-foreground/20" strokeWidth="1.5" />
      {/* Calendar header */}
      <rect x="20" y="30" width="80" height="16" rx="6" className="fill-primary/15" />
      <rect x="20" y="40" width="80" height="6" className="fill-primary/15" />
      {/* Calendar rings */}
      <rect x="38" y="25" width="4" height="12" rx="2" className="fill-primary/30" />
      <rect x="58" y="25" width="4" height="12" rx="2" className="fill-primary/30" />
      <rect x="78" y="25" width="4" height="12" rx="2" className="fill-primary/30" />
      {/* Grid cells */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={25 + col * 15}
            y={50 + row * 10}
            width="12"
            height="7"
            rx="1.5"
            className={cn(
              (row === 1 && col === 2) ? "fill-primary/20 stroke-primary/30" :
              (row === 2 && col === 4) ? "fill-success/15 stroke-success/25" :
              (row === 0 && col === 1) ? "fill-warning/15 stroke-warning/25" :
              "fill-muted/30 stroke-muted-foreground/8"
            )}
            strokeWidth="0.5"
          />
        ))
      )}
      {/* Decorative sparkle */}
      <circle cx="105" cy="35" r="2" className="fill-primary/25" />
      <circle cx="12" cy="60" r="1.5" className="fill-primary/15" />
    </svg>
  );
}

const illustrationMap = {
  rooms: RoomsIllustration,
  professors: ProfessorsIllustration,
  groups: GroupsIllustration,
  subjects: SubjectsIllustration,
  timeSlots: TimeSlotsIllustration,
  schedule: ScheduleIllustration,
};

export function EmptyStateIllustration({ type, title, description, action, className }: EmptyStateIllustrationProps) {
  const Illustration = illustrationMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("py-12 px-6 text-center space-y-4", className)}
    >
      <motion.div
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
      >
        <Illustration />
      </motion.div>
      <div className="space-y-1.5">
        <p className="font-bold text-foreground text-lg">{title}</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </motion.div>
  );
}
