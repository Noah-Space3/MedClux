'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, FileText, Printer, ShieldCheck } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  PaymentStatusBadge,
  Skeleton,
} from '@/components/ui';
import { paymentService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { Transaction } from '@/types/domain';
import { formatDate, formatNaira } from '@/lib/utils';

export default function PatientPaymentsPage() {
  const { user } = useAuth();
  const patientId = user?.id || 'pat-1';
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', patientId],
    queryFn: () => paymentService.getTransactions(patientId),
  });

  const totalPaid = transactions
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <WorkspaceShell
      requiredRole="patient"
      title="Payments & Billing History"
      subtitle="View consultation payments, HMO subscription receipts, and diagnostic lab invoices"
    >
      <div className="space-y-6">
        {/* Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <span className="text-xs text-slate-500 block">Total Settled (Mock Gateway)</span>
            <strong className="text-2xl font-bold text-slate-900 mt-1 block">
              {formatNaira(totalPaid)}
            </strong>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <span className="text-xs text-slate-500 block">Transactions Recorded</span>
            <strong className="text-2xl font-bold text-slate-900 mt-1 block">
              {transactions.length}
            </strong>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <span className="text-xs text-slate-500 block">Payment Gateway Mode</span>
            <strong className="text-sm font-bold text-brand-700 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Paystack-Ready Mock Service
            </strong>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-14 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="No payment transactions yet"
              description="Invoices and receipts for your consultations, HMO plans, and lab bookings will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="p-4 font-semibold">Reference / Date</th>
                    <th className="p-4 font-semibold">Description</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Method</th>
                    <th className="p-4 font-semibold">Amount</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="p-4">
                        <span className="font-mono font-semibold text-slate-900 block">
                          {tx.reference}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(tx.createdAt)}</span>
                      </td>
                      <td className="p-4">
                        <strong className="text-slate-900 block">{tx.title}</strong>
                        <span className="text-xs text-slate-500">{tx.description}</span>
                      </td>
                      <td className="p-4 capitalize">
                        <Badge variant="default">{tx.category.replace('_', ' ')}</Badge>
                      </td>
                      <td className="p-4 text-slate-600">{tx.method}</td>
                      <td className="p-4 font-bold text-slate-900">
                        {formatNaira(tx.amount)}
                      </td>
                      <td className="p-4">
                        <PaymentStatusBadge status={tx.status} />
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTx(tx)}
                          leftIcon={<FileText className="h-3.5 w-3.5" />}
                        >
                          Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Official Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        title="MedClux Official Payment Receipt"
        description={selectedTx ? `Receipt No: ${selectedTx.receiptNumber}` : ''}
      >
        {selectedTx && (
          <div className="space-y-5 text-xs sm:text-sm">
            <div className="rounded-xl bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                  Amount Settled (Mock Mode)
                </span>
                <strong className="text-2xl font-bold text-white">
                  {formatNaira(selectedTx.amount)}
                </strong>
              </div>
              <PaymentStatusBadge status={selectedTx.status} />
            </div>

            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Reference</span>
                <strong className="font-mono text-slate-900">{selectedTx.reference}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Billed Patient</span>
                <strong className="text-slate-900">{selectedTx.patientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel</span>
                <strong className="text-slate-900">
                  {selectedTx.method} ({selectedTx.provider})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date Issued</span>
                <strong className="text-slate-900">{formatDate(selectedTx.createdAt)}</strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Itemized Breakdown
              </h4>
              <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-200">
                {selectedTx.breakdown.map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-slate-700">{item.label}</span>
                    <strong className="text-slate-900">
                      {item.amount < 0
                        ? `-${formatNaira(Math.abs(item.amount))}`
                        : formatNaira(item.amount)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="h-3.5 w-3.5" />}
              >
                Print Receipt
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedTx(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </WorkspaceShell>
  );
}
