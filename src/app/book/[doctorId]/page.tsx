'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  User,
  Video,
} from 'lucide-react';
import { PublicFooter, PublicNavbar } from '@/components/layout/PublicLayout';
import { Avatar, Badge, Button, ErrorState, Skeleton, Textarea } from '@/components/ui';
import {
  appointmentService,
  dependantService,
  doctorService,
  healthPlanService,
} from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Appointment, ConsultationType, Transaction } from '@/types/domain';
import { cn, formatDate, formatNaira, formatTime12h, isFutureOrTodayDate } from '@/lib/utils';

const BOOKING_STEPS = [
  { step: 1, label: 'Date', nextHint: 'Choose an available time slot' },
  { step: 2, label: 'Time', nextHint: 'Select In-Person or Video mode' },
  { step: 3, label: 'Type', nextHint: 'Provide patient & symptom details' },
  { step: 4, label: 'Patient Info', nextHint: 'Review appointment summary' },
  { step: 5, label: 'Review', nextHint: 'Complete payment or HMO authorization' },
  { step: 6, label: 'Payment', nextHint: 'Receive instant booking confirmation' },
  { step: 7, label: 'Confirmed', nextHint: 'Manage in My Appointments' },
];

const AVAILABLE_DATES = [
  '2026-09-30',
  '2026-10-01',
  '2026-10-02',
  '2026-10-05',
  '2026-10-06',
  '2026-10-07',
  '2026-10-08',
  '2026-10-09',
];

function BookingWizardContent() {
  const params = useParams<{ doctorId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loginWithDemoRole } = useAuth();
  const { showToast } = useToast();
  const doctorId = params.doctorId;

  const storageKey = `medclux_booking_draft_${doctorId}`;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get('date') || '2026-10-01'
  );
  const [selectedTime, setSelectedTime] = useState<string>(searchParams.get('time') || '');
  const [consultationType, setConsultationType] = useState<ConsultationType>('in_person');
  const [forWho, setForWho] = useState<'self' | string>('self');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [useHmoCoverage, setUseHmoCoverage] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Bank Transfer' | 'HMO Cover' | 'USSD'>('Card');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedResult, setConfirmedResult] = useState<{
    appointment: Appointment;
    transaction: Transaction;
  } | null>(null);

  // Restore draft state from sessionStorage if refreshed mid-booking
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!searchParams.get('date') && parsed.selectedDate) setSelectedDate(parsed.selectedDate);
        if (!searchParams.get('time') && parsed.selectedTime) setSelectedTime(parsed.selectedTime);
        if (parsed.consultationType) setConsultationType(parsed.consultationType);
        if (parsed.reasonForVisit) setReasonForVisit(parsed.reasonForVisit);
        if (parsed.currentStep && parsed.currentStep < 7) setCurrentStep(parsed.currentStep);
      }
    } catch {
      // ignore
    }
  }, [storageKey, searchParams]);

  // Persist draft state
  useEffect(() => {
    if (typeof window === 'undefined' || currentStep === 7) return;
    try {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          selectedDate,
          selectedTime,
          consultationType,
          reasonForVisit,
          currentStep,
        })
      );
    } catch {
      // ignore
    }
  }, [selectedDate, selectedTime, consultationType, reasonForVisit, currentStep, storageKey]);

  const patientId = user?.role === 'patient' ? user.id : 'pat-1';

  const { data: doctorData, isLoading: loadingDoctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorService.getDoctorById(doctorId),
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['doctorSlots', doctorId, selectedDate],
    queryFn: () => doctorService.getAvailableTimeSlots(doctorId, selectedDate),
    enabled: Boolean(doctorId && selectedDate),
  });

  const { data: dependants = [] } = useQuery({
    queryKey: ['dependants', patientId],
    queryFn: () => dependantService.getDependants(patientId),
  });

  const { data: activePlanData } = useQuery({
    queryKey: ['activePlan', patientId],
    queryFn: () => healthPlanService.getPatientActivePlan(patientId),
  });

  const doctor = doctorData?.doctor;
  const baseFee = doctor
    ? consultationType === 'video'
      ? doctor.videoConsultationFee
      : doctor.consultationFee
    : 0;
  const hasActiveHmo = Boolean(activePlanData?.enrollment && useHmoCoverage);
  const payableAmount = hasActiveHmo ? Math.round(baseFee * 0.1) : baseFee;

  const validateAndAdvance = (targetStep: number) => {
    setStepError(null);

    if (targetStep > 1) {
      if (!selectedDate || !isFutureOrTodayDate(selectedDate)) {
        setStepError('Please select a valid future appointment date.');
        return;
      }
    }
    if (targetStep > 2) {
      if (!selectedTime) {
        setStepError('Please select an available time slot to continue.');
        return;
      }
      const slotObj = slotsData?.slots.find((s) => s.time === selectedTime);
      if (slotObj && !slotObj.available) {
        setStepError('That time slot is already booked. Please choose another slot.');
        return;
      }
    }
    if (targetStep > 3 && doctor) {
      if (!doctor.consultationTypes.includes(consultationType)) {
        setStepError('This doctor does not offer the selected consultation mode.');
        return;
      }
    }
    if (targetStep > 4) {
      if (reasonForVisit.trim().length < 8) {
        setStepError(
          'Please describe your symptoms or reason for visit (at least 8 characters) so the doctor can prepare.'
        );
        return;
      }
    }

    setCurrentStep(targetStep);
  };

  const handleConfirmAndPay = async () => {
    setStepError(null);
    setIsSubmitting(true);
    try {
      if (!user) {
        await loginWithDemoRole('patient');
      }
      const result = await appointmentService.createAppointment({
        patientId,
        forDependantId: forWho === 'self' ? undefined : forWho,
        doctorId,
        date: selectedDate,
        startTime: selectedTime,
        consultationType,
        reasonForVisit,
        useHmoCoverage: hasActiveHmo,
        paymentMethod,
        simulatePaymentFailure: simulateFailure,
      });

      setConfirmedResult(result);
      setCurrentStep(7);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(storageKey);
      }
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctorSlots'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      showToast({
        title: 'Appointment Confirmed!',
        description: `Booking Reference: ${result.appointment.bookingReference}`,
        variant: 'success',
      });
    } catch (err) {
      setStepError(
        err instanceof Error ? err.message : 'Unable to complete booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingDoctor) {
    return (
      <div className="min-h-screen flex flex-col bg-clinical-50">
        <PublicNavbar />
        <div className="mx-auto max-w-5xl w-full p-6 space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col bg-clinical-50">
        <PublicNavbar />
        <div className="mx-auto max-w-3xl w-full p-8">
          <ErrorState title="Doctor not found" message="Unable to load booking wizard." />
        </div>
      </div>
    );
  }

  const currentStepMeta = BOOKING_STEPS.find((s) => s.step === currentStep) || BOOKING_STEPS[0];

  return (
    <div className="min-h-screen flex flex-col bg-clinical-50">
      <PublicNavbar />

      <main id="main-content" className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Breadcrumb + Stepper */}
        <div className="mb-6">
          <Link
            href={`/doctors/${doctor.id}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>
              Back to {doctor.title} {doctor.fullName}’s Profile
            </span>
          </Link>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                  Step {currentStep} of 7 — {currentStepMeta.label}
                </span>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  Book Consultation with {doctor.title} {doctor.fullName}
                </h1>
              </div>
              <p className="text-xs text-slate-500">
                Next: <strong className="text-slate-700">{currentStepMeta.nextHint}</strong>
              </p>
            </div>

            {/* 7-Step Visual Progress Bar */}
            <ol
              aria-label="Booking progress"
              className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2"
            >
              {BOOKING_STEPS.map((s) => {
                const done = currentStep > s.step;
                const active = currentStep === s.step;
                return (
                  <li key={s.step} className="flex flex-col">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-colors',
                        done
                          ? 'bg-brand-600'
                          : active
                          ? 'bg-brand-500'
                          : 'bg-slate-200'
                      )}
                    />
                    <span
                      className={cn(
                        'mt-1.5 text-[10px] sm:text-xs font-medium truncate',
                        active
                          ? 'text-brand-700 font-bold'
                          : done
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      )}
                    >
                      {s.step}. {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Active Wizard Step */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
            {stepError && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm font-medium text-red-800"
              >
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <span>{stepError}</span>
              </div>
            )}

            {/* STEP 1: CHOOSE DATE */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 1: Select Appointment Date</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Choose a consultation date. Past dates and non-clinic days are automatically
                    prevented.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AVAILABLE_DATES.map((d) => {
                    const dt = new Date(`${d}T00:00:00`);
                    const weekday = dt.toLocaleDateString('en-NG', { weekday: 'short' });
                    const formatted = dt.toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const active = selectedDate === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedTime('');
                        }}
                        className={cn(
                          'rounded-xl border p-3.5 text-left transition-all',
                          active
                            ? 'border-brand-600 bg-brand-50/80 ring-1 ring-brand-600'
                            : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                        )}
                      >
                        <span className="text-xs font-semibold uppercase text-brand-700 block">
                          {weekday}
                        </span>
                        <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                          {formatted}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label htmlFor="custom-booking-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Or pick another date from calendar
                  </label>
                  <input
                    id="custom-booking-date"
                    type="date"
                    min="2026-09-30"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={() => validateAndAdvance(2)}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Continue to Time Slot
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: CHOOSE TIME */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 2: Select Time Slot for {formatDate(selectedDate)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    All times are displayed in West Africa Time (WAT / Lagos). Greyed-out slots are
                    already booked.
                  </p>
                </div>

                {loadingSlots ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <Skeleton key={n} className="h-11 w-full" />
                    ))}
                  </div>
                ) : !slotsData || slotsData.slots.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                    No consultation slots available on {formatDate(selectedDate)} (Weekend or
                    doctor off-day). Please step back and pick a weekday.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {slotsData.slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelectedTime(s.time)}
                        className={cn(
                          'rounded-xl border py-3 px-3 text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                          !s.available &&
                            'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed',
                          s.available &&
                            selectedTime === s.time &&
                            'bg-brand-600 text-white border-brand-600 shadow-sm font-semibold',
                          s.available &&
                            selectedTime !== s.time &&
                            'bg-white text-slate-800 border-slate-200 hover:border-brand-500'
                        )}
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatTime12h(s.time)}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => validateAndAdvance(3)}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Continue to Appointment Type
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: APPOINTMENT TYPE */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 3: Choose Consultation Mode
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Select whether you prefer an in-person hospital visit or a secure video
                    consultation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setConsultationType('in_person')}
                    className={cn(
                      'rounded-xl border p-5 text-left transition-all',
                      consultationType === 'in_person'
                        ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Building2 className="h-6 w-6 text-brand-600" />
                      <span className="text-sm font-bold text-slate-900">
                        {formatNaira(doctor.consultationFee)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-bold text-slate-900">
                      In-Person Clinic Visit
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Visit {doctor.facilityName} ({doctor.clinicAddress}) for physical examination.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={!doctor.consultationTypes.includes('video')}
                    onClick={() => setConsultationType('video')}
                    className={cn(
                      'rounded-xl border p-5 text-left transition-all',
                      !doctor.consultationTypes.includes('video') &&
                        'opacity-50 cursor-not-allowed bg-slate-50',
                      consultationType === 'video'
                        ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Video className="h-6 w-6 text-sky-600" />
                      <span className="text-sm font-bold text-slate-900">
                        {doctor.consultationTypes.includes('video')
                          ? formatNaira(doctor.videoConsultationFee)
                          : 'Unavailable'}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-bold text-slate-900">
                      Video Consultation
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Consult remotely via encrypted HD video link with digital prescription
                      delivery.
                    </p>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => validateAndAdvance(4)}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Continue to Patient Details
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: PATIENT INFORMATION */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 4: Patient Information</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Specify who this consultation is for and share brief clinical context.
                  </p>
                </div>

                <div>
                  <span className="block text-sm font-medium text-slate-700 mb-2">
                    Who is this appointment for?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setForWho('self')}
                      className={cn(
                        'rounded-xl border p-3.5 text-left transition-all',
                        forWho === 'self'
                          ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-600'
                          : 'border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      <p className="text-sm font-semibold text-slate-900">Myself (Principal)</p>
                      <p className="text-xs text-slate-500">{user?.fullName || 'Adaeze Okafor'}</p>
                    </button>

                    {dependants.map((dep) => (
                      <button
                        key={dep.id}
                        type="button"
                        onClick={() => setForWho(dep.id)}
                        className={cn(
                          'rounded-xl border p-3.5 text-left transition-all',
                          forWho === dep.id
                            ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-600'
                            : 'border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        <p className="text-sm font-semibold text-slate-900">{dep.fullName}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          Dependant ({dep.relationship})
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  label="Reason for Visit / Symptoms"
                  required
                  rows={4}
                  placeholder="Describe your symptoms, duration, or follow-up questions (e.g., Routine blood pressure review and discussion of recent lipid profile results)..."
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  helperText="Minimum 8 characters required. Shared confidentially with your attending doctor."
                />

                {activePlanData?.enrollment && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useHmoCoverage}
                        onChange={(e) => setUseHmoCoverage(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-emerald-950">
                          Apply Active HMO Plan: {activePlanData.enrollment.planName} (90% Cover)
                        </p>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Member ID: {activePlanData.enrollment.memberId} • Reduces consultation
                          co-pay from {formatNaira(baseFee)} to{' '}
                          <strong>{formatNaira(Math.round(baseFee * 0.1))}</strong>.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(3)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => validateAndAdvance(5)}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Review Appointment
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW APPOINTMENT */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 5: Review Appointment Details
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Please verify all details before proceeding to payment authorization.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-200/70">
                    <span className="text-slate-500">Attending Specialist</span>
                    <strong className="text-slate-900">
                      {doctor.title} {doctor.fullName} ({doctor.specialtyName})
                    </strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200/70">
                    <span className="text-slate-500">Date & Time (WAT)</span>
                    <strong className="text-slate-900">
                      {formatDate(selectedDate)} at {formatTime12h(selectedTime)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200/70">
                    <span className="text-slate-500">Consultation Type</span>
                    <strong className="text-slate-900 capitalize">
                      {consultationType === 'video'
                        ? 'Video Consultation'
                        : `In-Person (${doctor.facilityName})`}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200/70">
                    <span className="text-slate-500">Patient</span>
                    <strong className="text-slate-900">
                      {forWho === 'self'
                        ? user?.fullName || 'Adaeze Okafor (Self)'
                        : dependants.find((d) => d.id === forWho)?.fullName}
                    </strong>
                  </div>
                  <div className="py-1.5">
                    <span className="text-slate-500 block mb-1">Clinical Reason for Visit</span>
                    <p className="rounded-lg bg-white p-3 text-xs text-slate-800 border border-slate-200">
                      {reasonForVisit}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(4)}>
                    Edit Details
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => validateAndAdvance(6)}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Proceed to Checkout ({formatNaira(payableAmount)})
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 6: PAYMENT CHECKOUT */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <Badge variant="brand">MedClux MockGateway (Paystack-Ready Abstraction)</Badge>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">
                    Step 6: Authorize Payment ({formatNaira(payableAmount)})
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    This is a fictional portfolio checkout. No real money is charged.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['Card', 'Bank Transfer', 'USSD', 'HMO Cover'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        'rounded-xl border p-3 text-center text-xs font-semibold transition-all',
                        paymentMethod === method
                          ? 'border-brand-600 bg-brand-50 text-brand-900 ring-1 ring-brand-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      <CreditCard className="h-4 w-4 mx-auto mb-1 text-brand-600" />
                      {method}
                    </button>
                  ))}
                </div>

                {/* Edge-case simulator toggle for portfolio reviewers */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-600"
                    />
                    <span>
                      <strong>Edge-Case Test:</strong> Simulate payment gateway decline to verify
                      error recovery without losing booking state
                    </span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(5)}>
                    Back to Review
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    onClick={handleConfirmAndPay}
                  >
                    Pay {formatNaira(payableAmount)} & Confirm Booking
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 7: CONFIRMATION */}
            {currentStep === 7 && confirmedResult && (
              <div className="text-center py-4 space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="h-9 w-9" />
                </div>

                <div>
                  <Badge variant="success">Booking Confirmed</Badge>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Your Consultation is Scheduled!
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Reference:{' '}
                    <strong className="font-mono text-slate-900">
                      {confirmedResult.appointment.bookingReference}
                    </strong>{' '}
                    • Receipt:{' '}
                    <strong className="font-mono text-slate-900">
                      {confirmedResult.transaction.receiptNumber}
                    </strong>
                  </p>
                </div>

                <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-slate-50 p-5 text-left text-xs sm:text-sm space-y-2">
                  <p>
                    <span className="text-slate-500">Doctor:</span>{' '}
                    <strong className="text-slate-900">
                      {confirmedResult.appointment.doctorTitle}{' '}
                      {confirmedResult.appointment.doctorName}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Date & Time:</span>{' '}
                    <strong className="text-slate-900">
                      {formatDate(confirmedResult.appointment.date)} at{' '}
                      {formatTime12h(confirmedResult.appointment.startTime)}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Location / Mode:</span>{' '}
                    <strong className="text-slate-900">
                      {confirmedResult.appointment.consultationType === 'video'
                        ? 'Video Consultation Link Generated'
                        : confirmedResult.appointment.facilityName}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Amount Paid:</span>{' '}
                    <strong className="text-emerald-700">
                      {formatNaira(confirmedResult.transaction.amount)}
                    </strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link href="/patient/appointments">
                    <Button variant="primary">Go to My Appointments</Button>
                  </Link>
                  <Link href="/patient/payments">
                    <Button variant="outline">View Payment Receipt</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Persistent Selected Summary */}
          <aside className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card space-y-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <Avatar name={`${doctor.title} ${doctor.fullName}`} size="md" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {doctor.title} {doctor.fullName}
                </h3>
                <p className="text-xs text-brand-700 font-medium">{doctor.specialtyName}</p>
                <p className="text-xs text-slate-500">{doctor.facilityName}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-brand-600" />
                  Selected Date
                </span>
                <strong className="text-slate-900">{formatDate(selectedDate)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-brand-600" />
                  Selected Time
                </span>
                <strong className="text-slate-900">
                  {selectedTime ? formatTime12h(selectedTime) : 'Not selected yet'}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-brand-600" />
                  Consultation Mode
                </span>
                <strong className="text-slate-900 capitalize">
                  {consultationType === 'video' ? 'Video Consult' : 'In-Person'}
                </strong>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Standard Consultation Fee</span>
                <span>{formatNaira(baseFee)}</span>
              </div>
              {hasActiveHmo && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>HMO Coverage (90%)</span>
                  <span>-{formatNaira(baseFee - payableAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Payable</span>
                <span>{formatNaira(payableAmount)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
              <span>
                Your booking progress is saved automatically. If you refresh this page, your
                selected step and details are preserved.
              </span>
            </div>
          </aside>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-clinical-50" />}>
      <BookingWizardContent />
    </Suspense>
  );
}
