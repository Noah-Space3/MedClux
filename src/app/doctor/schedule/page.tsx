'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Save } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Badge, Button, Skeleton } from '@/components/ui';
import { doctorService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { DayAvailability } from '@/types/domain';

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const doctorId = user?.role === 'doctor' ? user.id : 'doc-1';

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorService.getDoctorById(doctorId),
  });

  const [schedule, setSchedule] = useState<DayAvailability[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.availability?.weeklySchedule) {
      setSchedule(structuredClone(data.availability.weeklySchedule));
    }
  }, [data]);

  const updateDay = (dayOfWeek: number, patch: Partial<DayAvailability>) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await doctorService.updateDoctorSchedule(doctorId, schedule);
      queryClient.invalidateQueries({ queryKey: ['doctor', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['doctorSlots'] });
      showToast({
        title: 'Clinic Schedule Updated',
        description: 'Your working hours and slot durations are now live for patient bookings.',
        variant: 'success',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceShell
      requiredRole="doctor"
      title="Clinic Schedule & Availability"
      subtitle="Configure your working days, opening/closing hours, appointment duration, and break periods"
      actions={
        <Button
          variant="primary"
          size="sm"
          isLoading={saving}
          onClick={handleSave}
          leftIcon={<Save className="h-4 w-4" />}
        >
          Save Weekly Schedule
        </Button>
      }
    >
      {isLoading || schedule.length === 0 ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Weekly Consultation Hours (West Africa Time — Africa/Lagos)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Changes immediately govern available time slots on your public doctor profile.
              </p>
            </div>
            <Badge variant="brand" icon={<Clock className="h-3.5 w-3.5 text-brand-600" />}>
              WAT (UTC+1)
            </Badge>
          </div>

          <div className="divide-y divide-slate-100">
            {schedule.map((day) => (
              <div
                key={day.dayOfWeek}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-[170px]">
                  <input
                    type="checkbox"
                    id={`day-${day.dayOfWeek}`}
                    checked={day.isAvailable}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, { isAvailable: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                  />
                  <label
                    htmlFor={`day-${day.dayOfWeek}`}
                    className="text-sm font-bold text-slate-900 cursor-pointer"
                  >
                    {day.dayLabel}
                  </label>
                </div>

                {!day.isAvailable ? (
                  <span className="text-xs font-medium text-slate-400 italic">
                    Unavailable (No patient slots generated)
                  </span>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 max-w-2xl text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">Opening Time</span>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) =>
                          updateDay(day.dayOfWeek, { openTime: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Closing Time</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) =>
                          updateDay(day.dayOfWeek, { closeTime: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Slot Duration</span>
                      <select
                        value={day.slotDurationMinutes}
                        onChange={(e) =>
                          updateDay(day.dayOfWeek, {
                            slotDurationMinutes: Number(
                              e.target.value
                            ) as DayAvailability['slotDurationMinutes'],
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                      >
                        <option value={15}>15 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                        <option value={60}>60 mins</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Break Window</span>
                      <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700 font-medium">
                        {day.breaks[0]?.startTime || '13:00'} – {day.breaks[0]?.endTime || '14:00'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
