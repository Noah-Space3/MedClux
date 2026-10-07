'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd';
import { Search } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Button, VerificationBadge } from '@/components/ui';
import { adminService } from '@/services/api';
import { Doctor } from '@/types/domain';
import { formatNaira } from '@/lib/utils';

export default function AdminDoctorsDirectoryPage() {
  const [query, setQuery] = useState('');
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['adminDoctors'],
    queryFn: () => adminService.getAllDoctors(),
  });

  const filtered = doctors.filter(
    (d) =>
      d.fullName.toLowerCase().includes(query.toLowerCase()) ||
      d.specialtyName.toLowerCase().includes(query.toLowerCase()) ||
      d.mdcnNumber.toLowerCase().includes(query.toLowerCase()) ||
      d.city.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <WorkspaceShell
      requiredRole="admin"
      title="Doctors Directory"
      subtitle="Search, filter, and audit all registered specialists on MedClux"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              aria-label="Search doctors"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, MDCN number, specialty, or city..."
              className="h-9 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-xs sm:text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>
          <Link href="/admin/verification">
            <Button variant="outline" size="sm">
              Go to Verification Queue
            </Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <Table<Doctor>
            rowKey="id"
            loading={isLoading}
            dataSource={filtered}
            scroll={{ x: 800 }}
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: 'Specialist',
                key: 'name',
                render: (_, doc) => (
                  <div>
                    <strong className="text-slate-900 block">
                      {doc.title} {doc.fullName}
                    </strong>
                    <span className="text-xs text-slate-500">{doc.mdcnNumber}</span>
                  </div>
                ),
              },
              {
                title: 'Specialty',
                dataIndex: 'specialtyName',
                key: 'spec',
              },
              {
                title: 'Facility & Location',
                key: 'loc',
                render: (_, doc) => (
                  <div>
                    <span className="text-slate-900 block text-xs font-medium">
                      {doc.facilityName}
                    </span>
                    <span className="text-xs text-slate-500">{doc.city}</span>
                  </div>
                ),
              },
              {
                title: 'Experience',
                dataIndex: 'yearsOfExperience',
                key: 'exp',
                render: (yrs: number) => `${yrs} yrs`,
              },
              {
                title: 'Consultation Fee',
                dataIndex: 'consultationFee',
                key: 'fee',
                render: (fee: number) => formatNaira(fee),
              },
              {
                title: 'Status',
                dataIndex: 'verificationStatus',
                key: 'status',
                render: (st: Doctor['verificationStatus']) => <VerificationBadge status={st} />,
              },
            ]}
          />
        </div>
      </div>
    </WorkspaceShell>
  );
}
