'use client';

import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trophy, Sparkles, Star, MessageCircle } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { Notification, NotificationType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatRelativeTime, cn } from '@/lib/utils';

const notificationIcons: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  ACHIEVEMENT_APPROVED: { icon: Trophy, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  ACHIEVEMENT_REJECTED: { icon: Trophy, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  VERIFICATION_UPDATE: { icon: CheckCheck, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  NEW_RECOMMENDATION: { icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30' },
  KUDOS_RECEIVED: { icon: Star, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  POST_LIKE: { icon: Star, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  POST_COMMENT: { icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  EVENT_REMINDER: { icon: Bell, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  SYSTEM: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30' },
};

function NotificationItem({ notification }: { notification: Notification }) {
  const { markAsRead } = useNotificationStore();
  const config = notificationIcons[notification.type] || notificationIcons.SYSTEM;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer hover:bg-muted/50',
        !notification.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-800' : 'border-border'
      )}
      onClick={() => !notification.isRead && markAsRead(notification.id)}
    >
      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium', !notification.isRead && 'text-foreground')}>{notification.title}</p>
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notification.createdAt)}</p>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead, isLoading } = useNotificationStore();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              You&apos;ll be notified about achievement updates, kudos, and more.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
