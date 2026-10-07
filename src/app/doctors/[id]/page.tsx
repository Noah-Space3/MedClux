'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Globe2,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Star,
  Video,
} from 'lucide-react';
import { PublicFooter, PublicNavbar } from '@/components/layout/PublicLayout';
import {
  Avatar,
  Badge,
  Button,
  ErrorState,
  Skeleton,
  VerificationBadge,
} from '@/components/ui';
import { doctorService } from '@/services/api';
import { cn, formatDate, formatNaira, formatTime12h } from '@/lib/utils';

const UPCOMING_DATES = [
  '2026-09-30',
  '2026-10-01',
  '2026-10-02',
  '2026-10-05',
  '2026-10-06',
  '2026-10-07',
];

export default function DoctorProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const doctorId = params.id;

  const [selectedDate, setSelectedDate] = useState<string>('2026-10-01');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorService.getDoctorById(doctorId),
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['doctorSlots', doctorId, selectedDate],
    queryFn: () => doctorService.getAvailableTimeSlots(doctorId, selectedDate),
    enabled: Boolean(doctorId && selectedDate),
  });

  const handleBookNow = () => {
    const qs = new URLSearchParams();
    if (selectedDate) qs.set('date', selectedDate);
    if (selectedTime) qs.set('time', selectedTime);
    router.push(`/book/${doctorId}?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-clinical-50 pb-20 lg:pb-0">
      <PublicNavbar />

      <main id="main-content" className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-brand-700"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Doctor Directory</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        ) : isError || !data ? (
          <ErrorState
            title="Doctor profile unavailable"
            message="We could not locate this specialist profile on MedClux."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Left Column: Doctor Details */}
            <div className="lg:col-span-8 space-y-6">
              {/* Main Header Card */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <Avatar
                    name={`${data.doctor.title} ${data.doctor.fullName}`}
                    size="xl"
                    className="bg-brand-50 text-brand-700 border-brand-200"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <VerificationBadge status={data.doctor.verificationStatus} />
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                        {data.doctor.mdcnNumber}
                      </span>
                      {data.doctor.availableToday && (
                        <Badge variant="success">Available Today</Badge>
                      )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      {data.doctor.title} {data.doctor.fullName}
                    </h1>
                    <p className="mt-1 text-base font-semibold text-brand-700">
                      Consultant — {data.doctor.specialtyName}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-brand-600" />
                        <strong>{data.doctor.yearsOfExperience} years</strong> clinical practice
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <strong>{data.doctor.rating.toFixed(1)}</strong> ({data.doctor.reviewCount}{' '}
                        verified reviews)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {data.doctor.city}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {data.doctor.subSpecialties.map((sub) => (
                        <span
                          key={sub}
                          className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Metrics Bar */}
                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                    <span className="text-xs text-slate-500 block">In-Person Consultation</span>
                    <strong className="text-lg font-bold text-slate-900">
                      {formatNaira(data.doctor.consultationFee)}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                    <span className="text-xs text-slate-500 block">Video Consultation</span>
                    <strong className="text-lg font-bold text-slate-900">
                      {data.doctor.consultationTypes.includes('video')
                        ? formatNaira(data.doctor.videoConsultationFee)
                        : 'In-Person Only'}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-brand-50/60 p-3.5 border border-brand-100">
                    <span className="text-xs text-brand-800 block">HMO Plan Members</span>
                    <strong className="text-sm font-bold text-brand-900">
                      90% Covered (Pay {formatNaira(Math.round(data.doctor.consultationFee * 0.1))})
                    </strong>
                  </div>
                </div>
              </section>

              {/* About, Qualifications, Languages & Location */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">About {data.doctor.title} {data.doctor.fullName}</h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{data.doctor.about}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-brand-600" />
                      <span>Qualifications & Fellowships</span>
                    </h3>
                    <ul className="mt-2.5 space-y-1.5 text-sm text-slate-700">
                      {data.doctor.qualifications.map((q) => (
                        <li key={q} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Globe2 className="h-4 w-4 text-brand-600" />
                      <span>Spoken Languages</span>
                    </h3>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {data.doctor.languages.map((lang) => (
                        <Badge key={lang} variant="default">
                          {lang}
                        </Badge>
                      ))}
                    </div>

                    <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-brand-600" />
                      <span>Primary Hospital & Clinic Location</span>
                    </h3>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                      {data.doctor.facilityName}
                    </p>
                    <p className="text-xs text-slate-600">{data.doctor.clinicAddress}</p>
                  </div>
                </div>
              </section>

              {/* Verified Reviews */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    Verified Patient Feedback ({data.reviews.length})
                  </h2>
                  <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>{data.doctor.rating.toFixed(1)} / 5.0</span>
                  </div>
                </div>

                {data.reviews.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No written patient reviews yet for this specialist.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {rev.patientName}
                            </span>
                            {rev.verifiedBooking && (
                              <Badge variant="success">Verified Consultation</Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {formatDate(rev.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                          “{rev.comment}”
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Sticky Availability & Quick Slot Picker */}
            <aside className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-elevated lg:sticky lg:top-24">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Check Availability</h2>
                  <p className="text-xs text-slate-500">Select a preferred date and time slot</p>
                </div>
                <Calendar className="h-5 w-5 text-brand-600" />
              </div>

              {/* Date Selector */}
              <div className="mt-4">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  1. Choose Date
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {UPCOMING_DATES.map((d) => {
                    const dateObj = new Date(`${d}T00:00:00`);
                    const dayShort = dateObj.toLocaleDateString('en-NG', { weekday: 'short' });
                    const monthDay = dateObj.toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
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
                          'rounded-xl border p-2.5 text-center transition-all',
                          active
                            ? 'border-brand-600 bg-brand-50 text-brand-900 ring-1 ring-brand-600 font-semibold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        <span className="block text-[11px] uppercase text-slate-500">
                          {dayShort}
                        </span>
                        <span className="text-xs font-bold">{monthDay}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div className="mt-5">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  2. Available Time Slots (WAT)
                </span>
                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <Skeleton key={n} className="h-9 w-full" />
                    ))}
                  </div>
                ) : !slotsData || slotsData.slots.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500 border border-slate-200">
                    No open consultation slots on this date. Please pick another day.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {slotsData.slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          'rounded-lg border py-2 px-2 text-xs font-medium transition-colors',
                          !slot.available &&
                            'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed',
                          slot.available &&
                            selectedTime === slot.time &&
                            'bg-brand-600 text-white border-brand-600 font-semibold',
                          slot.available &&
                            selectedTime !== slot.time &&
                            'bg-white text-slate-700 border-slate-200 hover:border-brand-500'
                        )}
                      >
                        {formatTime12h(slot.time)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Consultation Modes Supported */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-brand-600" />
                    In-Person Clinic Fee
                  </span>
                  <strong className="text-slate-900">
                    {formatNaira(data.doctor.consultationFee)}
                  </strong>
                </div>
                {data.doctor.consultationTypes.includes('video') && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-sky-600" />
                      Video Consultation Fee
                    </span>
                    <strong className="text-slate-900">
                      {formatNaira(data.doctor.videoConsultationFee)}
                    </strong>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button variant="primary" size="lg" className="w-full" onClick={handleBookNow}>
                  {selectedTime
                    ? `Book ${formatTime12h(selectedTime)} Slot`
                    : 'Continue to Appointment Booking'}
                </Button>
                <p className="mt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                  <span>Instant confirmation • Free reschedule up to 12h prior</span>
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Mobile Sticky Bottom Booking CTA */}
      {data && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white p-3.5 shadow-elevated flex items-center justify-between lg:hidden">
          <div>
            <span className="text-[11px] text-slate-500 block">Consultation from</span>
            <strong className="text-base font-bold text-slate-900">
              {formatNaira(data.doctor.consultationFee)}
            </strong>
          </div>
          <Button variant="primary" onClick={handleBookNow}>
            Book Appointment
          </Button>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
