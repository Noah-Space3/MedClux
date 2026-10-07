'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Bell,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  HeartHandshake,
  MapPin,
  PhoneCall,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
  Video,
} from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { DigitalHealthCardView } from '@/components/domain/cards';
import {
  AppointmentStatusBadge,
  Badge,
  Button,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import {
  appointmentService,
  healthPlanService,
  notificationService,
} from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { formatDate, formatNaira, formatTime12h } from '@/lib/utils';

export default function PatientOverviewPage() {
  const { user } = useAuth();
  const patientId = user?.id || 'pat-1';

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['appointments', { patientId }],
    queryFn: () => appointmentService.getAppointments({ patientId }),
  });

  const { data: activePlanData, isLoading: loadingPlan } = useQuery({
    queryKey: ['activePlan', patientId],
    queryFn: () => healthPlanService.getPatientActivePlan(patientId),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', patientId],
    queryFn: () => notificationService.getNotifications(patientId),
  });

  const upcomingAppointments = appointments
    .filter(
      (a) =>
        a.status === 'confirmed' ||
        a.status === 'pending' ||
        a.status === 'rescheduled'
    )
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));

  const nextAppointment = upcomingAppointments[0] || null;
  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return (
    <WorkspaceShell
      requiredRole="patient"
      title={`Welcome back, ${user?.fullName?.split(' ')[0] || 'Adaeze'}`}
      subtitle="Manage your upcoming consultations, HMO coverage, and clinical records"
      actions={
        <Link href="/doctors">
          <Button variant="primary" size="sm" leftIcon={<Stethoscope className="h-4 w-4" />}>
            Book New Appointment
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Top Row: Next Appointment + Active Health Plan */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
          {/* Next Upcoming Appointment */}
          <section className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-600" />
                  <h2 className="text-base font-bold text-slate-900">Next Upcoming Appointment</h2>
                </div>
                <Link
                  href="/patient/appointments"
                  className="text-xs font-semibold text-brand-700 hover:underline"
                >
                  View all ({appointments.length})
                </Link>
              </div>

              {loadingAppointments ? (
                <div className="py-6 space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !nextAppointment ? (
                <div className="py-6">
                  <EmptyState
                    title="No upcoming appointments"
                    description="Book an in-person or video consultation with a verified specialist."
                    actionLabel="Find a Doctor"
                    onAction={() => {
                      window.location.href = '/doctors';
                    }}
                  />
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-slate-500">
                        Ref: {nextAppointment.bookingReference}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900">
                        {nextAppointment.doctorTitle} {nextAppointment.doctorName}
                      </h3>
                      <p className="text-sm font-medium text-brand-700">
                        {nextAppointment.doctorSpecialty} • {nextAppointment.facilityName}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={nextAppointment.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-brand-600 shrink-0" />
                      <div>
                        <span className="text-[11px] text-slate-500 block">Date</span>
                        <strong className="text-slate-900">
                          {formatDate(nextAppointment.date)}
                        </strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-brand-600 shrink-0" />
                      <div>
                        <span className="text-[11px] text-slate-500 block">Time (WAT)</span>
                        <strong className="text-slate-900">
                          {formatTime12h(nextAppointment.startTime)}
                        </strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {nextAppointment.consultationType === 'video' ? (
                        <Video className="h-4 w-4 text-sky-600 shrink-0" />
                      ) : (
                        <MapPin className="h-4 w-4 text-brand-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-500 block">Mode</span>
                        <strong className="text-slate-900 truncate block">
                          {nextAppointment.consultationType === 'video'
                            ? 'Video Consult'
                            : 'In-Person Visit'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {nextAppointment && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Reason: <strong className="text-slate-700">{nextAppointment.reasonForVisit}</strong>
                </span>
                <Link href="/patient/appointments">
                  <Button variant="outline" size="sm">
                    Manage Appointment
                  </Button>
                </Link>
              </div>
            )}
          </section>

          {/* Active Health Plan Summary */}
          <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-600" />
                  <h2 className="text-base font-bold text-slate-900">Active HMO Coverage</h2>
                </div>
                <Link
                  href="/patient/health-plans"
                  className="text-xs font-semibold text-brand-700 hover:underline"
                >
                  Digital Card →
                </Link>
              </div>

              {loadingPlan ? (
                <Skeleton className="h-44 w-full mt-4" />
              ) : !activePlanData?.enrollment ? (
                <div className="py-6">
                  <EmptyState
                    title="No active health plan"
                    description="Subscribe to a fictional MedClux HMO plan to unlock 90% consultation co-pay coverage."
                    actionLabel="Explore HMO Plans"
                    onAction={() => {
                      window.location.href = '/health-plans';
                    }}
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl bg-slate-900 text-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-brand-300">
                        {activePlanData.enrollment.memberId}
                      </span>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <h3 className="mt-2 text-lg font-bold">{activePlanData.enrollment.planName}</h3>
                    <p className="text-xs text-slate-300">
                      {activePlanData.enrollment.providerName} •{' '}
                      {activePlanData.enrollment.networkTier}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                      <span>Renews: {formatDate(activePlanData.enrollment.renewalDate)}</span>
                      <span>
                        {activePlanData.enrollment.enrolledDependantIds.length} dependant(s) covered
                      </span>
                    </div>
                  </div>

                  {activePlanData.plan && (
                    <div className="text-xs text-slate-600 space-y-1.5">
                      <p>
                        <strong>Annual Coverage Limit:</strong>{' '}
                        {formatNaira(activePlanData.plan.annualCoverageLimit)}
                      </p>
                      <p>
                        <strong>Specialist Benefit:</strong>{' '}
                        {activePlanData.plan.coveredConsultations}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link href="/patient/health-plans" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  View Digital Health Card
                </Button>
              </Link>
              <Link href="/patient/dependants" className="flex-1">
                <Button variant="ghost" size="sm" className="w-full">
                  Manage Dependants
                </Button>
              </Link>
            </div>
          </section>
        </div>

        {/* Quick Care Actions */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
            Quick Care Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                href: '/doctors',
                label: 'Find Doctors',
                sub: 'Book specialist',
                icon: Stethoscope,
              },
              {
                href: '/patient/lab-tests',
                label: 'Book Lab Test',
                sub: 'Diagnostics & panels',
                icon: FlaskConical,
              },
              {
                href: '/patient/prescriptions',
                label: 'Prescriptions',
                sub: 'Active medications',
                icon: Pill,
              },
              {
                href: '/patient/medical-records',
                label: 'Medical Records',
                sub: 'Lab & visit history',
                icon: FileText,
              },
              {
                href: '/patient/dependants',
                label: 'Dependants',
                sub: 'Family members',
                icon: Users,
              },
              {
                href: '/emergency',
                label: 'Emergency 112',
                sub: '24/7 trauma units',
                icon: PhoneCall,
                urgent: true,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl border p-4 shadow-card transition-all ${
                    item.urgent
                      ? 'border-red-200 bg-red-50/70 hover:bg-red-100/80 text-red-950'
                      : 'border-slate-200 bg-white hover:border-brand-400'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      item.urgent ? 'text-red-600' : 'text-brand-600'
                    }`}
                  />
                  <p className="mt-2.5 text-sm font-bold">{item.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.sub}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Bottom Row: Recent Appointments & Unread Notifications */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Recent Appointments</h2>
              <Link
                href="/patient/appointments"
                className="text-xs font-semibold text-brand-700 hover:underline flex items-center gap-1"
              >
                <span>All Appointments</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {appointments.slice(0, 3).map((apt) => (
                <div
                  key={apt.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {apt.doctorTitle} {apt.doctorName}
                      </p>
                      <span className="text-xs font-mono text-slate-400">
                        {apt.bookingReference}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {apt.doctorSpecialty} • {formatDate(apt.date)} at{' '}
                      {formatTime12h(apt.startTime)}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-brand-600" />
                <span>Notifications</span>
                {unreadNotifications.length > 0 && (
                  <Badge variant="brand">{unreadNotifications.length} unread</Badge>
                )}
              </h2>
              <Link
                href="/patient/notifications"
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {notifications.slice(0, 3).map((n) => (
                <Link
                  key={n.id}
                  href={n.actionUrl || '/patient/notifications'}
                  className={`block rounded-xl border p-3.5 text-xs transition-colors ${
                    n.isRead
                      ? 'border-slate-100 bg-slate-50/50 text-slate-600'
                      : 'border-brand-200 bg-brand-50/40 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-brand-600 shrink-0" />}
                  </div>
                  <p className="mt-1 text-slate-600 line-clamp-2">{n.message}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Digital Health Card Preview */}
        {activePlanData?.digitalCard && (
          <section className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Your MedClux Digital Health Pass
              </h2>
              <Link
                href="/patient/health-plans"
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                Full Plan & Benefits →
              </Link>
            </div>
            <DigitalHealthCardView card={activePlanData.digitalCard} />
          </section>
        )}
      </div>
    </WorkspaceShell>
  );
}
