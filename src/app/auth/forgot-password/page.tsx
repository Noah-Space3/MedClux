'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Mail, Stethoscope } from 'lucide-react';
import { authService } from '@/services/api';
import { Button, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authService.requestPasswordReset(email);
      setSubmittedMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-clinical-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900">
            Med<span className="text-brand-600">Clux</span>
          </span>
        </Link>
        <h1 className="mt-5 text-center text-2xl font-bold text-slate-900">Reset your password</h1>
        <p className="mt-1.5 text-center text-sm text-slate-600">
          Enter the email linked to your MedClux account to receive recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-elevated">
          {submittedMessage ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Check your inbox</h2>
              <p className="text-sm text-slate-600">{submittedMessage}</p>
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/auth/reset-password">
                  <Button variant="primary" className="w-full">
                    Open Mock Password Reset Form
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Account Email"
                type="email"
                required
                placeholder="patient@medclux.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                error={error || undefined}
              />
              <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
                Send Recovery Link
              </Button>
              <div className="text-center pt-2">
                <Link href="/auth/login" className="text-xs font-medium text-slate-600 hover:text-slate-900">
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
