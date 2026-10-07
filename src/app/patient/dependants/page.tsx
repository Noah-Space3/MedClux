'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
} from '@/components/ui';
import { dependantService, healthPlanService } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Dependant, DependantRelationship } from '@/types/domain';
import { formatDate } from '@/lib/utils';

export default function PatientDependantsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const patientId = user?.id || 'pat-1';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDependant, setEditingDependant] = useState<Dependant | null>(null);
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState<DependantRelationship>('child');
  const [dateOfBirth, setDateOfBirth] = useState('2020-05-15');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [genotype, setGenotype] = useState('AA');
  const [saving, setSaving] = useState(false);

  const { data: dependants = [], isLoading } = useQuery({
    queryKey: ['dependants', patientId],
    queryFn: () => dependantService.getDependants(patientId),
  });

  const { data: activePlanData } = useQuery({
    queryKey: ['activePlan', patientId],
    queryFn: () => healthPlanService.getPatientActivePlan(patientId),
  });

  const maxAllowed = activePlanData?.plan?.maxDependants ?? 4;
  const limitReached = dependants.length >= maxAllowed;

  const openAddModal = () => {
    setEditingDependant(null);
    setFullName('');
    setRelationship('child');
    setDateOfBirth('2020-05-15');
    setGender('female');
    setBloodGroup('O+');
    setGenotype('AA');
    setModalOpen(true);
  };

  const openEditModal = (dep: Dependant) => {
    setEditingDependant(dep);
    setFullName(dep.fullName);
    setRelationship(dep.relationship);
    setDateOfBirth(dep.dateOfBirth);
    setGender(dep.gender);
    setBloodGroup(dep.bloodGroup || 'O+');
    setGenotype(dep.genotype || 'AA');
    setModalOpen(true);
  };

  const handleSaveDependant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 3) {
      showToast({
        title: 'Validation error',
        description: 'Please enter the dependant’s full name.',
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingDependant) {
        await dependantService.updateDependant(editingDependant.id, {
          fullName: fullName.trim(),
          relationship,
          dateOfBirth,
          gender,
          bloodGroup,
          genotype,
        });
        showToast({
          title: 'Dependant updated',
          description: `${fullName}’s profile was updated.`,
          variant: 'success',
        });
      } else {
        await dependantService.addDependant({
          primaryPatientId: patientId,
          fullName: fullName.trim(),
          relationship,
          dateOfBirth,
          gender,
          bloodGroup,
          genotype,
        });
        showToast({
          title: 'Dependant added',
          description: `${fullName} is now linked to your family profile.`,
          variant: 'success',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['dependants'] });
      queryClient.invalidateQueries({ queryKey: ['activePlan'] });
      setModalOpen(false);
    } catch (err) {
      showToast({
        title: 'Cannot add dependant',
        description: err instanceof Error ? err.message : 'Operation failed.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (dep: Dependant) => {
    await dependantService.removeDependant(dep.id);
    queryClient.invalidateQueries({ queryKey: ['dependants'] });
    queryClient.invalidateQueries({ queryKey: ['activePlan'] });
    showToast({
      title: 'Dependant removed',
      description: `${dep.fullName} was removed from your account.`,
      variant: 'info',
    });
  };

  return (
    <WorkspaceShell
      requiredRole="patient"
      title="Family & Dependants"
      subtitle="Add and manage family members for appointment bookings and HMO plan coverage"
      actions={
        <Button
          variant="primary"
          size="sm"
          disabled={limitReached}
          onClick={openAddModal}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          {limitReached ? `Limit Reached (${maxAllowed}/${maxAllowed})` : 'Add Dependant'}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Quota Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Dependant Allowance: {dependants.length} of {maxAllowed} Slots Used
              </h2>
              <p className="text-xs text-slate-500">
                {activePlanData?.plan
                  ? `Covered under ${activePlanData.plan.name}`
                  : 'Standard family profile allowance'}
              </p>
            </div>
          </div>
          {limitReached && (
            <Badge variant="warning">
              Maximum dependants reached for current plan tier
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : dependants.length === 0 ? (
          <EmptyState
            title="No dependants added yet"
            description="Add your spouse, children, or parents to book consultations on their behalf and include them in your HMO coverage."
            actionLabel="Add First Dependant"
            onAction={openAddModal}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {dependants.map((dep) => (
              <div
                key={dep.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={dep.fullName} size="md" />
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{dep.fullName}</h3>
                        <p className="text-xs text-slate-500 capitalize">
                          {dep.relationship} • {dep.gender} • Born {formatDate(dep.dateOfBirth)}
                        </p>
                      </div>
                    </div>
                    {dep.coveredUnderPlan ? (
                      <Badge
                        variant="success"
                        icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
                      >
                        HMO Covered
                      </Badge>
                    ) : (
                      <Badge variant="default">Self-Pay</Badge>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-xs border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Blood Group</span>
                      <strong className="text-slate-800">{dep.bloodGroup || 'O+'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Genotype</span>
                      <strong className="text-slate-800">{dep.genotype || 'AA'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Member Sub-ID</span>
                      <strong className="font-mono text-slate-800">
                        {dep.memberSubId || '—'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(dep)}
                    leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleRemove(dep)}
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Dependant Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDependant ? 'Edit Dependant' : 'Add Family Dependant'}
        description="Dependants can be selected during doctor appointment and lab test bookings."
      >
        <form onSubmit={handleSaveDependant} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g., Obinna Okafor"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as DependantRelationship)}
              options={[
                { value: 'spouse', label: 'Spouse' },
                { value: 'child', label: 'Child' },
                { value: 'parent', label: 'Parent' },
                { value: 'other', label: 'Other Dependant' },
              ]}
            />
            <Input
              label="Date of Birth"
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Select
              label="Blood Group"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              options={[
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
                { value: 'A+', label: 'A+' },
                { value: 'B+', label: 'B+' },
                { value: 'AB+', label: 'AB+' },
              ]}
            />
            <Select
              label="Genotype"
              value={genotype}
              onChange={(e) => setGenotype(e.target.value)}
              options={[
                { value: 'AA', label: 'AA' },
                { value: 'AS', label: 'AS' },
                { value: 'SS', label: 'SS' },
                { value: 'AC', label: 'AC' },
              ]}
            />
          </div>
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {editingDependant ? 'Save Changes' : 'Add Dependant'}
            </Button>
          </div>
        </form>
      </Modal>
    </WorkspaceShell>
  );
}
