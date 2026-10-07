'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Stethoscope,
  Users,
} from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { AppointmentCard } from '@/components/domain/cards';
import {
  Badge,
  Button,
  EmptyState,
  Skeleton,
  VerificationBadge,
} from '@/components/ui';
import { appointmentService, doctorService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Appointment } from '@/types/domain';
import { formatNaira } from '@/lib/utils';

export default function DoctorOverviewPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const doctorId = user?.role === 'doctor' ? user.id : 'doc-1';

  const { data: doctorData, isLoading: loadingDoctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorService.getDoctorById(doctorId),
  });

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['appointments', { doctorId }],
    queryFn: () => appointmentService.getAppointments({ doctorId }),
  });

  const pendingRequests = appointments.filter((a) => a.status === 'pending');
  const confirmedUpcoming = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'rescheduled'
  );
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  const handleDoctorAction = async (
    apt: Appointment,
    action: 'confirmed' | 'completed' | 'cancelled'
  ) => {
    await appointmentService.updateAppointmentStatusByDoctor(
      apt.id,
      action,
      action === 'completed'
        ? 'Consultation completed. Vital signs reviewed and management plan discussed with patient.'
        : undefined
    );
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    showToast({
      title: `Appointment ${action}`,
      description: `${apt.patientName} (${apt.bookingReference}) updated to ${action}.`,
      variant: 'success',
    });
  };

  return (
    <WorkspaceShell
      requiredRole="doctor"
      title={`Dr. ${user?.fullName?.replace(/^Dr\.\s*/i, '') || 'Babatunde Adeyemi'}`}
      subtitle="Manage today’s clinic schedule, patient consultation requests, and availability"
      actions={
        <Link href="/doctor/schedule">
          <Button variant="primary" size="sm" leftIcon={<Clock className="h-4 w-4" />}>
            Configure Schedule
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Practice Summary Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <span className="text-xs text-slate-500 block">Pending Requests</span>
            <strong className="text-2xl font-bold text-amber-600 mt-1 block">
              {pendingRequests.length}
            </strong>
            <span className="text-[11px] text-slate-400">Awaiting confirmation</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <span className="text-xs text-slate-500 block">Confirmed Upcoming</span>
            <strong className="text-2xl font-bold text-brand-700 mt-1 block">
              {confirmedUpcoming.length}
            </strong>
            <span className="text-[11px] text-slate-400">In-person & video</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <span className="text-xs text-slate-500 block">Completed Consultations</span>
            <strong className="text-2xl font-bold text-slate-900 mt-1 block">
              {completedCount}
            </strong>
            <span className="text-[11px] text-slate-400">Clinical notes logged</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <span className="text-xs text-slate-500 block mb-1.5">MDCN Credential Status</span>
            {loadingDoctor || !doctorData ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              <>
                <VerificationBadge status={doctorData.doctor.verificationStatus} />
                <span className="block text-[11px] text-slate-500 mt-1.5">
                  Fee: {formatNaira(doctorData.doctor.consultationFee)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Pending Requests Queue */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Appointment Requests Requiring Action ({pendingRequests.length})</span>
            </h2>
            <Link
              href="/doctor/appointments"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Manage All Appointments →
            </Link>
          </div>

          {loadingAppointments ? (
            <Skeleton className="h-36 w-full" />
          ) : pendingRequests.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs sm:text-sm text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>All patient booking requests have been reviewed.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  perspective="doctor"
                  onDoctorAction={handleDoctorAction}
                />
              ))}
            </div>
          )}
        </section>

        {/* Confirmed Consultations */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-600" />
            <span>Confirmed Consultations ({confirmedUpcoming.length})</span>
          </h2>

          {confirmedUpcoming.length === 0 ? (
            <EmptyState
              title="No confirmed upcoming consultations"
              description="Accepted patient bookings will appear here."
            />
          ) : (
            <div className="space-y-4">
              {confirmedUpcoming.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  perspective="doctor"
                  onDoctorAction={handleDoctorAction}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </WorkspaceShell>
  );
}
