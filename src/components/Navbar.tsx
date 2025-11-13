import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, LogOut, Plus, Search, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import SearchBar, { SearchParams } from './SearchBar';

interface NavbarProps {
  onSearchResults?: (events: unknown[], params: SearchParams) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearchResults }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [logoFallback, setLogoFallback] = useState(false);

  const dashboardPath = useMemo(() => {
    switch (user?.role) {
      case 'organizer':
        return '/dashboard';
      case 'admin':
        return '/admin-dashboard';
      case 'superadmin':
        return '/superadmin/requests';
      default:
        return '/user-dashboard';
    }
  }, [user?.role]);

  const getUserLabel = () => {
    if (!user?.role) return 'Account';
    return `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)} Account`;
  };

  const renderLogo = () => {
    if (logoFallback) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-semibold text-primary shadow-sm">
          V
        </div>
      );
    }

    return (
      <img
        src="/logo192.png"
        alt="Vibio"
        className="h-10 w-10 rounded-full object-cover"
        onError={() => setLogoFallback(true)}
      />
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          {renderLogo()}
          <span className="text-xl font-semibold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
            Vibio Events
          </span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar
            variant="inline"
            className="mx-8 max-w-xl"
            onResults={onSearchResults}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate('/') }>
            <Search className="h-4 w-4" />
          </Button>

          {user && (
            <Button
              variant="secondary"
              size="sm"
              className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 sm:inline-flex"
              onClick={() => navigate(dashboardPath)}
            >
              <Calendar className="h-4 w-4" />
              Dashboard
            </Button>
          )}

          {user?.role === 'organizer' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hidden items-center gap-2 border-primary/30 text-primary hover:bg-primary/10 sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-white">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'V'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end">
              <div className="flex flex-col gap-1 p-3">
                <p className="font-medium">{user?.email || 'Guest'}</p>
                <p className="text-sm text-muted-foreground">{getUserLabel()}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/bookings')} className="cursor-pointer">
                <Calendar className="mr-2 h-4 w-4" />
                My Bookings
              </DropdownMenuItem>
              {user?.role === 'organizer' && (
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Organizer Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
