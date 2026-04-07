import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';

export function Topbar() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  if (!user) return null;

  return (
    <header className="fixed left-60 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Left: could be breadcrumbs */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-fixflow-muted">
          Welcome back, <span className="font-medium text-foreground">{user.name}</span>
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-fixflow-primary text-white text-xs uppercase">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-fixflow-muted capitalize">{user.role}</p>
              </div>
              <ChevronDown className="h-3 w-3 text-fixflow-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
