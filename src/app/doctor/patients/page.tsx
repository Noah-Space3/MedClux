'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Avatar, Badge, EmptyState, Skeleton } from '@/components/ui';
import { adminService, appointmentService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { formatDate } from '@/lib/utils';

export default function DoctorPatientsPage() {
  const { user } = useAuth();
  const doctorId = user?.role === 'doctor' ? user.id : 'doc-1';

  const { data: appointments = [], isLoading: loadingApts } = useQuery({
    queryKey: ['appointments', { doctorId }],
    queryFn: () => appointmentService.getAppointments({ doctorId }),
  });

  const { data: allPatients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['allPatients'],
    queryFn: () => adminService.getAllPatients(),
  });

  const patientIds = new Set(appointments.map((a) => a.patientId));
  const assignedPatients = allPatients.filter((p) => patientIds.has(p.id));

  return (
    <WorkspaceShell
      requiredRole="doctor"
      title="My Patients"
      subtitle="Clinical directory of patients who have scheduled consultations with your practice"
    >
      {loadingApts || loadingPatients ? (
        <Skeleton className="h-64 w-full" />
      ) : assignedPatients.length === 0 ? (
        <EmptyState
          title="No assigned patients yet"
          description="Patients who book consultations with you will appear here with relevant clinical context."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {assignedPatients.map((pat) => {
            const patApts = appointments.filter((a) => a.patientId === pat.id);
            return (
              <div
                key={pat.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-card space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={pat.fullName} size="md" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{pat.fullName}</h3>
                      <p className="text-xs text-slate-500">
                        {pat.gender} • DOB: {formatDate(pat.dateOfBirth)} • {pat.phone}
                      </p>
                    </div>
                  </div>
                  <Badge variant="brand">{patApts.length} visit(s)</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-xs border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Blood Group</span>
                    <strong className="text-slate-900">{pat.bloodGroup || 'O+'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Genotype</span>
                    <strong className="text-slate-900">{pat.genotype || 'AA'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Allergies</span>
                    <strong className="text-red-700">
                      {pat.allergies.join(', ') || 'None'}
                    </strong>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 block mb-1">
                    Latest Consultation Reason:
                  </span>
                  <p className="rounded bg-slate-50 p-2.5 border border-slate-100">
                    {patApts[0]?.reasonForVisit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WorkspaceShell>
  );
}
