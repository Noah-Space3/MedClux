'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { notificationService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { formatDate } from '@/lib/utils';

export default function PatientNotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || 'pat-1';
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationService.getNotifications(userId),
  });

  const displayed =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(userId);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <WorkspaceShell
      requiredRole="patient"
      title="Notifications"
      subtitle="Stay updated on appointment confirmations, lab results, and HMO renewals"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          leftIcon={<CheckCheck className="h-4 w-4" />}
        >
          Mark All as Read
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
              filter === 'all' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
              filter === 'unread' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200'
            }`}
          >
            Unread ({notifications.filter((n) => !n.isRead).length})
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : displayed.length === 0 ? (
          <EmptyState
            title="You’re all caught up"
            description="No unread notifications at the moment."
          />
        ) : (
          <div className="space-y-3">
            {displayed.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  n.isRead
                    ? 'border-slate-200 bg-white'
                    : 'border-brand-300 bg-brand-50/40 shadow-card'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 mt-0.5">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                      {!n.isRead && <Badge variant="brand">Unread</Badge>}
                      <span className="text-xs text-slate-400">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600">{n.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.actionUrl && (
                    <Link href={n.actionUrl}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  )}
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(n.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
