'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ShieldCheck } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { DigitalHealthCardView, HealthPlanCard } from '@/components/domain/cards';
import { Badge, Button, EmptyState, Modal, Skeleton } from '@/components/ui';
import { healthPlanService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { formatDate, formatNaira } from '@/lib/utils';

export default function PatientHealthPlansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const patientId = user?.id || 'pat-1';

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: activePlanData, isLoading: loadingActive } = useQuery({
    queryKey: ['activePlan', patientId],
    queryFn: () => healthPlanService.getPatientActivePlan(patientId),
  });

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['healthPlans'],
    queryFn: () => healthPlanService.getPlans(),
  });

  const handleCancelPlan = async () => {
    if (!activePlanData?.enrollment) return;
    setCancelling(true);
    try {
      await healthPlanService.cancelPlanEnrollment(activePlanData.enrollment.id);
      queryClient.invalidateQueries({ queryKey: ['activePlan'] });
      showToast({
        title: 'HMO Plan Cancelled',
        description: 'Your health plan subscription has been marked inactive.',
        variant: 'info',
      });
      setConfirmCancelOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <WorkspaceShell
      requiredRole="patient"
      title="HMO Health Plans & Digital Card"
      subtitle="View your active HMO coverage, digital membership card, and compare plans"
      actions={
        <Link href="/facilities">
          <Button variant="outline" size="sm" leftIcon={<Building2 className="h-4 w-4" />}>
            Network Hospitals
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Active Plan + Digital Health Card Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
            <div>
              <Badge variant="brand" icon={<ShieldCheck className="h-3.5 w-3.5 text-brand-600" />}>
                Digital Health Membership
              </Badge>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Active Plan & Digital Health Card
              </h2>
            </div>
            {activePlanData?.enrollment && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => setConfirmCancelOpen(true)}
              >
                Cancel Active Plan
              </Button>
            )}
          </div>

          {loadingActive ? (
            <Skeleton className="h-60 w-full mt-5" />
          ) : !activePlanData?.enrollment || !activePlanData.digitalCard ? (
            <div className="mt-6">
              <EmptyState
                title="No active HMO plan on your account"
                description="Choose one of the fictional MedClux HMO plans below to generate your Digital Health Card and enjoy 90% consultation co-pay coverage."
              />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7">
                <DigitalHealthCardView card={activePlanData.digitalCard} />
              </div>

              <div className="lg:col-span-5 space-y-4 text-xs sm:text-sm">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan Tier</span>
                    <strong className="text-slate-900">{activePlanData.enrollment.planName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Billing Cycle</span>
                    <strong className="text-slate-900 capitalize">
                      {activePlanData.enrollment.billingCycle} (
                      {formatNaira(activePlanData.enrollment.amountPaid)})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Renewal Date</span>
                    <strong className="text-slate-900">
                      {formatDate(activePlanData.enrollment.renewalDate)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dependants Enrolled</span>
                    <strong className="text-slate-900">
                      {activePlanData.enrollment.enrolledDependantIds.length} of{' '}
                      {activePlanData.plan?.maxDependants || 3} slots used
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href="/facilities" className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      Find Covered Facilities
                    </Button>
                  </Link>
                  <Link href="/patient/dependants" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Dependants
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Browse / Upgrade Plans */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Available MedClux HMO Plans (Fictional)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Switch or upgrade your coverage tier at any time.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  billingCycle === 'monthly' ? 'bg-brand-600 text-white' : 'text-slate-600'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  billingCycle === 'annual' ? 'bg-brand-600 text-white' : 'text-slate-600'
                }`}
              >
                Annual (Save 10%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {loadingPlans
              ? [1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-96 w-full" />)
              : plans.map((plan) => (
                  <HealthPlanCard
                    key={plan.id}
                    plan={plan}
                    billingCycle={billingCycle}
                    isActivePlan={activePlanData?.enrollment?.planId === plan.id}
                    onSelectPlan={(selected) => router.push(`/health-plans/${selected.id}`)}
                  />
                ))}
          </div>
        </section>
      </div>

      <Modal
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        title="Cancel Active Health Plan?"
        description="Your MedClux Digital Health Card will immediately become inactive."
      >
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Are you sure you want to cancel your active subscription to{' '}
            <strong className="text-slate-900">{activePlanData?.enrollment?.planName}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmCancelOpen(false)}>
              Keep Plan Active
            </Button>
            <Button variant="danger" isLoading={cancelling} onClick={handleCancelPlan}>
              Yes, Cancel Plan
            </Button>
          </div>
        </div>
      </Modal>
    </WorkspaceShell>
  );
}
