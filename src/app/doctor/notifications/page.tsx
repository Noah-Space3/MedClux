'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { notificationService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { formatDate } from '@/lib/utils';

export default function DoctorNotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.role === 'doctor' ? user.id : 'doc-1';

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationService.getNotifications(userId),
  });

  return (
    <WorkspaceShell
      requiredRole="doctor"
      title="Doctor Notifications"
      subtitle="Booking requests, schedule updates, and patient alerts"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await notificationService.markAllAsRead(userId);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }}
          leftIcon={<CheckCheck className="h-4 w-4" />}
        >
          Mark All Read
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Alerts for new patient appointment requests will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                <Bell className="h-4 w-4 text-brand-600 mt-1" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                    {!n.isRead && <Badge variant="brand">New</Badge>}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                  <span className="text-[11px] text-slate-400">{formatDate(n.createdAt)}</span>
                </div>
              </div>
              {!n.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await notificationService.markAsRead(n.id);
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                  }}
                >
                  Mark Read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
