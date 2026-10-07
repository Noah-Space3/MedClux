'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Stethoscope } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { AppointmentCard } from '@/components/domain/cards';
import {
  AppointmentStatusBadge,
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { appointmentService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Appointment, AppointmentStatus } from '@/types/domain';
import { formatDate, formatNaira, formatTime12h } from '@/lib/utils';

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const patientId = user?.id || 'pat-1';

  const [tab, setTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [query, setQuery] = useState('');

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('2026-10-07');
  const [newTime, setNewTime] = useState('10:00');
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [mutating, setMutating] = useState(false);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', { patientId, statusFilter, query }],
    queryFn: () =>
      appointmentService.getAppointments({
        patientId,
        status: statusFilter,
        query,
      }),
  });

  const filteredAppointments = appointments.filter((a) => {
    if (tab === 'upcoming') {
      return a.status === 'confirmed' || a.status === 'pending' || a.status === 'rescheduled';
    }
    if (tab === 'completed') return a.status === 'completed';
    if (tab === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setMutating(true);
    try {
      await appointmentService.rescheduleAppointment(rescheduleTarget.id, newDate, newTime);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast({
        title: 'Appointment Rescheduled',
        description: `Moved to ${formatDate(newDate)} at ${formatTime12h(newTime)}.`,
        variant: 'success',
      });
      setRescheduleTarget(null);
    } catch (err) {
      showToast({
        title: 'Reschedule failed',
        description: err instanceof Error ? err.message : 'Unable to reschedule.',
        variant: 'error',
      });
    } finally {
      setMutating(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;
    setMutating(true);
    try {
      await appointmentService.cancelAppointment(
        cancelTarget.id,
        cancelReason.trim() || 'Cancelled by patient'
      );
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast({
        title: 'Appointment Cancelled',
        description: `Booking ${cancelTarget.bookingReference} has been cancelled.`,
        variant: 'info',
      });
      setCancelTarget(null);
      setCancelReason('');
    } catch (err) {
      showToast({
        title: 'Cancellation failed',
        description: err instanceof Error ? err.message : 'Unable to cancel appointment.',
        variant: 'error',
      });
    } finally {
      setMutating(false);
    }
  };

  return (
    <WorkspaceShell
      requiredRole="patient"
      title="My Appointments"
      subtitle="View, reschedule, or manage your scheduled and past consultations"
      actions={
        <Link href="/doctors">
          <Button variant="primary" size="sm" leftIcon={<Stethoscope className="h-4 w-4" />}>
            Book Appointment
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Tabs + Search & Status Filter */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap gap-1.5" role="tablist">
              {(
                [
                  { id: 'all', label: 'All Appointments' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'cancelled', label: 'Cancelled' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                    tab === t.id
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  aria-label="Search appointments"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Doctor, reference, specialty..."
                  className="h-9 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-xs sm:text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>

              <select
                aria-label="Filter by appointment status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'all')}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-40 w-full" />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              title="No matching appointments found"
              description="You do not have any appointments matching the selected tab or search filter."
              actionLabel="Book a Consultation"
              onAction={() => {
                window.location.href = '/doctors';
              }}
            />
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  perspective="patient"
                  onViewDetails={(item) => setSelectedAppointment(item)}
                  onReschedule={(item) => {
                    setRescheduleTarget(item);
                    setNewDate(item.date);
                    setNewTime(item.startTime);
                  }}
                  onCancel={(item) => setCancelTarget(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Appointment Details Modal */}
      <Modal
        isOpen={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Summary & Clinical Details"
        description={
          selectedAppointment ? `Booking Reference: ${selectedAppointment.bookingReference}` : ''
        }
      >
        {selectedAppointment && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedAppointment.doctorTitle} {selectedAppointment.doctorName}
                </h3>
                <p className="text-brand-700 font-medium">
                  {selectedAppointment.doctorSpecialty}
                </p>
              </div>
              <AppointmentStatusBadge status={selectedAppointment.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div>
                <span className="text-xs text-slate-500 block">Patient</span>
                <strong className="text-slate-900">
                  {selectedAppointment.forDependantName || selectedAppointment.patientName}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Date & Time</span>
                <strong className="text-slate-900">
                  {formatDate(selectedAppointment.date)} •{' '}
                  {formatTime12h(selectedAppointment.startTime)}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Consultation Mode</span>
                <strong className="text-slate-900 capitalize">
                  {selectedAppointment.consultationType.replace('_', ' ')}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Fee / Co-pay</span>
                <strong className="text-slate-900">
                  {formatNaira(selectedAppointment.copayAmount)}
                </strong>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-500 block">Facility / Video Link</span>
                <strong className="text-slate-900">
                  {selectedAppointment.consultationType === 'video'
                    ? selectedAppointment.meetingLink || 'https://meet.medclux.demo/room'
                    : `${selectedAppointment.facilityName} (${selectedAppointment.facilityAddress})`}
                </strong>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Reason for Visit
              </span>
              <p className="rounded-lg border border-slate-200 p-3 text-slate-700">
                {selectedAppointment.reasonForVisit}
              </p>
            </div>

            {selectedAppointment.clinicalNotes && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 block mb-1">
                  Doctor’s Clinical Summary
                </span>
                <p className="rounded-lg border border-brand-200 bg-brand-50/50 p-3 text-slate-800">
                  {selectedAppointment.clinicalNotes}
                </p>
              </div>
            )}

            {selectedAppointment.cancellationReason && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-red-700 block mb-1">
                  Cancellation Note
                </span>
                <p className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-red-900">
                  {selectedAppointment.cancellationReason}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              {(selectedAppointment.status === 'confirmed' ||
                selectedAppointment.status === 'pending' ||
                selectedAppointment.status === 'rescheduled') && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const target = selectedAppointment;
                      setSelectedAppointment(null);
                      setRescheduleTarget(target);
                    }}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const target = selectedAppointment;
                      setSelectedAppointment(null);
                      setCancelTarget(target);
                    }}
                  >
                    Cancel Appointment
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedAppointment(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Appointment"
        description={
          rescheduleTarget
            ? `Move your consultation with ${rescheduleTarget.doctorTitle} ${rescheduleTarget.doctorName}`
            : ''
        }
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <Input
            label="New Appointment Date"
            type="date"
            min="2026-09-30"
            required
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <Select
            label="New Time Slot (WAT)"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            options={[
              { value: '09:00', label: '09:00 AM' },
              { value: '10:00', label: '10:00 AM' },
              { value: '11:30', label: '11:30 AM' },
              { value: '14:00', label: '02:00 PM' },
              { value: '15:30', label: '03:30 PM' },
            ]}
          />
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>
              Keep Current Slot
            </Button>
            <Button type="submit" variant="primary" isLoading={mutating}>
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Destructive Cancel Confirmation Dialog */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel Appointment?"
        description="This action will release your reserved time slot with the specialist."
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <Textarea
            label="Reason for Cancellation"
            required
            rows={3}
            placeholder="e.g., Schedule conflict, feeling better, or travelling..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Go Back
            </Button>
            <Button type="submit" variant="danger" isLoading={mutating}>
              Yes, Cancel Appointment
            </Button>
          </div>
        </form>
      </Modal>
    </WorkspaceShell>
  );
}
