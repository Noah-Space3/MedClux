import {
  SEED_ADMINS,
  SEED_APPOINTMENTS,
  SEED_AVAILABILITIES,
  SEED_DEPENDANTS,
  SEED_DIGITAL_CARDS,
  SEED_DOCTORS,
  SEED_ENROLLMENTS,
  SEED_FACILITIES,
  SEED_HEALTH_PLANS,
  SEED_HMO_PROVIDERS,
  SEED_LAB_BOOKINGS,
  SEED_LAB_TESTS,
  SEED_MEDICAL_RECORDS,
  SEED_NOTIFICATIONS,
  SEED_PATIENTS,
  SEED_PRESCRIPTIONS,
  SEED_REVIEWS,
  SEED_SPECIALTIES,
  SEED_TRANSACTIONS,
} from './seedData';
import {
  Admin,
  Appointment,
  Availability,
  Dependant,
  DigitalHealthCard,
  Doctor,
  Facility,
  HealthPlan,
  HMOProvider,
  LabBooking,
  LabTest,
  MedicalRecord,
  Notification,
  Patient,
  PlanEnrollment,
  Prescription,
  Review,
  Specialty,
  Transaction,
} from '@/types/domain';

const STORAGE_KEY = 'medclux_store_v1';
const SESSION_KEY = 'medclux_session_v1';

export interface MockDatabaseSchema {
  patients: Patient[];
  doctors: Doctor[];
  admins: Admin[];
  specialties: Specialty[];
  availabilities: Availability[];
  appointments: Appointment[];
  reviews: Review[];
  hmoProviders: HMOProvider[];
  healthPlans: HealthPlan[];
  enrollments: PlanEnrollment[];
  digitalCards: DigitalHealthCard[];
  dependants: Dependant[];
  medicalRecords: MedicalRecord[];
  prescriptions: Prescription[];
  labTests: LabTest[];
  labBookings: LabBooking[];
  facilities: Facility[];
  transactions: Transaction[];
  notifications: Notification[];
}

function getInitialData(): MockDatabaseSchema {
  return {
    patients: structuredClone(SEED_PATIENTS),
    doctors: structuredClone(SEED_DOCTORS),
    admins: structuredClone(SEED_ADMINS),
    specialties: structuredClone(SEED_SPECIALTIES),
    availabilities: structuredClone(SEED_AVAILABILITIES),
    appointments: structuredClone(SEED_APPOINTMENTS),
    reviews: structuredClone(SEED_REVIEWS),
    hmoProviders: structuredClone(SEED_HMO_PROVIDERS),
    healthPlans: structuredClone(SEED_HEALTH_PLANS),
    enrollments: structuredClone(SEED_ENROLLMENTS),
    digitalCards: structuredClone(SEED_DIGITAL_CARDS),
    dependants: structuredClone(SEED_DEPENDANTS),
    medicalRecords: structuredClone(SEED_MEDICAL_RECORDS),
    prescriptions: structuredClone(SEED_PRESCRIPTIONS),
    labTests: structuredClone(SEED_LAB_TESTS),
    labBookings: structuredClone(SEED_LAB_BOOKINGS),
    facilities: structuredClone(SEED_FACILITIES),
    transactions: structuredClone(SEED_TRANSACTIONS),
    notifications: structuredClone(SEED_NOTIFICATIONS),
  };
}

let memoryStore: MockDatabaseSchema | null = null;

export function getDb(): MockDatabaseSchema {
  if (typeof window === 'undefined') {
    if (!memoryStore) {
      memoryStore = getInitialData();
    }
    return memoryStore;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDatabaseSchema;
      memoryStore = parsed;
      return parsed;
    }
  } catch {
    // ignore storage errors
  }

  const initial = getInitialData();
  memoryStore = initial;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {
    // ignore quota errors
  }
  return initial;
}

export function saveDb(next: MockDatabaseSchema): void {
  memoryStore = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }
}

export function resetDb(): MockDatabaseSchema {
  const initial = getInitialData();
  saveDb(initial);
  return initial;
}

export interface StoredSession {
  userId: string;
  role: 'patient' | 'doctor' | 'admin';
  email: string;
  issuedAt: string;
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function setStoredSession(session: StoredSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      window.localStorage.removeItem(SESSION_KEY);
    } else {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // ignore
  }
}

export async function simulateLatency(ms = 160): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
