'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  Check,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
  Video,
  Award,
} from 'lucide-react';
import {
  Appointment,
  DigitalHealthCard,
  Doctor,
  Facility,
  HealthPlan,
} from '@/types/domain';
import {
  AppointmentStatusBadge,
  Avatar,
  Badge,
  Button,
  VerificationBadge,
} from '@/components/ui';
import { cn, formatDate, formatNaira, formatTime12h } from '@/lib/utils';

/* ============================================================================
 * DOCTOR CARD
 * ========================================================================== */
export function DoctorCard({
  doctor,
  compact = false,
}: {
  doctor: Doctor;
  compact?: boolean;
}) {
  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:border-brand-300 hover:shadow-elevated flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-4">
          <Avatar
            name={`${doctor.title} ${doctor.fullName}`}
            size="lg"
            className="bg-brand-50 text-brand-700 border-brand-200"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <VerificationBadge status={doctor.verificationStatus} />
              {doctor.availableToday ? (
                <Badge
                  variant="success"
                  icon={<span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                >
                  Available Today
                </Badge>
              ) : (
                <Badge variant="default">Next: {formatDate(doctor.nextAvailableDate)}</Badge>
              )}
            </div>
            <Link
              href={`/doctors/${doctor.id}`}
              className="block text-base sm:text-lg font-semibold text-slate-900 hover:text-brand-700 truncate"
            >
              {doctor.title} {doctor.fullName}
            </Link>
            <p className="text-sm font-medium text-brand-700">{doctor.specialtyName}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {doctor.qualifications.join(' • ')}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-brand-600 shrink-0" />
            <span>
              <strong className="text-slate-900">{doctor.yearsOfExperience} yrs</strong> experience
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
            <span>
              <strong className="text-slate-900">{doctor.rating.toFixed(1)}</strong> ({doctor.reviewCount}{' '}
              reviews)
            </span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 truncate">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="truncate">
              {doctor.facilityName} • {doctor.city}
            </span>
          </div>
        </div>

        {!compact && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {doctor.consultationTypes.includes('in_person') && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                In-Person Visit
              </span>
            )}
            {doctor.consultationTypes.includes('video') && (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs text-sky-800">
                <Video className="h-3.5 w-3.5 text-sky-600" />
                Video Consult ({formatNaira(doctor.videoConsultationFee)})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Consultation Fee
          </span>
          <span className="text-base font-bold text-slate-900">
            {formatNaira(doctor.consultationFee)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/doctors/${doctor.id}`}>
            <Button variant="outline" size="sm">
              Profile
            </Button>
          </Link>
          <Link href={`/book/${doctor.id}`}>
            <Button variant="primary" size="sm">
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ============================================================================
 * APPOINTMENT CARD
 * ========================================================================== */
export function AppointmentCard({
  appointment,
  perspective = 'patient',
  onViewDetails,
  onReschedule,
  onCancel,
  onDoctorAction,
}: {
  appointment: Appointment;
  perspective?: 'patient' | 'doctor';
  onViewDetails?: (apt: Appointment) => void;
  onReschedule?: (apt: Appointment) => void;
  onCancel?: (apt: Appointment) => void;
  onDoctorAction?: (apt: Appointment, action: 'confirmed' | 'completed' | 'cancelled') => void;
}) {
  const canModify =
    appointment.status === 'pending' ||
    appointment.status === 'confirmed' ||
    appointment.status === 'rescheduled';

  const displayName =
    perspective === 'patient'
      ? `${appointment.doctorTitle} ${appointment.doctorName}`
      : appointment.forDependantName
      ? `${appointment.forDependantName} (Dependant of ${appointment.patientName})`
      : appointment.patientName;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:border-slate-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Avatar name={displayName} size="md" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">{displayName}</h3>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {appointment.bookingReference}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-brand-700 font-medium">
              {appointment.doctorSpecialty} • {appointment.facilityName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <AppointmentStatusBadge status={appointment.status} />
        </div>
      </div>

      <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-600 shrink-0" />
          <span>{formatDate(appointment.date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand-600 shrink-0" />
          <span>
            {formatTime12h(appointment.startTime)} – {formatTime12h(appointment.endTime)} (WAT)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {appointment.consultationType === 'video' ? (
            <>
              <Video className="h-4 w-4 text-sky-600 shrink-0" />
              <span className="text-sky-800 font-medium">Video Consultation</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="truncate">{appointment.facilityAddress}</span>
            </>
          )}
        </div>
      </div>

      {appointment.forDependantName && perspective === 'patient' && (
        <div className="mb-3 rounded-lg bg-brand-50/70 border border-brand-100 px-3 py-2 text-xs text-brand-900 flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-brand-600 shrink-0" />
          <span>
            Booked for dependant: <strong>{appointment.forDependantName}</strong>
          </span>
        </div>
      )}

      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Fee:{' '}
          <strong className="text-slate-900">{formatNaira(appointment.copayAmount)}</strong>
          {appointment.coveredByHmo && (
            <span className="ml-1.5 inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
              HMO 90% Covered
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={() => onViewDetails(appointment)}>
              View Details
            </Button>
          )}
          {perspective === 'patient' && canModify && onReschedule && (
            <Button variant="outline" size="sm" onClick={() => onReschedule(appointment)}>
              Reschedule
            </Button>
          )}
          {perspective === 'patient' && canModify && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onCancel(appointment)}
            >
              Cancel
            </Button>
          )}
          {perspective === 'doctor' && onDoctorAction && (
            <>
              {appointment.status === 'pending' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onDoctorAction(appointment, 'confirmed')}
                >
                  Accept & Confirm
                </Button>
              )}
              {(appointment.status === 'confirmed' || appointment.status === 'rescheduled') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onDoctorAction(appointment, 'completed')}
                >
                  Mark Completed
                </Button>
              )}
              {canModify && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onDoctorAction(appointment, 'cancelled')}
                >
                  Decline / Cancel
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * HEALTH PLAN CARD
 * ========================================================================== */
export function HealthPlanCard({
  plan,
  billingCycle = 'annual',
  isComparing = false,
  onToggleCompare,
  onSelectPlan,
  isActivePlan = false,
}: {
  plan: HealthPlan;
  billingCycle?: 'monthly' | 'annual';
  isComparing?: boolean;
  onToggleCompare?: (plan: HealthPlan) => void;
  onSelectPlan?: (plan: HealthPlan) => void;
  isActivePlan?: boolean;
}) {
  const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-white p-6 shadow-card flex flex-col justify-between transition-all',
        plan.isPopular ? 'border-brand-600 ring-1 ring-brand-600' : 'border-slate-200',
        isActivePlan && 'bg-brand-50/20 border-emerald-500'
      )}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
          Most Popular
        </div>
      )}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              {plan.tier} Tier • {plan.hospitalNetworkTier}
            </span>
            <h3 className="mt-1 text-lg font-bold text-slate-900">{plan.name}</h3>
            <p className="text-xs text-slate-500">{plan.providerName}</p>
          </div>
          {isActivePlan && <Badge variant="success">Active Plan</Badge>}
        </div>

        <div className="mt-5 pb-5 border-b border-slate-100">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {formatNaira(price)}
            </span>
            <span className="text-xs text-slate-500">
              / {billingCycle === 'annual' ? 'year' : 'month'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Annual coverage limit up to{' '}
            <strong className="text-slate-800">{formatNaira(plan.annualCoverageLimit)}</strong> • Up to{' '}
            <strong className="text-slate-800">{plan.maxDependants} dependant(s)</strong>
          </p>
        </div>

        <ul className="mt-5 space-y-2.5 text-xs sm:text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
            <span>
              <strong>Consultations:</strong> {plan.coveredConsultations}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
            <span>
              <strong>Emergency:</strong> {plan.emergencyCareBenefits}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
            <span>
              <strong>Diagnostics & Labs:</strong> {plan.labBenefits}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
            <span>
              <strong>Dental & Optical:</strong> {plan.dentalBenefits}
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center gap-2">
          <Link href={`/health-plans/${plan.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Plan Details
            </Button>
          </Link>
          {onSelectPlan ? (
            <Button
              variant={isActivePlan ? 'secondary' : 'primary'}
              size="sm"
              className="flex-1"
              onClick={() => onSelectPlan(plan)}
            >
              {isActivePlan ? 'Manage Plan' : 'Choose Plan'}
            </Button>
          ) : (
            <Link href={`/health-plans/${plan.id}`} className="flex-1">
              <Button variant="primary" size="sm" className="w-full">
                Subscribe
              </Button>
            </Link>
          )}
        </div>

        {onToggleCompare && (
          <label className="flex items-center justify-center gap-2 text-xs text-slate-600 cursor-pointer pt-1 select-none">
            <input
              type="checkbox"
              checked={isComparing}
              onChange={() => onToggleCompare(plan)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
            />
            <span>Compare plan benefits side-by-side</span>
          </label>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
 * MEDCLUX DIGITAL HEALTH CARD
 * ========================================================================== */
export function DigitalHealthCardView({ card }: { card: DigitalHealthCard }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-6 sm:p-7 shadow-elevated border border-slate-800 max-w-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight">MedClux</span>
              <span className="text-[10px] uppercase tracking-widest bg-brand-500/20 text-brand-300 border border-brand-400/30 px-2 py-0.5 rounded-full">
                Digital Health Pass
              </span>
            </div>
            <p className="text-xs text-slate-400">{card.providerName}</p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
            card.status === 'active'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
              : 'bg-red-500/20 text-red-300 border border-red-400/30'
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              card.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'
            )}
          />
          {card.status === 'active' ? 'ACTIVE COVERAGE' : 'INACTIVE'}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Principal Member</p>
          <p className="text-lg font-semibold text-white mt-0.5">{card.patientName}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Member ID</p>
          <p className="text-base font-mono font-semibold text-brand-300 mt-0.5">
            {card.memberId}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs">
        <div>
          <span className="block text-slate-400">Health Plan</span>
          <strong className="text-slate-100">{card.planName}</strong>
        </div>
        <div>
          <span className="block text-slate-400">Hospital Access</span>
          <strong className="text-slate-100">{card.networkTier}</strong>
        </div>
        <div>
          <span className="block text-slate-400">Valid Until</span>
          <strong className="text-slate-100">{formatDate(card.validUntil)}</strong>
        </div>
        <div>
          <span className="block text-slate-400">Dependants Covered</span>
          <strong className="text-slate-100">{card.dependantsCount} enrolled</strong>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-brand-400" />
          Fictional Portfolio Health Card • Present at partner facilities
        </span>
        <span className="text-slate-300 font-medium">
          24/7 Helpline: {card.emergencyHelpline}
        </span>
      </div>
    </div>
  );
}

/* ============================================================================
 * FACILITY CARD
 * ========================================================================== */
export function FacilityCard({ facility }: { facility: Facility }) {
  const typeLabels: Record<Facility['type'], string> = {
    hospital: 'Specialist Hospital',
    clinic: 'Outpatient Clinic',
    diagnostic_center: 'Diagnostic & Imaging Center',
    pharmacy: 'Accredited Pharmacy',
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-card flex flex-col justify-between hover:border-brand-300 transition-all">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <Badge variant="brand">{typeLabels[facility.type]}</Badge>
          <div className="flex items-center gap-1.5">
            {facility.is24Hours && <Badge variant="success">24 Hours</Badge>}
            {facility.hasEmergencyUnit && <Badge variant="danger">Emergency Unit</Badge>}
          </div>
        </div>

        <Link
          href={`/facilities/${facility.id}`}
          className="text-base font-bold text-slate-900 hover:text-brand-700 block"
        >
          {facility.name}
        </Link>

        <p className="mt-1 text-xs text-slate-600 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>
            {facility.address} ({facility.state})
          </span>
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {facility.services.slice(0, 4).map((srv) => (
            <span
              key={srv}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
            >
              {srv}
            </span>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
          <p className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-brand-600 shrink-0" />
            <span>{facility.openingHours}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-brand-600 shrink-0" />
            <span className="truncate">
              <strong>{facility.networkTier}</strong> • Accepts {facility.acceptedHmoProviders.length}{' '}
              HMO networks
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <a
          href={`tel:${facility.phone}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-brand-700"
        >
          <Phone className="h-3.5 w-3.5 text-brand-600" />
          {facility.phone}
        </a>
        <Link href={`/facilities/${facility.id}`}>
          <Button variant="outline" size="sm">
            Facility Details
          </Button>
        </Link>
      </div>
    </article>
  );
}
