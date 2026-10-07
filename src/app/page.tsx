'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Baby,
  Bone,
  Brain,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Eye,
  HeartHandshake,
  HeartPulse,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { PublicFooter, PublicNavbar } from '@/components/layout/PublicLayout';
import { DoctorCard, FacilityCard, HealthPlanCard } from '@/components/domain/cards';
import { Badge, Button, Skeleton } from '@/components/ui';
import { doctorService, facilityService, healthPlanService } from '@/services/api';

const SPECIALTY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartPulse,
  Stethoscope,
  Baby,
  HeartHandshake,
  Sparkles,
  Bone,
  Brain,
  Eye,
};

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedState, setSelectedState] = useState('all');

  const { data: specialties = [] } = useQuery({
    queryKey: ['specialties'],
    queryFn: () => doctorService.getSpecialties(),
  });

  const { data: featuredDoctorsData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors', 'featured'],
    queryFn: () => doctorService.getDoctors({ pageSize: 3, sortBy: 'recommended' }),
  });

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['healthPlans', 'preview'],
    queryFn: () => healthPlanService.getPlans(),
  });

  const { data: facilities = [], isLoading: loadingFacilities } = useQuery({
    queryKey: ['facilities', 'preview'],
    queryFn: () => facilityService.getFacilities(),
  });

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedSpecialty !== 'all') params.set('specialty', selectedSpecialty);
    if (selectedState !== 'all') params.set('state', selectedState);
    router.push(`/doctors?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-clinical-50">
      <PublicNavbar />

      <main id="main-content" className="flex-1">
        {/* 1. HERO & DOCTOR SEARCH */}
        <section className="border-b border-slate-200 bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <Badge
                variant="brand"
                icon={<ShieldCheck className="h-3.5 w-3.5 text-brand-600" />}
              >
                MDCN-Verified Specialists • Accredited Nigerian Facilities
              </Badge>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
                Find the right care and manage your healthcare in one place.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                Book in-person or video consultations with verified specialist doctors across
                Lagos, Abuja, Port Harcourt, and Ibadan. Compare HMO plans, manage family
                dependants, and access your medical records securely on <strong>MedClux</strong>.
              </p>
            </div>

            {/* Search Bar Card */}
            <form
              onSubmit={handleHeroSearch}
              aria-label="Search doctors by name, specialty, and location"
              className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4 shadow-elevated"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-5 relative">
                  <label htmlFor="hero-search-query" className="sr-only">
                    Search doctor, condition, or hospital
                  </label>
                  <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="hero-search-query"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Doctor name, condition, or hospital (e.g., Cardiology, Lagoon Crest)..."
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  />
                </div>

                <div className="md:col-span-3">
                  <label htmlFor="hero-specialty" className="sr-only">
                    Specialty
                  </label>
                  <select
                    id="hero-specialty"
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  >
                    <option value="all">All Specialties</option>
                    {specialties.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="hero-location" className="sr-only">
                    Location
                  </label>
                  <select
                    id="hero-location"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  >
                    <option value="all">All Locations</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja (FCT)">Abuja (FCT)</option>
                    <option value="Rivers">Port Harcourt</option>
                    <option value="Oyo">Ibadan</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <Button type="submit" variant="primary" className="h-11 w-full">
                    Find Doctors
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 px-1">
                <span className="font-medium text-slate-700">Quick filters:</span>
                <Link
                  href="/doctors?availableToday=true"
                  className="rounded-full bg-white border border-slate-200 px-2.5 py-1 hover:border-brand-400 hover:text-brand-700"
                >
                  Available Today
                </Link>
                <Link
                  href="/doctors?specialty=spec-cardiology"
                  className="rounded-full bg-white border border-slate-200 px-2.5 py-1 hover:border-brand-400 hover:text-brand-700"
                >
                  Cardiology
                </Link>
                <Link
                  href="/doctors?specialty=spec-paediatrics"
                  className="rounded-full bg-white border border-slate-200 px-2.5 py-1 hover:border-brand-400 hover:text-brand-700"
                >
                  Paediatrics
                </Link>
                <Link
                  href="/doctors?maxFee=20000"
                  className="rounded-full bg-white border border-slate-200 px-2.5 py-1 hover:border-brand-400 hover:text-brand-700"
                >
                  Under ₦20,000
                </Link>
              </div>
            </form>
          </div>
        </section>

        {/* 2. POPULAR SPECIALTIES */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Popular Medical Specialties</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Connect directly with board-certified consultants across primary and specialist
                  care.
                </p>
              </div>
              <Link
                href="/doctors"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                <span>Browse all specialties</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {specialties.slice(0, 8).map((spec) => {
                const IconComp = SPECIALTY_ICONS[spec.iconName] || Stethoscope;
                return (
                  <Link
                    key={spec.id}
                    href={`/doctors?specialty=${spec.id}`}
                    className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:border-brand-400 hover:shadow-elevated"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                        <IconComp className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-slate-400">
                        {spec.doctorCount} doctors
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-900 group-hover:text-brand-700">
                      {spec.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {spec.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. FEATURED DOCTORS */}
        <section className="py-14 bg-white border-y border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Featured Verified Doctors</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Every specialist on MedClux undergoes credential and MDCN license verification.
                </p>
              </div>
              <Link href="/doctors">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  View All Doctors
                </Button>
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loadingDoctors
                ? [1, 2, 3].map((n) => <Skeleton key={n} className="h-72 w-full" />)
                : featuredDoctorsData?.items.map((doc) => (
                    <DoctorCard key={doc.id} doctor={doc} />
                  ))}
            </div>
          </div>
        </section>

        {/* 4. HOW MEDCLUX WORKS */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-slate-900">How MedClux Works</h2>
              <p className="mt-1 text-sm text-slate-600">
                A transparent, predictable clinical flow from discovery to follow-up care.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Search & Filter Specialists',
                  description:
                    'Filter verified doctors by specialty, hospital location, consultation fee in Naira (₦), and real-time slot availability.',
                  icon: Search,
                },
                {
                  step: '02',
                  title: 'Book In-Person or Video Care',
                  description:
                    'Pick a convenient date and time slot, book for yourself or a registered dependant, and apply your HMO plan or pay securely.',
                  icon: CalendarCheck2,
                },
                {
                  step: '03',
                  title: 'Manage Records, Labs & HMO',
                  description:
                    'Access your Digital Health Card, view prescriptions, book diagnostic lab panels, and track visit summaries in one dashboard.',
                  icon: ShieldCheck,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        STEP {item.step}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. HEALTH / HMO PLANS PREVIEW */}
        <section className="py-14 bg-white border-y border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <Badge variant="brand">Fictional HMO Plans Demo</Badge>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Transparent Health & HMO Plans
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Compare individual and family health plans with clear annual coverage limits,
                  dependant allowances, and instant digital membership cards.
                </p>
              </div>
              <Link href="/health-plans">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Compare All Plans
                </Button>
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-3">
              {loadingPlans
                ? [1, 2, 3].map((n) => <Skeleton key={n} className="h-96 w-full" />)
                : plans.slice(0, 3).map((plan) => (
                    <HealthPlanCard key={plan.id} plan={plan} billingCycle="annual" />
                  ))}
            </div>
          </div>
        </section>

        {/* 6. PARTNER HEALTHCARE FACILITIES PREVIEW */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Accredited Partner Hospitals & Diagnostic Centers
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Discover hospitals, outpatient clinics, diagnostic labs, and pharmacies in our
                  network.
                </p>
              </div>
              <Link href="/facilities">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore Facility Directory
                </Button>
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-3">
              {loadingFacilities
                ? [1, 2, 3].map((n) => <Skeleton key={n} className="h-64 w-full" />)
                : facilities.slice(0, 3).map((fac) => (
                    <FacilityCard key={fac.id} facility={fac} />
                  ))}
            </div>
          </div>
        </section>

        {/* 7. WHY CHOOSE MEDCLUX & PATIENT TESTIMONIALS */}
        <section className="py-14 bg-white border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
              <div className="lg:col-span-5 space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">Why Patients Choose MedClux</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Designed around clinical clarity, transparent pricing in Naira, and zero
                  administrative guesswork.
                </p>
                <ul className="space-y-3 pt-2 text-sm text-slate-700">
                  {[
                    'Verified MDCN practicing credentials on every doctor profile',
                    'Upfront consultation fees and automatic 90% HMO co-pay calculation',
                    'Family dependant coverage for spouse, children, and parents',
                    'Structured longitudinal medical records, lab results, and prescriptions',
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    quote:
                      'Booking a cardiologist in Victoria Island for my routine blood pressure review took less than three minutes, and my HMO co-pay was calculated automatically.',
                    author: 'Adaeze Okafor',
                    meta: 'Patient Member • Lekki, Lagos',
                  },
                  {
                    quote:
                      'Having my son’s paediatric appointments, immunization records, and lab results in one calm interface makes managing family care effortless.',
                    author: 'Tolulope Bakare',
                    meta: 'Family Plan Subscriber • Ikeja GRA, Lagos',
                  },
                ].map((item) => (
                  <blockquote
                    key={item.author}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col justify-between"
                  >
                    <p className="text-sm text-slate-700 leading-relaxed">“{item.quote}”</p>
                    <footer className="mt-4 pt-3 border-t border-slate-200/80">
                      <p className="text-xs font-semibold text-slate-900">{item.author}</p>
                      <p className="text-[11px] text-slate-500">{item.meta}</p>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>

            {/* CTA + Emergency Notice */}
            <div className="mt-12 rounded-2xl bg-slate-900 p-8 sm:p-10 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Ready to book your consultation or explore HMO coverage?
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Browse verified specialists or test the full patient, doctor, and admin portals
                  using our instant demo accounts.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/doctors">
                  <Button variant="primary" size="lg">
                    Find a Doctor
                  </Button>
                </Link>
                <Link href="/health-plans">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-transparent border-slate-700 text-white hover:bg-slate-800 hover:text-white"
                  >
                    Explore HMO Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
