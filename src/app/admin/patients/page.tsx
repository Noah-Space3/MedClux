'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Badge } from '@/components/ui';
import { adminService } from '@/services/api';
import { Patient } from '@/types/domain';
import { formatDate } from '@/lib/utils';

export default function AdminPatientsPage() {
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['adminPatients'],
    queryFn: () => adminService.getAllPatients(),
  });

  return (
    <WorkspaceShell
      requiredRole="admin"
      title="Patients Directory"
      subtitle="Registered patient accounts and HMO membership status"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <Table<Patient>
          rowKey="id"
          loading={isLoading}
          dataSource={patients}
          scroll={{ x: 750 }}
          columns={[
            {
              title: 'Patient Name',
              key: 'name',
              render: (_, p) => (
                <div>
                  <strong className="text-slate-900 block">{p.fullName}</strong>
                  <span className="text-xs text-slate-500">{p.email}</span>
                </div>
              ),
            },
            {
              title: 'Phone',
              dataIndex: 'phone',
              key: 'phone',
            },
            {
              title: 'Location',
              key: 'loc',
              render: (_, p) => `${p.city}, ${p.state}`,
            },
            {
              title: 'Blood / Genotype',
              key: 'bio',
              render: (_, p) => `${p.bloodGroup || 'O+'} / ${p.genotype || 'AA'}`,
            },
            {
              title: 'HMO Coverage',
              key: 'hmo',
              render: (_, p) =>
                p.activePlanEnrollmentId ? (
                  <Badge variant="success">Active HMO Member</Badge>
                ) : (
                  <Badge variant="default">Out-of-Pocket</Badge>
                ),
            },
            {
              title: 'Joined',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (d: string) => formatDate(d),
            },
          ]}
        />
      </div>
    </WorkspaceShell>
  );
}
