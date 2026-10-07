'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Lock, Mail, ShieldCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { authService } from '@/services/api';
import { Button, Input } from '@/components/ui';
import { UserRole } from '@/types/domain';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const { login, loginWithDemoRole } = useAuth();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState<UserRole | null>(null);

  const demoAccounts = authService.getDemoAccounts();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'patient@medclux.demo',
      password: 'demo-password',
    },
  });

  const redirectUserByRole = (role: UserRole) => {
    if (callbackUrl && callbackUrl.startsWith('/')) {
      router.push(callbackUrl);
      return;
    }
    if (role === 'admin') router.push('/admin');
    else if (role === 'doctor') router.push('/doctor');
    else router.push('/patient');
  };

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const loggedUser = await login(values.email, values.password);
      showToast({
        title: `Welcome back, ${loggedUser.fullName}`,
        description: `Signed in to your MedClux ${loggedUser.role} account.`,
        variant: 'success',
      });
      redirectUserByRole(loggedUser.role);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  const handleDemoLogin = async (role: UserRole, email: string) => {
    setServerError(null);
    setDemoLoading(role);
    setValue('email', email);
    setValue('password', 'demo-password');
    try {
      const loggedUser = await loginWithDemoRole(role);
      showToast({
        title: `Signed in as ${loggedUser.fullName}`,
        description: `Demo ${role.toUpperCase()} session active.`,
        variant: 'info',
      });
      redirectUserByRole(loggedUser.role);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-clinical-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900">
            Med<span className="text-brand-600">Clux</span>
          </span>
        </Link>
        <h1 className="mt-5 text-center text-2xl font-bold text-slate-900">
          Sign in to your MedClux account
        </h1>
        <p className="mt-1.5 text-center text-sm text-slate-600">
          Access your appointments, HMO coverage, or clinical portal.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-elevated">
          {serverError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <Link
                  href="/auth/verify-email"
                  className="text-slate-500 hover:text-slate-800"
                >
                  Verify email code
                </Link>
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-brand-700 hover:text-brand-800"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          {/* Isolated Demo Accounts Section */}
          <div className="mt-7 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <span>Portfolio Demo Accounts (One-Click Sign In)</span>
            </div>
            <div className="space-y-2.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={demoLoading !== null}
                  onClick={() => handleDemoLogin(acc.role, acc.email)}
                  className="w-full text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-brand-50/60 hover:border-brand-300 p-3 transition-all flex items-center justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                        {acc.label}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{acc.email}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{acc.name}</p>
                    <p className="text-xs text-slate-500">{acc.subtitle}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            New to MedClux?{' '}
            <Link href="/auth/register" className="font-semibold text-brand-700 hover:underline">
              Create a Patient or Doctor account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-clinical-50" />}>
      <LoginContent />
    </Suspense>
  );
}
