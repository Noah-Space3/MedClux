'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw, Search } from 'lucide-react';
import { PublicFooter, PublicNavbar } from '@/components/layout/PublicLayout';
import { FacilityCard } from '@/components/domain/cards';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { facilityService } from '@/services/api';
import { FacilityType } from '@/types/domain';

export default function FacilitiesDirectoryPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<FacilityType | 'all'>('all');
  const [state, setState] = useState('all');
  const [hmoProvider, setHmoProvider] = useState('all');
  const [only24Hours, setOnly24Hours] = useState(false);

  const { data: facilities = [], isLoading } = useQuery({
    queryKey: ['facilities', { query, type, state, hmoProvider, only24Hours }],
    queryFn: () =>
      facilityService.getFacilities({
        query,
        type,
        state,
        hmoProvider,
        only24Hours,
      }),
  });

  const resetFilters = () => {
    setQuery('');
    setType('all');
    setState('all');
    setHmoProvider('all');
    setOnly24Hours(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-clinical-50">
      <PublicNavbar />

      <main id="main-content" className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Healthcare Facility Directory
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Discover accredited hospitals, specialist clinics, diagnostic centers, and pharmacies
              across Nigeria.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                aria-label="Search facilities"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Facility name, service, or area (e.g., Lekki, MRI, Pharmacy)..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter by facility type"
              value={type}
              onChange={(e) => setType(e.target.value as FacilityType | 'all')}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
              <option value="all">All Facility Types</option>
              <option value="hospital">Hospitals</option>
              <option value="clinic">Outpatient Clinics</option>
              <option value="diagnostic_center">Diagnostic Centers</option>
              <option value="pharmacy">Pharmacies</option>
            </select>

            <select
              aria-label="Filter by state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
              <option value="all">All States</option>
              <option value="Lagos">Lagos</option>
              <option value="Abuja (FCT)">Abuja (FCT)</option>
              <option value="Rivers">Rivers (Port Harcourt)</option>
              <option value="Oyo">Oyo (Ibadan)</option>
            </select>

            <select
              aria-label="Filter by HMO network"
              value={hmoProvider}
              onChange={(e) => setHmoProvider(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
              <option value="all">All HMO Networks</option>
              <option value="ReliaCare">ReliaCare HMO</option>
              <option value="AegisHealth">AegisHealth Nigeria</option>
              <option value="ZumaHealth">ZumaHealth Assurance</option>
            </select>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={only24Hours}
                onChange={(e) => setOnly24Hours(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
              />
              <span>Show only 24-Hour facilities</span>
            </label>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            >
              Reset Filters
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Skeleton key={n} className="h-64 w-full" />
              ))}
            </div>
          ) : facilities.length === 0 ? (
            <EmptyState
              title="No healthcare facilities match your filters"
              description="Try clearing your search or selecting 'All Facility Types'."
              actionLabel="Reset Facility Filters"
              onAction={resetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {facilities.map((fac) => (
                <FacilityCard key={fac.id} facility={fac} />
              ))}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
