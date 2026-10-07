'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  PhoneCall,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/domain';

export function PublicNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loginWithDemoRole, logout } = useAuth();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<UserRole | null>(null);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/doctors', label: 'Find Doctors' },
    { href: '/health-plans', label: 'HMO Health Plans' },
    { href: '/facilities', label: 'Facilities' },
  ];

  const handleQuickDemoSwitch = async (role: UserRole) => {
    try {
      setSwitchingRole(role);
      const logged = await loginWithDemoRole(role);
      showToast({
        title: `Switched to ${logged.fullName}`,
        description: `Signed in as ${logged.email} (${role.toUpperCase()} portal).`,
        variant: 'info',
      });
      const target =
        role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor' : '/patient';
      router.push(target);
    } catch (err) {
      showToast({
        title: 'Switch failed',
        description: err instanceof Error ? err.message : 'Unable to switch demo user',
        variant: 'error',
      });
    } finally {
      setSwitchingRole(null);
    }
  };

  const portalHref =
    user?.role === 'admin' ? '/admin' : user?.role === 'doctor' ? '/doctor' : '/patient';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      {/* Demo Mode & Emergency Top Utility Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-brand-500/20 px-2 py-0.5 text-[11px] font-semibold text-brand-300 border border-brand-500/30">
              <ShieldCheck className="h-3 w-3" />
              MedClux Demo Mode
            </span>
            <span className="hidden md:inline text-slate-400">
              Instant evaluation access:
            </span>
            <div className="flex items-center gap-1">
              {(['patient', 'doctor', 'admin'] as UserRole[]).map((roleOption) => (
                <button
                  key={roleOption}
                  type="button"
                  disabled={switchingRole !== null}
                  onClick={() => handleQuickDemoSwitch(roleOption)}
                  className={cn(
                    'rounded px-2 py-0.5 text-[11px] font-medium capitalize transition-colors',
                    user?.role === roleOption
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  )}
                >
                  {switchingRole === roleOption ? '...' : `${roleOption} View`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/emergency"
              className="inline-flex items-center gap-1.5 font-semibold text-red-400 hover:text-red-300"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Emergency Care (112 / 767)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Med<span className="text-brand-600">Clux</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-500 leading-none">
                Care & HMO Platform
              </span>
            </div>
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/emergency">
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              leftIcon={<PhoneCall className="h-3.5 w-3.5" />}
            >
              Emergency
            </Button>
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <Link href={portalHref}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<LayoutDashboard className="h-4 w-4" />}
                >
                  {user.role === 'admin'
                    ? 'Admin Console'
                    : user.role === 'doctor'
                    ? 'Doctor Portal'
                    : 'Patient Dashboard'}
                </Button>
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  showToast({
                    title: 'Signed out',
                    description: 'You have been signed out of MedClux.',
                    variant: 'info',
                  });
                }}
                title="Sign out"
                aria-label="Sign out"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/emergency"
            className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 border border-red-200"
          >
            SOS
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pt-3 pb-5 md:hidden space-y-3">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm font-medium',
                  pathname === item.href
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/emergency"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-red-700 bg-red-50/70"
            >
              Emergency Access (24/7)
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 px-2 py-1">
                  <Avatar name={user.fullName} size="sm" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-900">{user.fullName}</p>
                    <p className="text-slate-500 capitalize">{user.role} Account</p>
                  </div>
                </div>
                <Link href={portalHref} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Go to {user.role} Portal
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Stethoscope className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                Med<span className="text-brand-600">Clux</span>
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Find the right care and manage your healthcare in one place. Verified Nigerian
              specialists, diagnostic bookings, and digital HMO coverage.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Patient Care
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/doctors" className="hover:text-brand-600">
                  Find a Specialist
                </Link>
              </li>
              <li>
                <Link href="/health-plans" className="hover:text-brand-600">
                  Compare HMO Plans
                </Link>
              </li>
              <li>
                <Link href="/facilities" className="hover:text-brand-600">
                  Partner Hospitals & Labs
                </Link>
              </li>
              <li>
                <Link href="/emergency" className="text-red-600 font-medium hover:text-red-700">
                  24/7 Emergency Directory
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Portals (Demo Ready)
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/patient" className="hover:text-brand-600">
                  Patient Workspace
                </Link>
              </li>
              <li>
                <Link href="/doctor" className="hover:text-brand-600">
                  Doctor Clinic Console
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-brand-600">
                  Admin Governance Portal
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-brand-600">
                  Demo Account Switcher
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Portfolio Disclaimer
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <strong>MedClux</strong> is a fictional healthcare portfolio product. All HMO
              providers, health plans, Naira (₦) prices, doctors, hospitals, and medical records
              shown are fictional demonstration data and do not constitute real medical advice or
              insurance coverage.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} MedClux Healthcare Platform. Built with Next.js, TypeScript & Tailwind CSS.</p>
          <p className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-brand-600" />
            <span>WCAG Accessible • Mobile-First • Service-Layer Architecture</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
