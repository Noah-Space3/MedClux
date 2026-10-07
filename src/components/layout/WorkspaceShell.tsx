'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  CheckSquare,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar, Badge, Button, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/api';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PATIENT_NAV: NavItem[] = [
  { href: '/patient', label: 'Overview', icon: LayoutDashboard },
  { href: '/doctors', label: 'Find Doctors', icon: Stethoscope },
  { href: '/patient/appointments', label: 'Appointments', icon: Calendar },
  { href: '/patient/health-plans', label: 'Health Plans & Card', icon: HeartHandshake },
  { href: '/patient/dependants', label: 'Dependants', icon: Users },
  { href: '/patient/medical-records', label: 'Medical Records', icon: FileText },
  { href: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
  { href: '/patient/lab-tests', label: 'Lab Tests', icon: FlaskConical },
  { href: '/facilities', label: 'Facilities', icon: Building2 },
  { href: '/patient/payments', label: 'Payments & Billing', icon: CreditCard },
  { href: '/patient/notifications', label: 'Notifications', icon: Bell },
  { href: '/patient/profile', label: 'Profile & Settings', icon: User },
];

const DOCTOR_NAV: NavItem[] = [
  { href: '/doctor', label: 'Overview', icon: LayoutDashboard },
  { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
  { href: '/doctor/schedule', label: 'Schedule & Hours', icon: Clock },
  { href: '/doctor/patients', label: 'My Patients', icon: Users },
  { href: '/doctor/profile', label: 'Practice Profile', icon: User },
  { href: '/doctor/notifications', label: 'Notifications', icon: Bell },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: Activity },
  { href: '/admin/verification', label: 'Doctor Verification', icon: CheckSquare },
  { href: '/admin/doctors', label: 'Doctors Directory', icon: Stethoscope },
  { href: '/admin/patients', label: 'Patients Directory', icon: Users },
  { href: '/admin/appointments', label: 'All Appointments', icon: Calendar },
  { href: '/admin/hmo-plans', label: 'HMO Plans', icon: HeartHandshake },
  { href: '/admin/facilities', label: 'Facilities', icon: Building2 },
  { href: '/admin/payments', label: 'Payments Ledger', icon: CreditCard },
  { href: '/admin/settings', label: 'Platform Settings', icon: Settings },
];

export function WorkspaceShell({
  requiredRole,
  title,
  subtitle,
  actions,
  children,
}: {
  requiredRole: UserRole;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loginWithDemoRole, logout } = useAuth();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => (user ? notificationService.getNotifications(user.id) : Promise.resolve([])),
    enabled: Boolean(user?.id),
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navItems =
    requiredRole === 'admin'
      ? ADMIN_NAV
      : requiredRole === 'doctor'
      ? DOCTOR_NAV
      : PATIENT_NAV;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-clinical-50 p-6 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-14 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  // Unauthenticated Guard
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-clinical-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-elevated">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Authentication Required</h1>
          <p className="mt-2 text-sm text-slate-600">
            Please sign in to access the MedClux{' '}
            <strong className="capitalize">{requiredRole}</strong> workspace, or launch the demo
            account directly below.
          </p>
          <div className="mt-6 space-y-3">
            <Button
              variant="primary"
              className="w-full"
              isLoading={switching}
              onClick={async () => {
                setSwitching(true);
                await loginWithDemoRole(requiredRole);
                setSwitching(false);
              }}
            >
              Continue as Demo {requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)}
            </Button>
            <Link href={`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`} className="block">
              <Button variant="outline" className="w-full">
                Go to Sign In Page
              </Button>
            </Link>
            <Link href="/" className="block text-xs text-slate-500 hover:text-slate-800 pt-2">
              ← Return to MedClux Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Role Mismatch Guard (Prevent users from accessing another role's pages)
  if (user.role !== requiredRole) {
    const ownPortal =
      user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/patient';

    return (
      <div className="min-h-screen bg-clinical-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-elevated">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <Badge variant="warning">403 Role Restricted</Badge>
          <h1 className="mt-3 text-xl font-bold text-slate-900">
            Restricted to {requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} Accounts
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            You are currently signed in as <strong>{user.fullName}</strong> (
            <span className="capitalize">{user.role}</span>). For security and clinical privacy,
            roles cannot access another role’s portal directly.
          </p>
          <div className="mt-6 space-y-2.5">
            <Link href={ownPortal} className="block">
              <Button variant="primary" className="w-full">
                Return to My {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              isLoading={switching}
              onClick={async () => {
                setSwitching(true);
                const switched = await loginWithDemoRole(requiredRole);
                setSwitching(false);
                showToast({
                  title: `Switched to ${switched.fullName}`,
                  description: `Now viewing the ${requiredRole} workspace.`,
                  variant: 'info',
                });
              }}
            >
              Switch to Demo {requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinical-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside
        aria-label={`${requiredRole} navigation`}
        className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white z-30"
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900">
                Med<span className="text-brand-600">Clux</span>
              </span>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-brand-700">
                {requiredRole} Portal
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExactOverview =
              item.href === '/patient' || item.href === '/doctor' || item.href === '/admin';
            const active = isExactOverview
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      active ? 'text-brand-600' : 'text-slate-400'
                    )}
                  />
                  <span>{item.label}</span>
                </span>
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          {requiredRole === 'patient' && (
            <Link
              href="/emergency"
              className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>24/7 Emergency Access</span>
            </Link>
          )}
          <div className="flex items-center gap-3">
            <Avatar name={user.fullName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.fullName}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push('/auth/login');
              }}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open portal navigation"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden sm:block text-xs text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher Pill for Portfolio Evaluation */}
            <div className="hidden md:flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs">
              {(['patient', 'doctor', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={async () => {
                    await loginWithDemoRole(r);
                    router.push(r === 'admin' ? '/admin' : r === 'doctor' ? '/doctor' : '/patient');
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-1 font-medium capitalize transition-colors',
                    user.role === r
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <Link
              href={
                requiredRole === 'doctor'
                  ? '/doctor/notifications'
                  : requiredRole === 'patient'
                  ? '/patient/notifications'
                  : '/admin'
              }
              aria-label="Notifications"
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-600" />
                </span>
              )}
            </Link>

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Public Site</span>
            </Link>
          </div>
        </header>

        {/* Mobile Slide-Over Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative z-10 flex w-72 flex-col bg-white h-full shadow-elevated">
              <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
                <span className="text-base font-bold text-slate-900">
                  Med<span className="text-brand-600">Clux</span>{' '}
                  <span className="text-xs font-normal capitalize text-slate-500">
                    ({requiredRole})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1">
                <span className="text-[11px] text-slate-500 mr-1">Switch Demo:</span>
                {(['patient', 'doctor', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={async () => {
                      setSidebarOpen(false);
                      await loginWithDemoRole(r);
                      router.push(r === 'admin' ? '/admin' : r === 'doctor' ? '/doctor' : '/patient');
                    }}
                    className={cn(
                      'rounded px-2 py-0.5 text-[11px] font-medium capitalize',
                      user.role === r
                        ? 'bg-brand-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                        active
                          ? 'bg-brand-50 text-brand-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <Icon className="h-4 w-4 text-brand-600" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Page Body */}
        <main id="main-content" className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {(subtitle || actions) && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                {subtitle && <p className="text-sm text-slate-600 sm:hidden">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
