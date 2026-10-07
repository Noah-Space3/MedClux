'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Ambulance,
  Clock,
  MapPin,
  Navigation,
  PhoneCall,
  ShieldAlert,
} from 'lucide-react';
import { PublicFooter, PublicNavbar } from '@/components/layout/PublicLayout';
import { facilityService } from '@/services/api';
import { Badge, Button, Skeleton } from '@/components/ui';

const EMERGENCY_HOTLINES = [
  {
    name: 'National Emergency Toll-Free Number',
    number: '112',
    coverage: 'Nationwide (All States & FCT)',
    description: 'Immediate dispatch for medical emergencies, ambulance, and rescue response.',
  },
  {
    name: 'Lagos State Emergency Management (LASEMA /LASAMBUS)',
    number: '767',
    coverage: 'Lagos Metropolis (Island & Mainland)',
    description: 'Dedicated Lagos State ambulance and trauma stabilization dispatch.',
  },
  {
    name: 'MedClux 24/7 Clinical Triage Desk (Fictional Demo)',
    number: '+234 700 633 2589',
    coverage: 'HMO Members & Partner Trauma Network',
    description: 'Coordinates bed availability and pre-arrival notice at partner emergency units.',
  },
];

export default function EmergencyPage() {
  const { data: emergencyFacilities = [], isLoading } = useQuery({
    queryKey: ['facilities', 'emergency'],
    queryFn: () => facilityService.getFacilities({ onlyEmergency: true }),
  });

  return (
    <div className="min-h-screen flex flex-col bg-clinical-50">
      <PublicNavbar />

      <main id="main-content" className="flex-1">
        {/* Urgent Header Banner — Intentionally Distinct from Marketing UI */}
        <section className="border-b-2 border-red-600 bg-red-950 text-white py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-red-900/90 border border-red-500/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span>Emergency Medical Access • Do Not Use for Routine Bookings</span>
                </div>
                <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                  24/7 Emergency Hotlines & Trauma Units
                </h1>
                <p className="mt-2 text-sm sm:text-base text-red-100 leading-relaxed">
                  If you or someone near you is experiencing chest pain, severe difficulty
                  breathing, stroke symptoms, severe bleeding, or loss of consciousness, call an
                  emergency response line immediately or proceed to the nearest 24-hour emergency
                  unit below.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <a
                  href="tel:112"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-red-600 hover:bg-red-500 px-6 py-4 text-base font-bold text-white shadow-lg ring-2 ring-red-400"
                >
                  <PhoneCall className="h-5 w-5" />
                  <span>Call 112 Now</span>
                </a>
                <a
                  href="tel:767"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-red-400/40 px-5 py-4 text-base font-semibold text-white"
                >
                  <Ambulance className="h-5 w-5 text-red-300" />
                  <span>Dial 767 (Lagos)</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Direct Emergency Numbers */}
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <span>Direct Emergency Response Numbers</span>
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                {EMERGENCY_HOTLINES.map((item) => (
                  <div
                    key={item.number}
                    className="rounded-xl border-2 border-red-200 bg-white p-5 shadow-card flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                        {item.coverage}
                      </span>
                      <h3 className="mt-1 text-base font-bold text-slate-900">{item.name}</h3>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xl font-mono font-bold text-red-700">
                        {item.number}
                      </span>
                      <a href={`tel:${item.number.replace(/\s+/g, '')}`}>
                        <Button variant="emergency" size="sm" leftIcon={<PhoneCall className="h-3.5 w-3.5" />}>
                          Dial Number
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 24/7 Accredited Emergency & Trauma Hospitals */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    24/7 Accredited Partner Emergency & Trauma Centers
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Facilities equipped with 24-hour emergency triage, ambulance bays, and intensive
                    care stabilization.
                  </p>
                </div>
                <Badge variant="danger">Fictional Demo Facilities</Badge>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                {isLoading
                  ? [1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-48 w-full" />)
                  : emergencyFacilities.map((fac) => (
                      <div
                        key={fac.id}
                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-card flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge variant="danger">24/7 Emergency & Trauma Unit</Badge>
                            <span className="text-xs font-semibold text-slate-500">
                              {fac.state}
                            </span>
                          </div>
                          <h3 className="mt-2 text-lg font-bold text-slate-900">{fac.name}</h3>
                          <p className="mt-1 text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-red-600 shrink-0" />
                            <span>{fac.address}</span>
                          </p>
                          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{fac.openingHours}</span>
                          </p>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {fac.services.map((s) => (
                              <span
                                key={s}
                                className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <a href={`tel:${fac.phone}`}>
                            <Button
                              variant="danger"
                              size="sm"
                              leftIcon={<PhoneCall className="h-3.5 w-3.5" />}
                            >
                              Call Triage: {fac.phone}
                            </Button>
                          </a>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${fac.name} ${fac.address}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand-700"
                          >
                            <Navigation className="h-3.5 w-3.5 text-brand-600" />
                            <span>Get Directions</span>
                          </a>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
