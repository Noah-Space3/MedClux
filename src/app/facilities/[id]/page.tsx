'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { PublicFooter, PublicNavbar } from '@/components/layout/PublicLayout';
import { DoctorCard } from '@/components/domain/cards';
import { Badge, Button, ErrorState, Skeleton } from '@/components/ui';
import { doctorService, facilityService } from '@/services/api';

export default function FacilityDetailPage() {
  const params = useParams<{ id: string }>();
  const facilityId = params.id;

  const {
    data: facility,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['facility', facilityId],
    queryFn: () => facilityService.getFacilityById(facilityId),
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors', 'byFacility', facilityId],
    queryFn: () => doctorService.getDoctors({ pageSize: 20 }),
  });

  const affiliatedDoctors =
    doctorsData?.items.filter((d) => d.facilityId === facilityId) || [];

  return (
    <div className="min-h-screen flex flex-col bg-clinical-50">
      <PublicNavbar />

      <main id="main-content" className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/facilities"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-brand-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Facility Directory</span>
        </Link>

        {isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : isError || !facility ? (
          <ErrorState title="Facility not found" />
        ) : (
          <div className="space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand" className="uppercase">
                    {facility.type.replace('_', ' ')}
                  </Badge>
                  <Badge variant="default">{facility.networkTier}</Badge>
                  {facility.is24Hours && <Badge variant="success">Open 24 Hours</Badge>}
                  {facility.hasEmergencyUnit && (
                    <Badge variant="danger">24/7 Emergency Unit</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>
                    {facility.rating.toFixed(1)} ({facility.reviewCount} reviews)
                  </span>
                </div>
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
                {facility.name}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-600 shrink-0" />
                <span>
                  {facility.address}, {facility.state}
                </span>
              </p>

              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Clinical Services & Departments
                  </h2>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                    {facility.services.map((s) => (
                      <li key={s} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Accepted HMO Networks
                  </h2>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                    {facility.acceptedHmoProviders.map((hmo) => (
                      <li key={hmo} className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{hmo}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3 text-xs sm:text-sm">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Hours & Contact Information
                  </h2>
                  <p className="flex items-center gap-2 text-slate-700">
                    <Clock className="h-4 w-4 text-brand-600 shrink-0" />
                    <span>{facility.openingHours}</span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-4 w-4 text-brand-600 shrink-0" />
                    <a href={`tel:${facility.phone}`} className="font-semibold hover:text-brand-700">
                      {facility.phone}
                    </a>
                  </p>
                  <p className="flex items-center gap-2 text-slate-700">
                    <Mail className="h-4 w-4 text-brand-600 shrink-0" />
                    <span>{facility.email}</span>
                  </p>
                  <div className="pt-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${facility.name} ${facility.address}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        leftIcon={<Navigation className="h-3.5 w-3.5" />}
                      >
                        Open Map Directions ({facility.coordinates.lat.toFixed(3)},{' '}
                        {facility.coordinates.lng.toFixed(3)})
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Specialists Practicing at this Facility */}
            {affiliatedDoctors.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Specialists Practicing at {facility.name}
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {affiliatedDoctors.map((doc) => (
                    <DoctorCard key={doc.id} doctor={doc} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
