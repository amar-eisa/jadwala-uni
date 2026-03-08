import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-border rounded-xl gap-2"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4 ml-1" />
          الوضع الفاتح
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 ml-1" />
          الوضع الداكن
        </>
      )}
    </Button>
  );
}
