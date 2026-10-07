'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  FileCheck2,
  FileText,
  FlaskConical,
  Pill,
  Stethoscope,
} from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Badge, Button, EmptyState, Modal, Skeleton } from '@/components/ui';
import { patientService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { MedicalRecord, MedicalRecordCategory } from '@/types/domain';
import { formatDate } from '@/lib/utils';

export default function PatientMedicalRecordsPage() {
  const { user } = useAuth();
  const patientId = user?.id || 'pat-1';
  const [category, setCategory] = useState<MedicalRecordCategory | 'all'>('all');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['medicalRecords', patientId],
    queryFn: () => patientService.getMedicalRecords(patientId),
  });

  const filtered =
    category === 'all' ? records : records.filter((r) => r.category === category);

  const categoryLabels: Record<MedicalRecordCategory, string> = {
    diagnosis: 'Clinical Diagnosis',
    visit_summary: 'Consultation Visit Summary',
    lab_result: 'Laboratory Diagnostic Result',
    document: 'Clinical Document',
  };

  return (
    <WorkspaceShell
      requiredRole="patient"
      title="Medical Records"
      subtitle="Structured clinical diagnoses, visit history, lab reports, and uploaded documents"
      actions={
        <Link href="/patient/prescriptions">
          <Button variant="outline" size="sm" leftIcon={<Pill className="h-4 w-4" />}>
            View Prescriptions
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Category Filter Tabs */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: 'All Records', icon: FileText },
              { id: 'diagnosis', label: 'Diagnoses', icon: Activity },
              { id: 'visit_summary', label: 'Visit History', icon: Stethoscope },
              { id: 'lab_result', label: 'Lab Results', icon: FlaskConical },
              { id: 'document', label: 'Documents', icon: FileCheck2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-36 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No records in this category"
            description="Clinical records from your completed MedClux consultations and diagnostic bookings will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((rec) => (
              <article
                key={rec.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="brand">{categoryLabels[rec.category]}</Badge>
                    <span className="text-xs text-slate-500">{formatDate(rec.date)}</span>
                    <Badge variant="success">Verified Final</Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{rec.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">{rec.summary}</p>
                  <p className="text-xs text-slate-500 pt-1">
                    Attending: <strong className="text-slate-800">{rec.doctorName}</strong> (
                    {rec.doctorSpecialty}) • {rec.facilityName}
                  </p>
                </div>

                <div className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRecord(rec)}
                  >
                    View Clinical Report
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Record Detail Modal */}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.title || 'Medical Record'}
        description={
          selectedRecord
            ? `${categoryLabels[selectedRecord.category]} • ${formatDate(selectedRecord.date)}`
            : ''
        }
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-1.5">
              <p>
                <span className="text-slate-500">Clinician:</span>{' '}
                <strong className="text-slate-900">
                  {selectedRecord.doctorName} ({selectedRecord.doctorSpecialty})
                </strong>
              </p>
              <p>
                <span className="text-slate-500">Healthcare Facility:</span>{' '}
                <strong className="text-slate-900">{selectedRecord.facilityName}</strong>
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Clinical Summary
              </h4>
              <p className="text-slate-700 leading-relaxed">{selectedRecord.summary}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Recorded Parameters & Findings
              </h4>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                {Object.entries(selectedRecord.details).map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-4 p-3 bg-white">
                    <span className="font-medium text-slate-600">{key}</span>
                    <strong className="text-slate-900 text-right">{val}</strong>
                  </div>
                ))}
              </div>
            </div>

            {selectedRecord.attachmentFileName && (
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3 flex items-center justify-between">
                <span className="text-xs font-medium text-brand-900">
                  Attached File: {selectedRecord.attachmentFileName}
                </span>
                <Badge variant="brand">PDF Vault</Badge>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSelectedRecord(null)}>
                Close Report
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </WorkspaceShell>
  );
}
