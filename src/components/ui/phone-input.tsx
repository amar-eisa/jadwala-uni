import * as React from 'react';
import { cn } from '@/lib/utils';
import { Phone, ChevronDown } from 'lucide-react';

const countries = [
  { name: 'السودان', code: '+249', flag: '🇸🇩' },
  { name: 'السعودية', code: '+966', flag: '🇸🇦' },
  { name: 'مصر', code: '+20', flag: '🇪🇬' },
  { name: 'الإمارات', code: '+971', flag: '🇦🇪' },
  { name: 'الكويت', code: '+965', flag: '🇰🇼' },
  { name: 'قطر', code: '+974', flag: '🇶🇦' },
  { name: 'البحرين', code: '+973', flag: '🇧🇭' },
  { name: 'عمان', code: '+968', flag: '🇴🇲' },
  { name: 'الأردن', code: '+962', flag: '🇯🇴' },
  { name: 'العراق', code: '+964', flag: '🇮🇶' },
  { name: 'ليبيا', code: '+218', flag: '🇱🇾' },
  { name: 'تونس', code: '+216', flag: '🇹🇳' },
  { name: 'المغرب', code: '+212', flag: '🇲🇦' },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  disabled?: boolean;
  id?: string;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, disabled, id }, ref) => {
    const [open, setOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Parse value into code + number
    const parsed = React.useMemo(() => {
      for (const c of countries) {
        if (value.startsWith(c.code)) {
          return { code: c.code, number: value.slice(c.code.length) };
        }
      }
      return { code: '+249', number: value.replace(/^\+\d*/, '') };
    }, [value]);

    const selectedCountry = countries.find(c => c.code === parsed.code) || countries[0];

    const handleCodeChange = (code: string) => {
      onChange(code + parsed.number);
      setOpen(false);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = e.target.value.replace(/\D/g, '');
      onChange(parsed.code + num);
    };

    // Close dropdown on outside click
    React.useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
      <div className="relative group" ref={dropdownRef}>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary z-10">
          <Phone className="h-4 w-4" />
        </div>
        <div className={cn(
          "flex h-13 rounded-2xl border border-input bg-background/80 backdrop-blur-sm overflow-hidden",
          "ring-offset-background transition-all duration-200",
          "focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-0 focus-within:border-primary",
          "hover:border-primary/50",
          disabled && "cursor-not-allowed opacity-50"
        )}>
          {/* Country code selector - on the left side (visually right in RTL) */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 px-3 border-l border-input bg-muted/30 hover:bg-muted/50 transition-colors shrink-0"
          >
            <span className="text-base">{selectedCountry.flag}</span>
            <span className="text-xs font-medium text-foreground" dir="ltr">{selectedCountry.code}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {/* Number input */}
          <input
            ref={ref}
            id={id}
            type="tel"
            dir="ltr"
            placeholder="رقم الهاتف"
            value={parsed.number}
            onChange={handleNumberChange}
            disabled={disabled}
            className="flex-1 bg-transparent px-4 pr-10 pt-1 text-base outline-none placeholder:text-muted-foreground text-right"
          />
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {countries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCodeChange(c.code)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors",
                  c.code === parsed.code && "bg-accent/50 font-medium"
                )}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 text-right">{c.name}</span>
                <span className="text-muted-foreground text-xs" dir="ltr">{c.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
