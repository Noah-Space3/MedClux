'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import {
  Avatar,
  Button,
  Input,
  Skeleton,
  Textarea,
  VerificationBadge,
} from '@/components/ui';
import { doctorService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

export default function DoctorProfileManagePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const doctorId = user?.role === 'doctor' ? user.id : 'doc-1';

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorService.getDoctorById(doctorId),
  });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [consultationFee, setConsultationFee] = useState(25000);
  const [videoFee, setVideoFee] = useState(20000);
  const [clinicAddress, setClinicAddress] = useState('');
  const [about, setAbout] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.doctor) {
      setFullName(data.doctor.fullName);
      setPhone(data.doctor.phone);
      setConsultationFee(data.doctor.consultationFee);
      setVideoFee(data.doctor.videoConsultationFee);
      setClinicAddress(data.doctor.clinicAddress);
      setAbout(data.doctor.about);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorService.updateDoctorProfile(doctorId, {
        fullName,
        phone,
        consultationFee: Number(consultationFee),
        videoConsultationFee: Number(videoFee),
        clinicAddress,
        about,
      });
      queryClient.invalidateQueries({ queryKey: ['doctor', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      showToast({
        title: 'Doctor Profile Updated',
        description: 'Your consultation fees and biography are now live.',
        variant: 'success',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceShell
      requiredRole="doctor"
      title="Practice Profile & Consultation Fees"
      subtitle="Manage your public specialist profile, consultation fees (₦), and biography"
    >
      {isLoading || !data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <Avatar name={`${data.doctor.title} ${data.doctor.fullName}`} size="lg" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {data.doctor.title} {data.doctor.fullName}
                </h2>
                <p className="text-xs text-brand-700 font-semibold">
                  {data.doctor.specialtyName} • {data.doctor.mdcnNumber}
                </p>
              </div>
            </div>
            <VerificationBadge status={data.doctor.verificationStatus} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Contact Phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="In-Person Consultation Fee (₦)"
              type="number"
              min={5000}
              step={1000}
              required
              value={consultationFee}
              onChange={(e) => setConsultationFee(Number(e.target.value))}
            />
            <Input
              label="Video Consultation Fee (₦)"
              type="number"
              min={5000}
              step={1000}
              required
              value={videoFee}
              onChange={(e) => setVideoFee(Number(e.target.value))}
            />
            <div className="sm:col-span-2">
              <Input
                label="Hospital / Clinic Address"
                required
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Clinical Biography & Sub-Specialties"
                rows={4}
                required
                value={about}
                onChange={(e) => setAbout(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Practice Settings
            </Button>
          </div>
        </form>
      )}
    </WorkspaceShell>
  );
}
