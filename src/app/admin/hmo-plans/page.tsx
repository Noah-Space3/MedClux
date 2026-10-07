'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Badge } from '@/components/ui';
import { healthPlanService } from '@/services/api';
import { HealthPlan } from '@/types/domain';
import { formatNaira } from '@/lib/utils';

export default function AdminHmoPlansPage() {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['healthPlans'],
    queryFn: () => healthPlanService.getPlans(),
  });

  return (
    <WorkspaceShell
      requiredRole="admin"
      title="Fictional HMO Plans Catalog"
      subtitle="Manage HMO coverage tiers, pricing in Naira (₦), and dependant limits"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <Table<HealthPlan>
          rowKey="id"
          loading={isLoading}
          dataSource={plans}
          scroll={{ x: 780 }}
          pagination={false}
          columns={[
            {
              title: 'Plan Name',
              key: 'name',
              render: (_, p) => (
                <div>
                  <strong className="text-slate-900 block">{p.name}</strong>
                  <span className="text-xs text-slate-500">{p.providerName}</span>
                </div>
              ),
            },
            {
              title: 'Tier',
              dataIndex: 'tier',
              key: 'tier',
              render: (t: string) => <Badge variant="brand">{t}</Badge>,
            },
            {
              title: 'Monthly Premium',
              dataIndex: 'monthlyPrice',
              key: 'monthly',
              render: (v: number) => formatNaira(v),
            },
            {
              title: 'Annual Premium',
              dataIndex: 'annualPrice',
              key: 'annual',
              render: (v: number) => <strong>{formatNaira(v)}</strong>,
            },
            {
              title: 'Annual Coverage Cap',
              dataIndex: 'annualCoverageLimit',
              key: 'cap',
              render: (v: number) => formatNaira(v),
            },
            {
              title: 'Max Dependants',
              dataIndex: 'maxDependants',
              key: 'deps',
              render: (v: number) => `${v} dependants`,
            },
            {
              title: 'Hospital Access',
              dataIndex: 'hospitalNetworkTier',
              key: 'net',
            },
          ]}
        />
      </div>
    </WorkspaceShell>
  );
}
