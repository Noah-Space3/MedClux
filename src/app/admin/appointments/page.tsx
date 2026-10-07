'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { AppointmentStatusBadge, Badge } from '@/components/ui';
import { appointmentService } from '@/services/api';
import { Appointment, AppointmentStatus } from '@/types/domain';
import { formatDate, formatNaira, formatTime12h } from '@/lib/utils';

export default function AdminAppointmentsPage() {
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all');
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['adminAppointments', status],
    queryFn: () => appointmentService.getAppointments({ status }),
  });

  return (
    <WorkspaceShell
      requiredRole="admin"
      title="Master Appointments Ledger"
      subtitle="Platform-wide consultation bookings and status audit"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'confirmed', 'pending', 'completed', 'rescheduled', 'cancelled'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize ${
                  status === st
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <Table<Appointment>
            rowKey="id"
            loading={isLoading}
            dataSource={appointments}
            scroll={{ x: 820 }}
            columns={[
              {
                title: 'Ref',
                dataIndex: 'bookingReference',
                key: 'ref',
                render: (v: string) => <span className="font-mono text-xs font-semibold">{v}</span>,
              },
              {
                title: 'Patient',
                dataIndex: 'patientName',
                key: 'patient',
              },
              {
                title: 'Doctor',
                key: 'doc',
                render: (_, r) => `${r.doctorTitle} ${r.doctorName} (${r.doctorSpecialty})`,
              },
              {
                title: 'Schedule',
                key: 'sched',
                render: (_, r) => `${formatDate(r.date)} • ${formatTime12h(r.startTime)}`,
              },
              {
                title: 'Type',
                dataIndex: 'consultationType',
                key: 'type',
                render: (t: string) => (
                  <Badge variant="default" className="capitalize">
                    {t.replace('_', ' ')}
                  </Badge>
                ),
              },
              {
                title: 'Co-Pay / Fee',
                dataIndex: 'copayAmount',
                key: 'fee',
                render: (v: number) => formatNaira(v),
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (st: AppointmentStatus) => <AppointmentStatusBadge status={st} />,
              },
            ]}
          />
        </div>
      </div>
    </WorkspaceShell>
  );
}
