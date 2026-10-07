'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, CheckCircle2, Clock, Pill } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { patientService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { formatDate } from '@/lib/utils';

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const patientId = user?.id || 'pat-1';

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['prescriptions', patientId],
    queryFn: () => patientService.getPrescriptions(patientId),
  });

  return (
    <WorkspaceShell
      requiredRole="patient"
      title="Prescriptions & Medications"
      subtitle="Digital prescriptions issued by your MedClux specialists"
      actions={
        <Link href="/facilities">
          <Button variant="outline" size="sm" leftIcon={<Building2 className="h-4 w-4" />}>
            Find Partner Pharmacy
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-40 w-full" />
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <EmptyState
          title="No prescriptions on file"
          description="Medications prescribed during your MedClux consultations will appear here with dosage instructions."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {rx.medicationName} — <span className="text-brand-700">{rx.dosage}</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Prescribed by <strong>{rx.doctorName}</strong> ({rx.doctorSpecialty}) • Issued{' '}
                      {formatDate(rx.dateIssued)}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={rx.status === 'active' ? 'success' : 'default'}
                  icon={
                    rx.status === 'active' ? (
                      <Clock className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                    )
                  }
                >
                  {rx.status === 'active' ? 'Active Regimen' : 'Completed Course'}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Dosage Frequency</span>
                  <strong className="text-slate-900">{rx.frequency}</strong>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Course Duration</span>
                  <strong className="text-slate-900">{rx.duration}</strong>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Authorized Refills</span>
                  <strong className="text-slate-900">{rx.refillsRemaining} remaining</strong>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-brand-50/50 border border-brand-100 p-3 text-xs sm:text-sm text-slate-800">
                <strong className="text-brand-900">Clinical Instructions:</strong>{' '}
                {rx.instructions}
              </div>
            </div>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
