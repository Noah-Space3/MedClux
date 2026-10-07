'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Badge } from '@/components/ui';
import { facilityService } from '@/services/api';
import { Facility } from '@/types/domain';

export default function AdminFacilitiesPage() {
  const { data: facilities = [], isLoading } = useQuery({
    queryKey: ['facilities', 'admin'],
    queryFn: () => facilityService.getFacilities(),
  });

  return (
    <WorkspaceShell
      requiredRole="admin"
      title="Healthcare Facilities Network"
      subtitle="Manage accredited partner hospitals, clinics, diagnostic centers, and pharmacies"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <Table<Facility>
          rowKey="id"
          loading={isLoading}
          dataSource={facilities}
          scroll={{ x: 780 }}
          columns={[
            {
              title: 'Facility Name',
              key: 'name',
              render: (_, f) => (
                <div>
                  <strong className="text-slate-900 block">{f.name}</strong>
                  <span className="text-xs text-slate-500">{f.address}</span>
                </div>
              ),
            },
            {
              title: 'Type',
              dataIndex: 'type',
              key: 'type',
              render: (t: string) => (
                <Badge variant="brand" className="uppercase">
                  {t.replace('_', ' ')}
                </Badge>
              ),
            },
            {
              title: 'State',
              dataIndex: 'state',
              key: 'state',
            },
            {
              title: 'Network Tier',
              dataIndex: 'networkTier',
              key: 'tier',
            },
            {
              title: '24/7 Emergency',
              key: 'emg',
              render: (_, f) =>
                f.hasEmergencyUnit ? (
                  <Badge variant="danger">24/7 Emergency</Badge>
                ) : (
                  <Badge variant="default">Standard Hours</Badge>
                ),
            },
            {
              title: 'Phone',
              dataIndex: 'phone',
              key: 'phone',
            },
          ]}
        />
      </div>
    </WorkspaceShell>
  );
}
