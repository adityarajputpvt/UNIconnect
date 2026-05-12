'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Trophy, CheckSquare, Sparkles,
  Users, BarChart3, Settings, LogOut, Globe,
  Bell, User, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

const studentNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
  { label: 'Aura AI', href: '/dashboard/aura', icon: Sparkles },
  { label: 'Community', href: '/dashboard/community', icon: Users },
  { label: 'Portfolio', href: '/dashboard/portfolio', icon: Globe },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
];

const facultyNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Verify', href: '/dashboard/verify', icon: CheckSquare },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
];

const adminNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Verify', href: '/dashboard/verify', icon: CheckSquare },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Admin Panel', href: '/dashboard/admin', icon: Shield },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navItems =
    user?.role === 'SUPER_ADMIN' || user?.role === 'DEPARTMENT_ADMIN'
      ? adminNav
      : user?.role === 'FACULTY'
      ? facultyNav
      : studentNav;

  const profile = user?.profile;
  const initials = profile ? getInitials(profile.firstName, profile.lastName) : 'U';

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0 overflow-y-auto scrollbar-thin">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base gradient-text-brand">Uni-Connect</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className={cn('w-4 h-4', isActive ? 'text-indigo-500' : '')} />
                {item.label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-border space-y-1">
        <Link href="/dashboard/settings">
          <motion.div
            whileHover={{ x: 2 }}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === '/dashboard/settings'
                ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Settings className={cn('w-4 h-4', pathname === '/dashboard/settings' ? 'text-indigo-500' : '')} />
            Settings
          </motion.div>
        </Link>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-muted/50 mt-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile ? `${profile.firstName} ${profile.lastName}` : 'User'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
          </div>
          <button
            onClick={() => logout()}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
