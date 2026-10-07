'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { PublicFooter, PublicNavbar } from '@/components/layout/PublicLayout';
import { DigitalHealthCardView } from '@/components/domain/cards';
import { Badge, Button, ErrorState, Skeleton } from '@/components/ui';
import { dependantService, healthPlanService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { DigitalHealthCard } from '@/types/domain';
import { formatNaira } from '@/lib/utils';

export default function HealthPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loginWithDemoRole } = useAuth();
  const { showToast } = useToast();
  const planId = params.id;

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedDependants, setSelectedDependants] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Bank Transfer' | 'USSD'>('Card');
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCard, setCreatedCard] = useState<DigitalHealthCard | null>(null);

  const patientId = user?.role === 'patient' ? user.id : 'pat-1';

  const {
    data: plan,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['healthPlan', planId],
    queryFn: () => healthPlanService.getPlanById(planId),
  });

  const { data: dependants = [] } = useQuery({
    queryKey: ['dependants', patientId],
    queryFn: () => dependantService.getDependants(patientId),
  });

  const { data: activePlanData } = useQuery({
    queryKey: ['activePlan', patientId],
    queryFn: () => healthPlanService.getPatientActivePlan(patientId),
  });

  const toggleDependant = (depId: string) => {
    if (!plan) return;
    setError(null);
    setSelectedDependants((prev) => {
      if (prev.includes(depId)) return prev.filter((id) => id !== depId);
      if (prev.length >= plan.maxDependants) {
        setError(
          `${plan.name} allows up to ${plan.maxDependants} dependant(s). Remove one or choose a higher plan tier.`
        );
        return prev;
      }
      return [...prev, depId];
    });
  };

  const handleSubscribe = async () => {
    if (!plan) return;
    setError(null);
    setSubscribing(true);
    try {
      if (!user) {
        await loginWithDemoRole('patient');
      }
      const res = await healthPlanService.subscribeToPlan({
        patientId,
        planId: plan.id,
        billingCycle,
        dependantIds: selectedDependants,
        paymentMethod,
      });
      setCreatedCard(res.digitalCard);
      queryClient.invalidateQueries({ queryKey: ['activePlan'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast({
        title: `Subscribed to ${plan.name}!`,
        description: `Digital Health Card (${res.digitalCard.memberId}) generated.`,
        variant: 'success',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-clinical-50">
      <PublicNavbar />

      <main id="main-content" className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/health-plans"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-brand-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All HMO Plans</span>
        </Link>

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : isError || !plan ? (
          <ErrorState title="Health plan not found" />
        ) : createdCard ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-elevated space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <Badge variant="success">HMO Plan Activated</Badge>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">
                  Your MedClux Digital Health Card is Ready
                </h1>
              </div>
            </div>

            <DigitalHealthCardView card={createdCard} />

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
              <Button variant="primary" onClick={() => router.push('/patient/health-plans')}>
                Manage Plan in Patient Portal
              </Button>
              <Link href="/facilities">
                <Button variant="outline">Browse Covered Network Hospitals</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            {/* Left Column: Plan Coverage & Exclusions */}
            <div className="lg:col-span-7 space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand">{plan.tier} Tier</Badge>
                  <Badge variant="default">{plan.hospitalNetworkTier}</Badge>
                  {activePlanData?.enrollment?.planId === plan.id && (
                    <Badge variant="success">Currently Active on Your Account</Badge>
                  )}
                </div>

                <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">{plan.name}</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Underwritten by <strong>{plan.providerName}</strong> • Annual Coverage Limit up to{' '}
                  <strong className="text-slate-900">
                    {formatNaira(plan.annualCoverageLimit)}
                  </strong>
                </p>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">Covered Benefits Breakdown</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    {[
                      { label: 'Doctor Consultations', value: plan.coveredConsultations },
                      { label: 'Specialist Access', value: plan.specialistAccess },
                      { label: 'Emergency & Ambulance', value: plan.emergencyCareBenefits },
                      { label: 'Diagnostic Lab Tests', value: plan.labBenefits },
                      { label: 'Prescribed Medications', value: plan.medicationBenefits },
                      { label: 'Dental Care', value: plan.dentalBenefits },
                      { label: 'Optical & Vision', value: plan.opticalBenefits },
                      {
                        label: 'Dependants Allowed',
                        value: `Principal + up to ${plan.maxDependants} dependant(s)`,
                      },
                    ].map((b) => (
                      <div
                        key={b.label}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                      >
                        <span className="text-xs font-semibold text-brand-700 flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          {b.label}
                        </span>
                        <p className="mt-1 text-slate-800">{b.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Plan Exclusions
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                      {plan.exclusions.map((ex) => (
                        <li key={ex}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Terms & Portfolio Disclaimer
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                      {plan.termsAndNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Enrollment & Dependant Selector */}
            <aside className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-elevated space-y-6 lg:sticky lg:top-24">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                  HMO Plan Enrollment
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Subscribe to {plan.name}
                </h2>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Billing Cycle */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  1. Choose Billing Cycle
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`rounded-xl border p-3 text-left ${
                      billingCycle === 'monthly'
                        ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-600'
                        : 'border-slate-200'
                    }`}
                  >
                    <span className="text-xs text-slate-500 block">Monthly</span>
                    <strong className="text-base font-bold text-slate-900">
                      {formatNaira(plan.monthlyPrice)}
                    </strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`rounded-xl border p-3 text-left ${
                      billingCycle === 'annual'
                        ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-600'
                        : 'border-slate-200'
                    }`}
                  >
                    <span className="text-xs text-emerald-700 font-semibold block">
                      Annual (Save 10%)
                    </span>
                    <strong className="text-base font-bold text-slate-900">
                      {formatNaira(plan.annualPrice)}
                    </strong>
                  </button>
                </div>
              </div>

              {/* Step 2: Select Dependants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-brand-600" />
                    2. Include Dependants ({selectedDependants.length}/{plan.maxDependants})
                  </span>
                  <Link
                    href="/patient/dependants"
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Manage Dependants
                  </Link>
                </div>
                <div className="space-y-2">
                  {dependants.map((dep) => {
                    const checked = selectedDependants.includes(dep.id);
                    return (
                      <label
                        key={dep.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs cursor-pointer hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDependant(dep.id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">{dep.fullName}</p>
                            <p className="text-slate-500 capitalize">{dep.relationship}</p>
                          </div>
                        </div>
                        <Badge variant="default">No Extra Cost</Badge>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  3. Mock Payment Method
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Card', 'Bank Transfer', 'USSD'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`rounded-lg border py-2 px-2 text-xs font-semibold ${
                        paymentMethod === m
                          ? 'border-brand-600 bg-brand-50 text-brand-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5 mx-auto mb-1 text-brand-600" />
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                  <span>Total Subscription Amount</span>
                  <span className="text-lg text-brand-700">
                    {formatNaira(billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice)}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={subscribing}
                  onClick={handleSubscribe}
                >
                  Activate Plan & Issue Digital Card
                </Button>
                <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                  <span>Mock checkout • Generates instant MedClux Digital Health Card</span>
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
