import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const themeConfig = {
  system: { icon: Monitor, label: 'وضع النظام', next: 'light' },
  light: { icon: Sun, label: 'الوضع الفاتح', next: 'dark' },
  dark: { icon: Moon, label: 'الوضع الداكن', next: 'system' },
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = themeConfig[theme as keyof typeof themeConfig] || themeConfig.system;
  const Icon = current.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={() => setTheme(current.next)}
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">{current.label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{current.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
