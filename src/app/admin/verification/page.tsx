'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table } from 'antd';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Button, Modal, Textarea, VerificationBadge } from '@/components/ui';
import { adminService } from '@/services/api';
import { useToast } from '@/providers/ToastProvider';
import { Doctor, DoctorVerificationStatus } from '@/types/domain';
import { formatNaira } from '@/lib/utils';

export default function AdminVerificationQueuePage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['adminDoctors'],
    queryFn: () => adminService.getAllDoctors(),
  });

  const handleDecision = async (doc: Doctor, status: DoctorVerificationStatus) => {
    setUpdating(true);
    try {
      await adminService.updateDoctorVerification(
        doc.id,
        status,
        note.trim() || `Marked ${status} by Clinical Operations.`
      );
      queryClient.invalidateQueries({ queryKey: ['adminDoctors'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      showToast({
        title: `Doctor ${status.toUpperCase()}`,
        description: `${doc.title} ${doc.fullName} (${doc.mdcnNumber}) is now ${status}.`,
        variant: status === 'verified' ? 'success' : 'warning',
      });
      setSelectedDoctor(null);
      setNote('');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <WorkspaceShell
      requiredRole="admin"
      title="MDCN Doctor Credential Verification"
      subtitle="Review medical qualifications, MDCN license numbers, and approve or suspend specialist accounts"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <Table<Doctor>
          rowKey="id"
          loading={isLoading}
          dataSource={doctors}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: 'Doctor',
              key: 'name',
              render: (_, doc) => (
                <div>
                  <strong className="text-slate-900 block">
                    {doc.title} {doc.fullName}
                  </strong>
                  <span className="text-xs text-slate-500">{doc.email}</span>
                </div>
              ),
            },
            {
              title: 'MDCN Folio',
              dataIndex: 'mdcnNumber',
              key: 'mdcn',
              render: (val: string) => (
                <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-1 rounded">
                  {val}
                </span>
              ),
            },
            {
              title: 'Specialty & Qualifications',
              key: 'spec',
              render: (_, doc) => (
                <div>
                  <span className="font-semibold text-brand-700 block">{doc.specialtyName}</span>
                  <span className="text-xs text-slate-500">{doc.qualifications.join(', ')}</span>
                </div>
              ),
            },
            {
              title: 'Consultation Fee',
              dataIndex: 'consultationFee',
              key: 'fee',
              render: (val: number) => formatNaira(val),
            },
            {
              title: 'Verification Status',
              dataIndex: 'verificationStatus',
              key: 'status',
              render: (st: DoctorVerificationStatus) => <VerificationBadge status={st} />,
            },
            {
              title: 'Governance Actions',
              key: 'actions',
              align: 'right',
              render: (_, doc) => (
                <div className="flex items-center justify-end gap-2">
                  {doc.verificationStatus !== 'verified' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDecision(doc, 'verified')}
                      leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    >
                      Verify
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setNote(doc.verificationNote || '');
                    }}
                  >
                    Review / Suspend
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        isOpen={Boolean(selectedDoctor)}
        onClose={() => setSelectedDoctor(null)}
        title={
          selectedDoctor
            ? `Credential Review: ${selectedDoctor.title} ${selectedDoctor.fullName}`
            : 'Review Doctor'
        }
        description={selectedDoctor ? `MDCN Folio: ${selectedDoctor.mdcnNumber}` : ''}
      >
        {selectedDoctor && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-1.5">
              <p>
                <span className="text-slate-500">Specialty:</span>{' '}
                <strong>{selectedDoctor.specialtyName}</strong>
              </p>
              <p>
                <span className="text-slate-500">Qualifications:</span>{' '}
                <strong>{selectedDoctor.qualifications.join(' • ')}</strong>
              </p>
              <p>
                <span className="text-slate-500">Hospital Affiliation:</span>{' '}
                <strong>
                  {selectedDoctor.facilityName} ({selectedDoctor.city})
                </strong>
              </p>
            </div>

            <Textarea
              label="Clinical Governance Audit Note"
              rows={3}
              placeholder="Enter verification note or suspension reason..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button
                variant="danger"
                size="sm"
                isLoading={updating}
                onClick={() => handleDecision(selectedDoctor, 'suspended')}
                leftIcon={<ShieldAlert className="h-3.5 w-3.5" />}
              >
                Suspend Account
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={updating}
                onClick={() => handleDecision(selectedDoctor, 'verified')}
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              >
                Approve & Verify MDCN
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </WorkspaceShell>
  );
}
