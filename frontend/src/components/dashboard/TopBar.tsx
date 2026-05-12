'use client';

import { useEffect, useState } from 'react';
import { Bell, Search, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { user } = useAuthStore();
  const profile = user?.profile;
  const router = useRouter();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const initials = profile ? getInitials(profile.firstName, profile.lastName) : 'U';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/dashboard/achievements?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-64">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search achievements..."
          className="bg-transparent text-sm outline-none placeholder:text-muted-foreground flex-1"
        />
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link href="/dashboard/profile">
          <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-transparent hover:ring-indigo-400 transition-all">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
