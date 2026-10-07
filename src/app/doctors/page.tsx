'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { PublicFooter, PublicNavbar } from '@/components/layout/PublicLayout';
import { DoctorCard } from '@/components/domain/cards';
import {
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from '@/components/ui';
import { doctorService } from '@/services/api';
import { ConsultationType, DoctorFilterParams } from '@/types/domain';
import { formatNaira } from '@/lib/utils';

function DoctorsDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [specialtyId, setSpecialtyId] = useState(searchParams.get('specialty') || 'all');
  const [state, setState] = useState(searchParams.get('state') || 'all');
  const [maxFee, setMaxFee] = useState<number>(
    searchParams.get('maxFee') ? Number(searchParams.get('maxFee')) : 0
  );
  const [availableToday, setAvailableToday] = useState(
    searchParams.get('availableToday') === 'true'
  );
  const [minRating, setMinRating] = useState<number>(
    searchParams.get('minRating') ? Number(searchParams.get('minRating')) : 0
  );
  const [consultationType, setConsultationType] = useState<ConsultationType | ''>(
    (searchParams.get('mode') as ConsultationType) || ''
  );
  const [sortBy, setSortBy] = useState<NonNullable<DoctorFilterParams['sortBy']>>(
    (searchParams.get('sort') as NonNullable<DoctorFilterParams['sortBy']>) || 'recommended'
  );
  const [page, setPage] = useState<number>(
    searchParams.get('page') ? Number(searchParams.get('page')) : 1
  );
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data: specialties = [] } = useQuery({
    queryKey: ['specialties'],
    queryFn: () => doctorService.getSpecialties(),
  });

  // Sync filters to URL query string
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (specialtyId !== 'all') params.set('specialty', specialtyId);
    if (state !== 'all') params.set('state', state);
    if (maxFee > 0) params.set('maxFee', String(maxFee));
    if (availableToday) params.set('availableToday', 'true');
    if (minRating > 0) params.set('minRating', String(minRating));
    if (consultationType) params.set('mode', consultationType);
    if (sortBy !== 'recommended') params.set('sort', sortBy);
    if (page > 1) params.set('page', String(page));

    const qs = params.toString();
    router.replace(qs ? `/doctors?${qs}` : '/doctors', { scroll: false });
  }, [
    query,
    specialtyId,
    state,
    maxFee,
    availableToday,
    minRating,
    consultationType,
    sortBy,
    page,
    router,
  ]);

  const filterParams: DoctorFilterParams = {
    query,
    specialtyId,
    state,
    maxFee: maxFee > 0 ? maxFee : undefined,
    availableToday,
    minRating: minRating > 0 ? minRating : undefined,
    consultationType: consultationType || undefined,
    sortBy,
    page,
    pageSize: 6,
  };

  const {
    data: doctorsResult,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['doctors', filterParams],
    queryFn: () => doctorService.getDoctors(filterParams),
  });

  const resetAllFilters = () => {
    setQuery('');
    setSpecialtyId('all');
    setState('all');
    setMaxFee(0);
    setAvailableToday(false);
    setMinRating(0);
    setConsultationType('');
    setSortBy('recommended');
    setPage(1);
  };

  // Active filter chips
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (query.trim()) {
    activeChips.push({
      key: 'q',
      label: `Search: "${query.trim()}"`,
      onRemove: () => {
        setQuery('');
        setPage(1);
      },
    });
  }
  if (specialtyId !== 'all') {
    const sp = specialties.find((s) => s.id === specialtyId);
    activeChips.push({
      key: 'spec',
      label: sp ? sp.name : specialtyId,
      onRemove: () => {
        setSpecialtyId('all');
        setPage(1);
      },
    });
  }
  if (state !== 'all') {
    activeChips.push({
      key: 'state',
      label: state,
      onRemove: () => {
        setState('all');
        setPage(1);
      },
    });
  }
  if (maxFee > 0) {
    activeChips.push({
      key: 'fee',
      label: `Under ${formatNaira(maxFee)}`,
      onRemove: () => {
        setMaxFee(0);
        setPage(1);
      },
    });
  }
  if (availableToday) {
    activeChips.push({
      key: 'today',
      label: 'Available Today',
      onRemove: () => {
        setAvailableToday(false);
        setPage(1);
      },
    });
  }
  if (minRating > 0) {
    activeChips.push({
      key: 'rating',
      label: `${minRating}+ Rating`,
      onRemove: () => {
        setMinRating(0);
        setPage(1);
      },
    });
  }
  if (consultationType) {
    activeChips.push({
      key: 'mode',
      label: consultationType === 'video' ? 'Video Consult' : 'In-Person Visit',
      onRemove: () => {
        setConsultationType('');
        setPage(1);
      },
    });
  }

  const FilterControls = () => (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="filter-specialty"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2"
        >
          Medical Specialty
        </label>
        <select
          id="filter-specialty"
          value={specialtyId}
          onChange={(e) => {
            setSpecialtyId(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
        >
          <option value="all">All Specialties</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="filter-state"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2"
        >
          Location / State
        </label>
        <select
          id="filter-state"
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
        >
          <option value="all">All Locations</option>
          <option value="Lagos">Lagos (VI, Lekki, Ikeja)</option>
          <option value="Abuja (FCT)">Abuja (Maitama, Wuse II)</option>
          <option value="Rivers">Rivers (Port Harcourt)</option>
          <option value="Oyo">Oyo (Ibadan)</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="filter-fee"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2"
        >
          Max Consultation Fee
        </label>
        <select
          id="filter-fee"
          value={maxFee}
          onChange={(e) => {
            setMaxFee(Number(e.target.value));
            setPage(1);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
        >
          <option value={0}>Any Fee</option>
          <option value={15000}>Under ₦15,000</option>
          <option value={20000}>Under ₦20,000</option>
          <option value={25000}>Under ₦25,000</option>
          <option value={30000}>Under ₦30,000</option>
        </select>
      </div>

      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Availability
        </span>
        <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={availableToday}
            onChange={(e) => {
              setAvailableToday(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
          />
          <span>Available Today</span>
        </label>
      </div>

      <div>
        <label
          htmlFor="filter-mode"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2"
        >
          Consultation Type
        </label>
        <select
          id="filter-mode"
          value={consultationType}
          onChange={(e) => {
            setConsultationType(e.target.value as ConsultationType | '');
            setPage(1);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
        >
          <option value="">In-Person or Video</option>
          <option value="in_person">In-Person Clinic Visit</option>
          <option value="video">Video Consultation</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="filter-rating"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2"
        >
          Minimum Patient Rating
        </label>
        <select
          id="filter-rating"
          value={minRating}
          onChange={(e) => {
            setMinRating(Number(e.target.value));
            setPage(1);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
        >
          <option value={0}>Any Rating</option>
          <option value={4.5}>4.5 ★ and above</option>
          <option value={4.8}>4.8 ★ and above</option>
        </select>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={resetAllFilters}
        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
      >
        Reset All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-clinical-50">
      <PublicNavbar />

      <main id="main-content" className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header & Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Find a Verified Doctor</h1>
              <p className="mt-1 text-sm text-slate-600">
                Search by specialist name, clinical condition, hospital, or city across Nigeria.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  aria-label="Search doctors"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Name, specialty, or hospital..."
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="lg:hidden flex-1"
                  onClick={() => setMobileFilterOpen(true)}
                  leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                >
                  Filters {activeChips.length > 0 && `(${activeChips.length})`}
                </Button>

                <label htmlFor="doctor-sort" className="sr-only">
                  Sort doctors
                </label>
                <select
                  id="doctor-sort"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as NonNullable<DoctorFilterParams['sortBy']>)
                  }
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 focus:border-brand-600 focus:outline-none"
                >
                  <option value="recommended">Sort: Recommended</option>
                  <option value="fee_asc">Fee: Lowest to Highest</option>
                  <option value="fee_desc">Fee: Highest to Lowest</option>
                  <option value="rating_desc">Highest Rated</option>
                  <option value="experience_desc">Most Experienced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeChips.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Active filters:</span>
              {activeChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-medium text-brand-800"
                >
                  <span>{chip.label}</span>
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    aria-label={`Remove ${chip.label} filter`}
                    className="rounded-full p-0.5 hover:bg-brand-200/60"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-semibold text-brand-700 hover:underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Desktop Filter Sidebar */}
          <aside
            aria-label="Filter doctors"
            className="hidden lg:block lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5 shadow-card sticky top-24"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Filter className="h-4 w-4 text-brand-600" />
                <span>Filter Results</span>
              </h2>
              {activeChips.length > 0 && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
                  {activeChips.length}
                </span>
              )}
            </div>
            <FilterControls />
          </aside>

          {/* Doctor Cards List */}
          <section className="lg:col-span-9">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
              <span aria-live="polite">
                {isLoading
                  ? 'Searching verified doctors...'
                  : `Showing ${doctorsResult?.items.length || 0} of ${
                      doctorsResult?.total || 0
                    } verified doctor(s)`}
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} className="h-72 w-full" />
                ))}
              </div>
            ) : isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : !doctorsResult || doctorsResult.items.length === 0 ? (
              <EmptyState
                title="No doctors match these filters"
                description="Try broadening your consultation fee range, selecting 'All Locations', or clearing your search query."
                actionLabel="Reset All Filters"
                onAction={resetAllFilters}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {doctorsResult.items.map((doc) => (
                    <DoctorCard key={doc.id} doctor={doc} />
                  ))}
                </div>
                <Pagination
                  page={doctorsResult.page}
                  totalPages={doctorsResult.totalPages}
                  totalItems={doctorsResult.total}
                  pageSize={doctorsResult.pageSize}
                  onPageChange={(next) => setPage(next)}
                />
              </>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Bottom Sheet Drawer for Filters */}
      <Drawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filter Doctors"
        position="bottom"
      >
        <FilterControls />
        <div className="mt-6 pt-4 border-t border-slate-100">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setMobileFilterOpen(false)}
          >
            Apply Filters ({doctorsResult?.total ?? 0} Doctors)
          </Button>
        </div>
      </Drawer>

      <PublicFooter />
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-clinical-50" />}>
      <DoctorsDirectoryContent />
    </Suspense>
  );
}
