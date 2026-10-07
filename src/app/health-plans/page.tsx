'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Check, Scale, ShieldCheck, X } from 'lucide-react';
import { PublicFooter, PublicNavbar } from '@/components/layout/PublicLayout';
import { HealthPlanCard } from '@/components/domain/cards';
import { Badge, Button, Modal, Skeleton } from '@/components/ui';
import { healthPlanService } from '@/services/api';
import { HealthPlan } from '@/types/domain';
import { formatNaira } from '@/lib/utils';
import { useToast } from '@/providers/ToastProvider';

export default function HealthPlansPage() {
  const { showToast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [comparedIds, setComparedIds] = useState<string[]>(['plan-silver', 'plan-gold']);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['healthPlans'],
    queryFn: () => healthPlanService.getPlans(),
  });

  const toggleCompare = (plan: HealthPlan) => {
    setComparedIds((prev) => {
      if (prev.includes(plan.id)) {
        return prev.filter((id) => id !== plan.id);
      }
      if (prev.length >= 3) {
        showToast({
          title: 'Maximum 3 plans for side-by-side comparison',
          description: 'Remove a plan first to compare another tier.',
          variant: 'warning',
        });
        return prev;
      }
      return [...prev, plan.id];
    });
  };

  const comparedPlans = plans.filter((p) => comparedIds.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col bg-clinical-50">
      <PublicNavbar />

      <main id="main-content" className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
          <div className="max-w-2xl">
            <Badge
              variant="brand"
              icon={<ShieldCheck className="h-3.5 w-3.5 text-brand-600" />}
            >
              Fictional HMO Plans • Portfolio Demonstration
            </Badge>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              Compare Health & HMO Coverage Plans
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Choose predictable healthcare coverage for yourself and your dependants across
              accredited Nigerian hospitals, clinics, and diagnostic centers.
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center gap-2 self-start lg:self-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-card">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                Save 10%
              </span>
            </button>
          </div>
        </div>

        {/* Compare Floating Bar */}
        {comparedPlans.length > 0 && (
          <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-800 flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-brand-600" />
                Comparing ({comparedPlans.length}/3):
              </span>
              {comparedPlans.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-brand-200 px-3 py-1 text-xs font-semibold text-slate-800"
                >
                  {p.name}
                  <button
                    type="button"
                    onClick={() => toggleCompare(p)}
                    aria-label={`Remove ${p.name} from comparison`}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={comparedPlans.length < 2}
              onClick={() => setCompareModalOpen(true)}
            >
              Compare {comparedPlans.length} Plans Side-by-Side
            </Button>
          </div>
        )}

        {/* Plan Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? [1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-[440px] w-full" />)
            : plans.map((plan) => (
                <HealthPlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  isComparing={comparedIds.includes(plan.id)}
                  onToggleCompare={toggleCompare}
                />
              ))}
        </div>

        {/* Full Side-by-Side Comparison Table on Page */}
        {!isLoading && plans.length > 0 && (
          <section className="mt-14 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Complete Plan Benefits Comparison Matrix
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                All figures and benefits below represent fictional portfolio coverage data.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 font-semibold text-slate-700 min-w-[180px]">
                      Benefit Category
                    </th>
                    {plans.map((p) => (
                      <th key={p.id} className="p-4 font-bold text-slate-900 min-w-[210px]">
                        <span className="text-xs text-brand-700 block uppercase">{p.tier}</span>
                        {p.name}
                        <span className="block text-sm font-bold text-slate-900 mt-1">
                          {formatNaira(billingCycle === 'annual' ? p.annualPrice : p.monthlyPrice)}{' '}
                          <span className="font-normal text-xs text-slate-500">
                            /{billingCycle === 'annual' ? 'yr' : 'mo'}
                          </span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Fictional HMO Provider</td>
                    {plans.map((p) => (
                      <td key={p.id} className="p-4 text-slate-600">
                        {p.providerName}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Annual Coverage Limit</td>
                    {plans.map((p) => (
                      <td key={p.id} className="p-4 font-semibold text-slate-900">
                        {formatNaira(p.annualCoverageLimit)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Hospital Network Access</td>
                    {plans.map((p) => (
                      <td key={p.id} className="p-4 text-slate-700">
                        <Badge variant="brand">{p.hospitalNetworkTier}</Badge>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Max Dependants Allowed</td>
                    {plans.map((p) => (
                      <td key={p.id} className="p-4 text-slate-700">
                        Up to {p.maxDependants} dependant(s)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Consultations</td>
                    {plans.map((p) => (
                      <td key={p.id} className="p-4 text-slate-600">
                        {p.coveredConsultations}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Specialist Access</td>
                    {plans.map((p) => (
                      <td key={p.id} className="p-4 text-slate-600">
                        {p.specialistAccess}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Emergency Care</td>
                    {plans.map((p) => (
                      <td key={p.id} className="p-4 text-slate-600">
                        {p.emergencyCareBenefits}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Dental & Optical</td>
                    {plans.map((p) => (
                      <td key={p.id} className="p-4 text-slate-600">
                        {p.dentalBenefits} • {p.opticalBenefits}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Diagnostics & Labs</td>
                    {plans.map((p) => (
                      <td key={p.id} className="p-4 text-slate-600">
                        {p.labBenefits}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Action</td>
                    {plans.map((p) => (
                      <td key={p.id} className="p-4">
                        <Link href={`/health-plans/${p.id}`}>
                          <Button variant="primary" size="sm" className="w-full">
                            Select {p.tier}
                          </Button>
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Side-by-Side Comparison Modal */}
      <Modal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        title="Side-by-Side HMO Plan Comparison"
        description="Comparing selected fictional MedClux HMO plans"
        maxWidth="max-w-4xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-3 font-semibold text-slate-600">Feature</th>
                {comparedPlans.map((p) => (
                  <th key={p.id} className="p-3 font-bold text-slate-900">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-medium">Price ({billingCycle})</td>
                {comparedPlans.map((p) => (
                  <td key={p.id} className="p-3 font-bold text-brand-700">
                    {formatNaira(billingCycle === 'annual' ? p.annualPrice : p.monthlyPrice)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium">Annual Limit</td>
                {comparedPlans.map((p) => (
                  <td key={p.id} className="p-3 font-semibold">
                    {formatNaira(p.annualCoverageLimit)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium">Dependants Allowed</td>
                {comparedPlans.map((p) => (
                  <td key={p.id} className="p-3">
                    Up to {p.maxDependants}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium">Consultations</td>
                {comparedPlans.map((p) => (
                  <td key={p.id} className="p-3">
                    {p.coveredConsultations}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium">Emergency Cover</td>
                {comparedPlans.map((p) => (
                  <td key={p.id} className="p-3">
                    {p.emergencyCareBenefits}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>

      <PublicFooter />
    </div>
  );
}
