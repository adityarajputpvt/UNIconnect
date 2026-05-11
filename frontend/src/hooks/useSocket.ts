'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { Notification } from '@/types';

export function useSocket() {
  const { isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();

    // Listen for real-time notifications
    socket.on('notification', (notification: Notification) => {
      addNotification(notification);
    });

    socket.on('kudos_received', () => {
      // Refresh notifications
    });

    return () => {
      socket.off('notification');
      socket.off('kudos_received');
    };
  }, [isAuthenticated, addNotification]);
}
