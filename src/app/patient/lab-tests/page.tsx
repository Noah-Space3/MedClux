'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FlaskConical,
  Search,
} from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
} from '@/components/ui';
import { facilityService, labTestService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { LabTest } from '@/types/domain';
import { formatDate, formatNaira } from '@/lib/utils';

export default function PatientLabTestsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const patientId = user?.id || 'pat-1';

  const [activeTab, setActiveTab] = useState<'catalog' | 'bookings'>('catalog');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [facilityId, setFacilityId] = useState('fac-5');
  const [date, setDate] = useState('2026-10-03');
  const [timeSlot, setTimeSlot] = useState('08:30');
  const [bookingLoading, setBookingLoading] = useState(false);

  const { data: tests = [], isLoading: loadingTests } = useQuery({
    queryKey: ['labTests', { query, category }],
    queryFn: () => labTestService.getLabTests({ query, category }),
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['labBookings', patientId],
    queryFn: () => labTestService.getLabBookings(patientId),
  });

  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities', 'diagnostic'],
    queryFn: () => facilityService.getFacilities(),
  });

  const handleBookTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;
    setBookingLoading(true);
    try {
      const res = await labTestService.bookLabTest({
        patientId,
        labTestId: selectedTest.id,
        facilityId,
        date,
        timeSlot,
      });
      queryClient.invalidateQueries({ queryKey: ['labBookings'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast({
        title: 'Diagnostic Test Booked!',
        description: `Reference: ${res.booking.bookingReference}`,
        variant: 'success',
      });
      setSelectedTest(null);
      setActiveTab('bookings');
    } catch (err) {
      showToast({
        title: 'Booking failed',
        description: err instanceof Error ? err.message : 'Unable to book test.',
        variant: 'error',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <WorkspaceShell
      requiredRole="patient"
      title="Diagnostic Lab Tests"
      subtitle="Browse laboratory panels, book sample collection at partner centers, and view results"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold ${
              activeTab === 'catalog'
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            Browse Diagnostic Tests ({tests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold ${
              activeTab === 'bookings'
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            My Lab Bookings & Results ({bookings.length})
          </button>
        </div>

        {activeTab === 'catalog' ? (
          <div className="space-y-5">
            {/* Search & Category Filter */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  aria-label="Search lab tests"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search test name or code (e.g., Lipid Profile, FBC, Malaria, HbA1c)..."
                  className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
              <select
                aria-label="Filter by test category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
              >
                <option value="all">All Categories</option>
                <option value="Haematology">Haematology</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Hormonal">Hormonal</option>
              </select>
            </div>

            {loadingTests ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} className="h-52 w-full" />
                ))}
              </div>
            ) : tests.length === 0 ? (
              <EmptyState
                title="No diagnostic tests match your search"
                description="Try clearing your search keyword or selecting All Categories."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-card flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="brand">{test.category}</Badge>
                        <span className="text-xs font-mono text-slate-400">{test.code}</span>
                      </div>
                      <h3 className="mt-2 text-base font-bold text-slate-900">{test.name}</h3>
                      <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {test.description}
                      </p>

                      <div className="mt-4 rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                          <span>
                            Turnaround: <strong>{test.turnaroundTime}</strong> • Sample:{' '}
                            <strong>{test.sampleType}</strong>
                          </span>
                        </p>
                        <p className="flex items-start gap-1.5">
                          {test.fastingRequired ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          <span>{test.preparationInstructions}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] uppercase text-slate-400 block">
                          Test Fee
                        </span>
                        <strong className="text-base font-bold text-slate-900">
                          {formatNaira(test.price)}
                        </strong>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedTest(test)}
                        leftIcon={<FlaskConical className="h-3.5 w-3.5" />}
                      >
                        Book Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {loadingBookings ? (
              <Skeleton className="h-44 w-full" />
            ) : bookings.length === 0 ? (
              <EmptyState
                title="No lab bookings yet"
                description="Book a diagnostic panel from the catalog to schedule sample collection."
                actionLabel="Browse Diagnostic Tests"
                onAction={() => setActiveTab('catalog')}
              />
            ) : (
              bookings.map((bk) => (
                <div
                  key={bk.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-card space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-slate-500">
                        {bk.bookingReference} • {bk.labTestCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{bk.labTestName}</h3>
                      <p className="text-xs text-slate-600">
                        {bk.facilityName} • {formatDate(bk.date)} at {bk.timeSlot} AM
                      </p>
                    </div>
                    <Badge
                      variant={bk.status === 'result_ready' ? 'success' : 'brand'}
                    >
                      {bk.status === 'result_ready' ? 'Result Ready' : 'Scheduled'}
                    </Badge>
                  </div>

                  {bk.resultSummary && (
                    <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-3 text-xs text-emerald-950">
                      <strong>Result Summary:</strong> {bk.resultSummary}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Book Lab Test Modal */}
      <Modal
        isOpen={Boolean(selectedTest)}
        onClose={() => setSelectedTest(null)}
        title={selectedTest ? `Book: ${selectedTest.name}` : 'Book Diagnostic Test'}
        description={
          selectedTest
            ? `${selectedTest.code} • Fee: ${formatNaira(selectedTest.price)}`
            : ''
        }
      >
        {selectedTest && (
          <form onSubmit={handleBookTest} className="space-y-4">
            {selectedTest.fastingRequired && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <strong>Preparation Notice:</strong> {selectedTest.preparationInstructions}
              </div>
            )}

            <Select
              label="Select Accredited Diagnostic Facility"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              options={facilities.map((f) => ({
                value: f.id,
                label: `${f.name} (${f.city})`,
              }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Sample Collection Date"
                type="date"
                min="2026-09-30"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Select
                label="Preferred Morning Slot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                options={[
                  { value: '07:30', label: '07:30 AM (Fasting Ideal)' },
                  { value: '08:30', label: '08:30 AM (Fasting Ideal)' },
                  { value: '10:00', label: '10:00 AM' },
                  { value: '11:30', label: '11:30 AM' },
                ]}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                Total: {formatNaira(selectedTest.price)}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedTest(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={bookingLoading}>
                  Pay & Confirm Lab Slot
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </WorkspaceShell>
  );
}
