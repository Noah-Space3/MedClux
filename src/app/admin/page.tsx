'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd';
import { CheckSquare, ShieldAlert } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import {
  AppointmentStatusBadge,
  Button,
  PaymentStatusBadge,
  Skeleton,
} from '@/components/ui';
import { adminService } from '@/services/api';
import { Appointment, Transaction } from '@/types/domain';
import { formatDate, formatNaira, formatTime12h } from '@/lib/utils';

export default function AdminOverviewPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['adminMetrics'],
    queryFn: () => adminService.getOverviewMetrics(),
  });

  return (
    <WorkspaceShell
      requiredRole="admin"
      title="Platform Governance Overview"
      subtitle="Clinical operations, MDCN doctor verification queue, and platform activity ledger"
      actions={
        <Link href="/admin/verification">
          <Button variant="primary" size="sm" leftIcon={<CheckSquare className="h-4 w-4" />}>
            Review Verification Queue ({metrics?.pendingDoctors ?? 0})
          </Button>
        </Link>
      }
    >
      {isLoading || !metrics ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Skeleton key={n} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Operational KPI Row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <span className="text-xs text-slate-500 block">Verified Doctors</span>
              <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                {metrics.verifiedDoctors}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / {metrics.totalDoctors}
                </span>
              </strong>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-card">
              <span className="text-xs text-amber-800 block">Pending MDCN Review</span>
              <strong className="text-2xl font-bold text-amber-700 mt-1 block">
                {metrics.pendingDoctors}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <span className="text-xs text-slate-500 block">Registered Patients</span>
              <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                {metrics.totalPatients}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <span className="text-xs text-slate-500 block">Total Appointments</span>
              <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                {metrics.totalAppointments}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <span className="text-xs text-slate-500 block">Active HMO Policies</span>
              <strong className="text-2xl font-bold text-brand-700 mt-1 block">
                {metrics.activeEnrollments}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <span className="text-xs text-slate-500 block">Platform Gross Volume</span>
              <strong className="text-lg font-bold text-slate-900 mt-1.5 block">
                {formatNaira(metrics.totalRevenue)}
              </strong>
            </div>
          </div>

          {metrics.pendingDoctors > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-amber-950">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                <span>
                  <strong>{metrics.pendingDoctors} doctor account(s)</strong> are awaiting MDCN
                  practicing license verification before appearing in public patient search.
                </span>
              </div>
              <Link href="/admin/verification">
                <Button variant="primary" size="sm">
                  Open Verification Queue
                </Button>
              </Link>
            </div>
          )}

          {/* Recent Appointments Audit Table (Ant Design Table) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recent Platform Appointments
                </h2>
                <p className="text-xs text-slate-500">
                  Live consultation bookings across all partner facilities
                </p>
              </div>
              <Link
                href="/admin/appointments"
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                View Full Ledger →
              </Link>
            </div>

            <Table<Appointment>
              rowKey="id"
              dataSource={metrics.recentAppointments}
              pagination={false}
              scroll={{ x: 720 }}
              size="small"
              columns={[
                {
                  title: 'Reference',
                  dataIndex: 'bookingReference',
                  key: 'ref',
                  render: (val: string) => (
                    <span className="font-mono text-xs font-semibold text-slate-900">{val}</span>
                  ),
                },
                {
                  title: 'Patient',
                  dataIndex: 'patientName',
                  key: 'patient',
                  render: (val: string, record) => (
                    <div>
                      <span className="font-medium text-slate-900 block">{val}</span>
                      {record.forDependantName && (
                        <span className="text-[11px] text-slate-500">
                          Dependant: {record.forDependantName}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Doctor & Specialty',
                  key: 'doctor',
                  render: (_, record) => (
                    <div>
                      <span className="font-medium text-slate-900 block">
                        {record.doctorTitle} {record.doctorName}
                      </span>
                      <span className="text-xs text-brand-700">{record.doctorSpecialty}</span>
                    </div>
                  ),
                },
                {
                  title: 'Date & Time',
                  key: 'datetime',
                  render: (_, record) => (
                    <span className="text-xs text-slate-700">
                      {formatDate(record.date)} • {formatTime12h(record.startTime)}
                    </span>
                  ),
                },
                {
                  title: 'Fee',
                  dataIndex: 'copayAmount',
                  key: 'fee',
                  render: (val: number) => (
                    <span className="font-semibold text-slate-900">{formatNaira(val)}</span>
                  ),
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: Appointment['status']) => (
                    <AppointmentStatusBadge status={status} />
                  ),
                },
              ]}
            />
          </section>

          {/* Recent Transactions Table */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Payment Transactions</h2>
                <p className="text-xs text-slate-500">
                  Consultations, HMO subscriptions, and diagnostic bookings
                </p>
              </div>
              <Link
                href="/admin/payments"
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                All Payments →
              </Link>
            </div>

            <Table<Transaction>
              rowKey="id"
              dataSource={metrics.recentTransactions}
              pagination={false}
              scroll={{ x: 680 }}
              size="small"
              columns={[
                {
                  title: 'Reference',
                  dataIndex: 'reference',
                  key: 'reference',
                  render: (val: string) => (
                    <span className="font-mono text-xs font-semibold text-slate-900">{val}</span>
                  ),
                },
                {
                  title: 'Patient',
                  dataIndex: 'patientName',
                  key: 'patientName',
                },
                {
                  title: 'Description',
                  dataIndex: 'title',
                  key: 'title',
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (val: number) => (
                    <strong className="text-slate-900">{formatNaira(val)}</strong>
                  ),
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (st: Transaction['status']) => <PaymentStatusBadge status={st} />,
                },
              ]}
            />
          </section>
        </div>
      )}
    </WorkspaceShell>
  );
}
