'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { AppointmentCard } from '@/components/domain/cards';
import { Button, EmptyState, Modal, Skeleton, Textarea } from '@/components/ui';
import { appointmentService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Appointment, AppointmentStatus } from '@/types/domain';

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const doctorId = user?.role === 'doctor' ? user.id : 'doc-1';

  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', { doctorId, statusFilter }],
    queryFn: () =>
      appointmentService.getAppointments({
        doctorId,
        status: statusFilter,
      }),
  });

  const handleAction = async (
    apt: Appointment,
    action: 'confirmed' | 'completed' | 'cancelled'
  ) => {
    if (action === 'completed') {
      setCompletingApt(apt);
      setClinicalNotes(
        apt.clinicalNotes ||
          'Patient examined. Vital signs stable. Medication regimen and follow-up plan discussed.'
      );
      return;
    }

    await appointmentService.updateAppointmentStatusByDoctor(apt.id, action);
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    showToast({
      title: `Appointment ${action}`,
      description: `${apt.patientName} (${apt.bookingReference}) updated.`,
      variant: 'info',
    });
  };

  const handleSaveCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingApt) return;
    setSaving(true);
    try {
      await appointmentService.updateAppointmentStatusByDoctor(
        completingApt.id,
        'completed',
        clinicalNotes.trim()
      );
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      showToast({
        title: 'Consultation marked completed',
        description: 'Clinical notes saved to appointment record.',
        variant: 'success',
      });
      setCompletingApt(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceShell
      requiredRole="doctor"
      title="Clinic Appointments Queue"
      subtitle="Accept booking requests, record clinical consultation notes, and manage schedule status"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: 'All Appointments' },
              { id: 'pending', label: 'Pending Requests' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold ${
                statusFilter === tab.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : appointments.length === 0 ? (
          <EmptyState
            title="No appointments in this queue"
            description="Patient consultations matching this status filter will appear here."
          />
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                perspective="doctor"
                onDoctorAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(completingApt)}
        onClose={() => setCompletingApt(null)}
        title="Complete Consultation & Log Clinical Notes"
        description={
          completingApt
            ? `Patient: ${completingApt.patientName} (${completingApt.bookingReference})`
            : ''
        }
      >
        <form onSubmit={handleSaveCompletion} className="space-y-4">
          <Textarea
            label="Clinical Assessment & Follow-up Notes"
            required
            rows={4}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            helperText="Shared with the patient in their appointment summary."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCompletingApt(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Save Notes & Complete
            </Button>
          </div>
        </form>
      </Modal>
    </WorkspaceShell>
  );
}
