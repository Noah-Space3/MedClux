'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Stethoscope } from 'lucide-react';
import { authService } from '@/services/api';
import { Button, Input } from '@/components/ui';

export default function VerifyEmailPage() {
  const [code, setCode] = useState('482910');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.verifyEmailCode(code);
      setVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code.');
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
        <h1 className="mt-5 text-center text-2xl font-bold text-slate-900">Verify your email</h1>
        <p className="mt-1.5 text-center text-sm text-slate-600">
          Enter the 6-digit verification code sent to your email address.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-elevated">
          {verified ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Email Verified</h2>
              <p className="text-sm text-slate-600">
                Your MedClux email address has been verified.
              </p>
              <Link href="/patient" className="block pt-2">
                <Button variant="primary" className="w-full">
                  Continue to MedClux
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="6-Digit Verification Code (Demo Pre-filled)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                leftIcon={<ShieldCheck className="h-4 w-4" />}
                error={error || undefined}
              />
              <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
                Verify Email
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
