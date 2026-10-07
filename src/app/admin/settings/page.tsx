'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Badge, Button } from '@/components/ui';
import { adminService } from '@/services/api';
import { useToast } from '@/providers/ToastProvider';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await adminService.resetDemoDatabase();
      queryClient.invalidateQueries();
      showToast({
        title: 'MedClux Seed State Restored',
        description: 'All demo appointments, HMO enrollments, and verifications have been reset.',
        variant: 'success',
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <WorkspaceShell
      requiredRole="admin"
      title="Platform Configuration & Demo Controls"
      subtitle="Manage MedClux service environment settings and reset portfolio seed data"
    >
      <div className="max-w-3xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Service Layer & Mock Persistence Engine
              </h2>
              <p className="text-xs text-slate-500">
                UI → Domain Service Interfaces → Stateful LocalStorage Adapter (medclux_store_v1)
              </p>
            </div>
            <Badge variant="brand" icon={<ShieldCheck className="h-3.5 w-3.5 text-brand-600" />}>
              Backend-Ready
            </Badge>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            All actions taken across the Patient, Doctor, and Admin portals persist in your browser
            storage so you can test end-to-end flows (such as booking an appointment as a patient,
            accepting it as a doctor, and auditing it as an admin). You can restore the initial
            seed data at any time below.
          </p>

          <div className="pt-2">
            <Button
              variant="outline"
              isLoading={resetting}
              onClick={handleReset}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Reset All Demo Data to Factory Seed
            </Button>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
