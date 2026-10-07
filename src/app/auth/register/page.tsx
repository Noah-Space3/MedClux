'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Stethoscope, User, UserPlus } from 'lucide-react';
import { authService, doctorService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button, Input, Select } from '@/components/ui';
import { NIGERIAN_PHONE_REGEX } from '@/lib/utils';

const registerSchema = z
  .object({
    role: z.enum(['patient', 'doctor']),
    fullName: z.string().min(3, 'Full name is required (minimum 3 characters)'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(
        NIGERIAN_PHONE_REGEX,
        'Enter a valid Nigerian phone number (e.g., +2348034567890 or 08034567890)'
      ),
    state: z.enum(['Lagos', 'Abuja (FCT)', 'Rivers', 'Oyo']),
    city: z.string().min(2, 'City or area is required'),
    specialtyId: z.string().optional(),
    mdcnNumber: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'doctor') {
      if (!data.mdcnNumber || data.mdcnNumber.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mdcnNumber'],
          message: 'MDCN registration number is required for doctors (e.g., MDCN/R/71024)',
        });
      }
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: specialties = [] } = useQuery({
    queryKey: ['specialties'],
    queryFn: () => doctorService.getSpecialties(),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'patient',
      fullName: '',
      email: '',
      phone: '+234803',
      state: 'Lagos',
      city: 'Lekki Phase 1',
      specialtyId: 'spec-general',
      mdcnNumber: '',
      password: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const { user } = await authService.register(values);
      await refreshSession();
      showToast({
        title: 'Account created successfully',
        description:
          user.role === 'doctor'
            ? 'Welcome to MedClux! Your MDCN credentials have been queued for verification.'
            : 'Welcome to MedClux! Your patient profile is ready.',
        variant: 'success',
      });
      router.push(user.role === 'doctor' ? '/doctor' : '/patient');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-clinical-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900">
            Med<span className="text-brand-600">Clux</span>
          </span>
        </Link>
        <h1 className="mt-5 text-center text-2xl font-bold text-slate-900">
          Create your MedClux account
        </h1>
        <p className="mt-1.5 text-center text-sm text-slate-600">
          Join as a Patient or register your medical practice as a Doctor.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-elevated">
          {/* Role Selector (Patient or Doctor only — Admin is never publicly selectable) */}
          <div className="grid grid-cols-2 gap-3 mb-6" role="radiogroup" aria-label="Account role">
            <button
              type="button"
              onClick={() => setValue('role', 'patient')}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                selectedRole === 'patient'
                  ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <User className="h-5 w-5 text-brand-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Patient</p>
                <p className="text-[11px] text-slate-500">Book care & HMO plans</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setValue('role', 'doctor')}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                selectedRole === 'doctor'
                  ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Stethoscope className="h-5 w-5 text-brand-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Doctor</p>
                <p className="text-[11px] text-slate-500">Manage consultations</p>
              </div>
            </button>
          </div>

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
              label={selectedRole === 'doctor' ? 'Full Name (without Dr.)' : 'Full Name'}
              placeholder={selectedRole === 'doctor' ? 'e.g., Chisom Okeke' : 'e.g., Adaeze Okafor'}
              required
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.ng"
                required
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Nigerian Phone Number"
                type="tel"
                placeholder="+2348034567890"
                required
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="State"
                required
                options={[
                  { value: 'Lagos', label: 'Lagos' },
                  { value: 'Abuja (FCT)', label: 'Abuja (FCT)' },
                  { value: 'Rivers', label: 'Rivers (Port Harcourt)' },
                  { value: 'Oyo', label: 'Oyo (Ibadan)' },
                ]}
                error={errors.state?.message}
                {...register('state')}
              />
              <Input
                label="City / Area"
                placeholder="e.g., Victoria Island, Maitama"
                required
                error={errors.city?.message}
                {...register('city')}
              />
            </div>

            {selectedRole === 'doctor' && (
              <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-800">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                  <span>Medical Council Credentials (Required for Verification)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Primary Specialty"
                    options={specialties.map((s) => ({ value: s.id, label: s.name }))}
                    error={errors.specialtyId?.message}
                    {...register('specialtyId')}
                  />
                  <Input
                    label="MDCN Folio Number"
                    placeholder="MDCN/R/71204"
                    required
                    error={errors.mdcnNumber?.message}
                    {...register('mdcnNumber')}
                  />
                </div>
              </div>
            )}

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              Create {selectedRole === 'doctor' ? 'Doctor' : 'Patient'} Account
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-600">
            Already have a MedClux account?{' '}
            <Link href="/auth/login" className="font-semibold text-brand-700 hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
