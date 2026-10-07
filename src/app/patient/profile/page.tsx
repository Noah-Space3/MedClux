'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Save } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Avatar, Button, Input, Select, Skeleton } from '@/components/ui';
import { adminService, patientService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { NIGERIAN_PHONE_REGEX } from '@/lib/utils';

const profileSchema = z.object({
  fullName: z.string().min(3, 'Full name is required'),
  phone: z
    .string()
    .regex(NIGERIAN_PHONE_REGEX, 'Enter a valid Nigerian phone number (+234... or 080...)'),
  dateOfBirth: z.string().min(4, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  genotype: z.enum(['AA', 'AS', 'SS', 'AC']),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  address: z.string().min(5, 'Residential address is required'),
  emergencyName: z.string().min(3, 'Emergency contact name is required'),
  emergencyRelationship: z.string().min(2, 'Relationship is required'),
  emergencyPhone: z
    .string()
    .regex(NIGERIAN_PHONE_REGEX, 'Enter a valid Nigerian phone number'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function PatientProfilePage() {
  const { user, refreshSession } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const patientId = user?.id || 'pat-1';

  const { data: profile, isLoading } = useQuery({
    queryKey: ['patientProfile', patientId],
    queryFn: () => patientService.getPatientProfile(patientId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup || 'O+',
        genotype: profile.genotype || 'AA',
        city: profile.city,
        state: profile.state,
        address: profile.address,
        emergencyName: profile.emergencyContact?.fullName || 'Obinna Okafor',
        emergencyRelationship: profile.emergencyContact?.relationship || 'Spouse',
        emergencyPhone: profile.emergencyContact?.phone || '+2348091122334',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    await patientService.updatePatientProfile(patientId, {
      fullName: values.fullName,
      phone: values.phone,
      dateOfBirth: values.dateOfBirth,
      gender: values.gender,
      bloodGroup: values.bloodGroup,
      genotype: values.genotype,
      city: values.city,
      state: values.state,
      address: values.address,
      emergencyContact: {
        fullName: values.emergencyName,
        relationship: values.emergencyRelationship,
        phone: values.emergencyPhone,
      },
    });
    await refreshSession();
    queryClient.invalidateQueries({ queryKey: ['patientProfile'] });
    showToast({
      title: 'Profile saved',
      description: 'Your personal and emergency contact information has been updated.',
      variant: 'success',
    });
  };

  const handleResetDemo = async () => {
    await adminService.resetDemoDatabase();
    queryClient.invalidateQueries();
    showToast({
      title: 'Demo database restored',
      description: 'All MedClux seed data has been reset to initial state.',
      variant: 'info',
    });
  };

  return (
    <WorkspaceShell
      requiredRole="patient"
      title="Patient Profile & Settings"
      subtitle="Manage your personal demographics, medical profile, and emergency contact"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetDemo}
          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
        >
          Reset Demo Data
        </Button>
      }
    >
      {isLoading || !profile ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl" noValidate>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
              <Avatar name={profile.fullName} size="lg" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">{profile.fullName}</h2>
                <p className="text-xs text-slate-500">{profile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <Input
                label="Phone Number (Nigeria)"
                required
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input
                label="Date of Birth"
                type="date"
                required
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
              <Select
                label="Gender"
                options={[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                  { value: 'other', label: 'Other' },
                ]}
                error={errors.gender?.message}
                {...register('gender')}
              />
              <Select
                label="Blood Group"
                options={[
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' },
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'AB+', label: 'AB+' },
                ]}
                error={errors.bloodGroup?.message}
                {...register('bloodGroup')}
              />
              <Select
                label="Genotype"
                options={[
                  { value: 'AA', label: 'AA' },
                  { value: 'AS', label: 'AS' },
                  { value: 'SS', label: 'SS' },
                  { value: 'AC', label: 'AC' },
                ]}
                error={errors.genotype?.message}
                {...register('genotype')}
              />
              <Input
                label="City / Area"
                required
                error={errors.city?.message}
                {...register('city')}
              />
              <Input
                label="State"
                required
                error={errors.state?.message}
                {...register('state')}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Residential Address"
                  required
                  error={errors.address?.message}
                  {...register('address')}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Emergency Contact</h2>
              <p className="text-xs text-slate-500">
                Contacted by partner hospitals in the event of an urgent clinical situation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Contact Full Name"
                required
                error={errors.emergencyName?.message}
                {...register('emergencyName')}
              />
              <Input
                label="Relationship"
                required
                error={errors.emergencyRelationship?.message}
                {...register('emergencyRelationship')}
              />
              <Input
                label="Emergency Phone"
                required
                error={errors.emergencyPhone?.message}
                {...register('emergencyPhone')}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Patient Profile
              </Button>
            </div>
          </section>
        </form>
      )}
    </WorkspaceShell>
  );
}
