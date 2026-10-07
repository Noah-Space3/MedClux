'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Badge, PaymentStatusBadge } from '@/components/ui';
import { paymentService } from '@/services/api';
import { Transaction } from '@/types/domain';
import { formatDate, formatNaira } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['adminTransactions'],
    queryFn: () => paymentService.getTransactions(),
  });

  return (
    <WorkspaceShell
      requiredRole="admin"
      title="Platform Payments & Revenue Ledger"
      subtitle="Audit consultation fees, HMO subscription settlements, and diagnostic lab payments"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <Table<Transaction>
          rowKey="id"
          loading={isLoading}
          dataSource={transactions}
          scroll={{ x: 780 }}
          columns={[
            {
              title: 'Reference',
              dataIndex: 'reference',
              key: 'ref',
              render: (v: string) => <span className="font-mono text-xs font-semibold">{v}</span>,
            },
            {
              title: 'Receipt No.',
              dataIndex: 'receiptNumber',
              key: 'rcp',
              render: (v: string) => <span className="font-mono text-xs text-slate-500">{v}</span>,
            },
            {
              title: 'Patient',
              dataIndex: 'patientName',
              key: 'patient',
            },
            {
              title: 'Category',
              dataIndex: 'category',
              key: 'cat',
              render: (c: string) => (
                <Badge variant="default" className="capitalize">
                  {c.replace('_', ' ')}
                </Badge>
              ),
            },
            {
              title: 'Method',
              dataIndex: 'method',
              key: 'method',
            },
            {
              title: 'Amount',
              dataIndex: 'amount',
              key: 'amount',
              render: (v: number) => <strong>{formatNaira(v)}</strong>,
            },
            {
              title: 'Date',
              dataIndex: 'createdAt',
              key: 'date',
              render: (d: string) => formatDate(d),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (st: Transaction['status']) => <PaymentStatusBadge status={st} />,
            },
          ]}
        />
      </div>
    </WorkspaceShell>
  );
}
