export type UserRole = 'patient' | 'doctor' | 'admin';

export type AccountStatus = 'active' | 'pending_verification' | 'suspended';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  status: AccountStatus;
  emailVerified: boolean;
  createdAt: string;
}

export interface EmergencyContact {
  fullName: string;
  relationship: string;
  phone: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  genotype?: 'AA' | 'AS' | 'SS' | 'AC';
  allergies: string[];
  city: string;
  state: string;
  address: string;
  emergencyContact: EmergencyContact;
  activePlanEnrollmentId?: string;
}

export type ConsultationType = 'in_person' | 'video';

export type DoctorVerificationStatus = 'verified' | 'pending' | 'rejected' | 'suspended';

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  doctorCount: number;
}

export interface BreakPeriod {
  startTime: string;
  endTime: string;
}

export interface DayAvailability {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  dayLabel: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  isAvailable: boolean;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: 15 | 30 | 45 | 60;
  breaks: BreakPeriod[];
  consultationTypes: ConsultationType[];
}

export interface Availability {
  doctorId: string;
  timezone: 'Africa/Lagos';
  weeklySchedule: DayAvailability[];
  bookedSlots: Record<string, string[]>;
}

export interface Doctor extends User {
  role: 'doctor';
  title: string;
  specialtyId: string;
  specialtyName: string;
  subSpecialties: string[];
  mdcnNumber: string;
  verificationStatus: DoctorVerificationStatus;
  verificationNote?: string;
  yearsOfExperience: number;
  qualifications: string[];
  about: string;
  languages: string[];
  consultationFee: number;
  videoConsultationFee: number;
  consultationTypes: ConsultationType[];
  facilityId: string;
  facilityName: string;
  clinicAddress: string;
  city: string;
  state: 'Lagos' | 'Abuja (FCT)' | 'Rivers' | 'Oyo';
  rating: number;
  reviewCount: number;
  nextAvailableDate: string;
  availableToday: boolean;
}

export interface Admin extends User {
  role: 'admin';
  department: 'Clinical Operations' | 'Provider Network' | 'Super Admin';
  permissions: string[];
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export interface Appointment {
  id: string;
  bookingReference: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  forDependantId?: string;
  forDependantName?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorTitle: string;
  facilityName: string;
  facilityAddress: string;
  date: string;
  startTime: string;
  endTime: string;
  consultationType: ConsultationType;
  meetingLink?: string;
  consultationFee: number;
  coveredByHmo: boolean;
  copayAmount: number;
  status: AppointmentStatus;
  reasonForVisit: string;
  clinicalNotes?: string;
  cancellationReason?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  doctorId: string;
  patientName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  consultationType: ConsultationType;
  verifiedBooking: boolean;
  createdAt: string;
}

export interface HMOProvider {
  id: string;
  name: string;
  code: string;
  description: string;
  supportPhone: string;
  supportEmail: string;
  accreditedFacilitiesCount: number;
}

export interface HealthPlan {
  id: string;
  name: string;
  slug: string;
  providerId: string;
  providerName: string;
  tier: 'Basic' | 'Standard' | 'Comprehensive' | 'Executive';
  monthlyPrice: number;
  annualPrice: number;
  annualSavingsPercent: number;
  maxDependants: number;
  annualCoverageLimit: number;
  coveredConsultations: string;
  specialistAccess: string;
  emergencyCareBenefits: string;
  dentalBenefits: string;
  opticalBenefits: string;
  medicationBenefits: string;
  labBenefits: string;
  hospitalNetworkTier: 'Tier 1 (General)' | 'Tier 2 (Standard Private)' | 'Tier 3 (Premier Specialist)';
  exclusions: string[];
  termsAndNotes: string[];
  isPopular?: boolean;
}

export type PlanEnrollmentStatus = 'active' | 'expired' | 'cancelled' | 'pending_payment';

export interface PlanEnrollment {
  id: string;
  patientId: string;
  planId: string;
  planName: string;
  providerName: string;
  tier: HealthPlan['tier'];
  networkTier: HealthPlan['hospitalNetworkTier'];
  billingCycle: 'monthly' | 'annual';
  amountPaid: number;
  startDate: string;
  renewalDate: string;
  status: PlanEnrollmentStatus;
  enrolledDependantIds: string[];
  memberId: string;
}

export interface DigitalHealthCard {
  id: string;
  enrollmentId: string;
  memberId: string;
  patientName: string;
  planName: string;
  providerName: string;
  tier: string;
  networkTier: string;
  issueDate: string;
  validUntil: string;
  status: 'active' | 'inactive';
  dependantsCount: number;
  emergencyHelpline: string;
}

export type DependantRelationship = 'spouse' | 'child' | 'parent' | 'other';

export interface Dependant {
  id: string;
  primaryPatientId: string;
  fullName: string;
  relationship: DependantRelationship;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  genotype?: string;
  allergies: string[];
  coveredUnderPlan: boolean;
  memberSubId?: string;
}

export type MedicalRecordCategory =
  | 'diagnosis'
  | 'visit_summary'
  | 'lab_result'
  | 'document';

export interface MedicalRecord {
  id: string;
  patientId: string;
  category: MedicalRecordCategory;
  title: string;
  summary: string;
  details: Record<string, string>;
  doctorName: string;
  doctorSpecialty: string;
  facilityName: string;
  date: string;
  attachmentFileName?: string;
  status: 'final' | 'preliminary' | 'archived';
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  dateIssued: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'active' | 'completed' | 'cancelled';
  refillsRemaining: number;
}

export interface LabTest {
  id: string;
  code: string;
  name: string;
  category: 'Haematology' | 'Biochemistry' | 'Microbiology' | 'Hormonal' | 'Imaging';
  description: string;
  sampleType: 'Blood' | 'Urine' | 'Swab' | 'Imaging';
  fastingRequired: boolean;
  preparationInstructions: string;
  turnaroundTime: string;
  price: number;
}

export interface LabBooking {
  id: string;
  bookingReference: string;
  patientId: string;
  patientName: string;
  forDependantId?: string;
  forDependantName?: string;
  labTestId: string;
  labTestName: string;
  labTestCode: string;
  facilityId: string;
  facilityName: string;
  date: string;
  timeSlot: string;
  price: number;
  status: 'scheduled' | 'sample_collected' | 'processing' | 'result_ready' | 'cancelled';
  resultSummary?: string;
  paymentId?: string;
  createdAt: string;
}

export type FacilityType = 'hospital' | 'clinic' | 'diagnostic_center' | 'pharmacy';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  city: string;
  state: 'Lagos' | 'Abuja (FCT)' | 'Rivers' | 'Oyo';
  phone: string;
  email: string;
  openingHours: string;
  is24Hours: boolean;
  hasEmergencyUnit: boolean;
  services: string[];
  acceptedHmoProviders: string[];
  networkTier: 'Tier 1 (General)' | 'Tier 2 (Standard Private)' | 'Tier 3 (Premier Specialist)';
  rating: number;
  reviewCount: number;
  coordinates: { lat: number; lng: number };
}

export type PaymentCategory = 'consultation' | 'hmo_subscription' | 'lab_test';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  reference: string;
  patientId: string;
  patientName: string;
  category: PaymentCategory;
  title: string;
  description: string;
  amount: number;
  currency: 'NGN';
  status: PaymentStatus;
  method: 'Card' | 'Bank Transfer' | 'HMO Cover' | 'USSD';
  provider: 'MedClux MockGateway (Paystack-Ready)';
  relatedEntityId: string;
  createdAt: string;
}

export interface Transaction extends Payment {
  receiptNumber: string;
  breakdown: { label: string; amount: number }[];
}

export type NotificationType =
  | 'appointment_confirmed'
  | 'appointment_reminder'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'doctor_availability'
  | 'hmo_confirmed'
  | 'plan_renewal'
  | 'payment_success'
  | 'lab_result_ready';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface DoctorFilterParams {
  query?: string;
  specialtyId?: string;
  state?: string;
  maxFee?: number;
  availableToday?: boolean;
  minRating?: number;
  consultationType?: ConsultationType;
  sortBy?: 'recommended' | 'fee_asc' | 'fee_desc' | 'rating_desc' | 'experience_desc';
  page?: number;
  pageSize?: number;
  includeUnverified?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DemoAccountMeta {
  role: UserRole;
  email: string;
  label: string;
  name: string;
  subtitle: string;
}
