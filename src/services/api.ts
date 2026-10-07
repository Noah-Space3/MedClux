import {
  getDb,
  getStoredSession,
  resetDb,
  saveDb,
  setStoredSession,
  simulateLatency,
} from '@/mocks/db';
import { DEMO_ACCOUNTS } from '@/mocks/seedData';
import { addMinutesToTime, generateReference, isFutureOrTodayDate } from '@/lib/utils';
import {
  Admin,
  Appointment,
  AppointmentStatus,
  Availability,
  ConsultationType,
  DayAvailability,
  DemoAccountMeta,
  Dependant,
  DigitalHealthCard,
  Doctor,
  DoctorFilterParams,
  DoctorVerificationStatus,
  Facility,
  FacilityType,
  HealthPlan,
  LabBooking,
  LabTest,
  MedicalRecord,
  Notification,
  PaginatedResult,
  Patient,
  PlanEnrollment,
  Prescription,
  Review,
  Specialty,
  Transaction,
  User,
  UserRole,
} from '@/types/domain';

function findUserByEmail(email: string): User | Patient | Doctor | Admin | null {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  return (
    db.patients.find((u) => u.email.toLowerCase() === normalized) ||
    db.doctors.find((u) => u.email.toLowerCase() === normalized) ||
    db.admins.find((u) => u.email.toLowerCase() === normalized) ||
    null
  );
}

function findUserById(id: string): User | Patient | Doctor | Admin | null {
  const db = getDb();
  return (
    db.patients.find((u) => u.id === id) ||
    db.doctors.find((u) => u.id === id) ||
    db.admins.find((u) => u.id === id) ||
    null
  );
}

export const authService = {
  getDemoAccounts(): DemoAccountMeta[] {
    return DEMO_ACCOUNTS;
  },

  async getCurrentSession(): Promise<{ user: User | Patient | Doctor | Admin } | null> {
    await simulateLatency(60);
    const stored = getStoredSession();
    if (!stored) return null;
    const user = findUserById(stored.userId);
    if (!user) {
      setStoredSession(null);
      return null;
    }
    return { user };
  },

  async login(email: string, _password: string): Promise<{ user: User | Patient | Doctor | Admin }> {
    await simulateLatency(220);
    const user = findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password. Try one of the MedClux demo accounts below.');
    }
    if (user.status === 'suspended') {
      throw new Error('This account has been suspended by MedClux Clinical Operations.');
    }
    setStoredSession({
      userId: user.id,
      role: user.role,
      email: user.email,
      issuedAt: new Date().toISOString(),
    });
    return { user };
  },

  async loginWithDemoRole(role: UserRole): Promise<{ user: User | Patient | Doctor | Admin }> {
    const demo = DEMO_ACCOUNTS.find((d) => d.role === role);
    if (!demo) throw new Error('Demo account not configured.');
    return this.login(demo.email, 'demo1234');
  },

  async register(payload: {
    role: 'patient' | 'doctor';
    fullName: string;
    email: string;
    phone: string;
    password: string;
    specialtyId?: string;
    mdcnNumber?: string;
    city?: string;
    state?: 'Lagos' | 'Abuja (FCT)' | 'Rivers' | 'Oyo';
  }): Promise<{ user: Patient | Doctor }> {
    await simulateLatency(280);
    const existing = findUserByEmail(payload.email);
    if (existing) {
      throw new Error('An account with this email address already exists on MedClux.');
    }
    const db = getDb();

    if (payload.role === 'patient') {
      const newPatient: Patient = {
        id: `pat-${Date.now()}`,
        email: payload.email.trim().toLowerCase(),
        fullName: payload.fullName.trim(),
        phone: payload.phone.trim(),
        role: 'patient',
        status: 'active',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        dateOfBirth: '1995-01-01',
        gender: 'female',
        bloodGroup: 'O+',
        genotype: 'AA',
        allergies: [],
        city: payload.city || 'Lekki Phase 1',
        state: payload.state || 'Lagos',
        address: `${payload.city || 'Lekki'}, ${payload.state || 'Lagos'}`,
        emergencyContact: {
          fullName: '',
          relationship: '',
          phone: '',
        },
      };
      db.patients.unshift(newPatient);
      saveDb(db);
      setStoredSession({
        userId: newPatient.id,
        role: 'patient',
        email: newPatient.email,
        issuedAt: new Date().toISOString(),
      });
      return { user: newPatient };
    } else {
      const spec =
        db.specialties.find((s) => s.id === payload.specialtyId) || db.specialties[1];
      const newDoctor: Doctor = {
        id: `doc-${Date.now()}`,
        email: payload.email.trim().toLowerCase(),
        fullName: payload.fullName.replace(/^Dr\.\s*/i, '').trim(),
        title: 'Dr.',
        phone: payload.phone.trim(),
        role: 'doctor',
        status: 'pending_verification',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        specialtyId: spec.id,
        specialtyName: spec.name,
        subSpecialties: [spec.name],
        mdcnNumber: payload.mdcnNumber || 'MDCN/R/79901',
        verificationStatus: 'pending',
        verificationNote: 'Submitted during registration. Pending Clinical Operations review.',
        yearsOfExperience: 5,
        qualifications: ['MBBS'],
        about: `Medical practitioner specializing in ${spec.name}.`,
        languages: ['English'],
        consultationFee: 15000,
        videoConsultationFee: 12000,
        consultationTypes: ['in_person', 'video'],
        facilityId: 'fac-1',
        facilityName: 'Lagoon Crest Specialist Hospital',
        clinicAddress: 'Victoria Island, Lagos',
        city: payload.city || 'Victoria Island, Lagos',
        state: payload.state || 'Lagos',
        rating: 5.0,
        reviewCount: 0,
        nextAvailableDate: '2026-10-02',
        availableToday: true,
      };
      db.doctors.unshift(newDoctor);
      saveDb(db);
      setStoredSession({
        userId: newDoctor.id,
        role: 'doctor',
        email: newDoctor.email,
        issuedAt: new Date().toISOString(),
      });
      return { user: newDoctor };
    }
  },

  async logout(): Promise<void> {
    await simulateLatency(100);
    setStoredSession(null);
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    await simulateLatency(220);
    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    return {
      message: `If an account exists for ${email}, a password reset link has been sent.`,
    };
  },

  async verifyEmailCode(code: string): Promise<{ verified: boolean }> {
    await simulateLatency(200);
    if (code.trim().length < 4) {
      throw new Error('Please enter the 6-digit verification code.');
    }
    const stored = getStoredSession();
    if (stored) {
      const db = getDb();
      const pat = db.patients.find((p) => p.id === stored.userId);
      if (pat) pat.emailVerified = true;
      const doc = db.doctors.find((d) => d.id === stored.userId);
      if (doc) doc.emailVerified = true;
      saveDb(db);
    }
    return { verified: true };
  },
};

export const doctorService = {
  async getSpecialties(): Promise<Specialty[]> {
    await simulateLatency(100);
    return getDb().specialties;
  },

  async getDoctors(params: DoctorFilterParams = {}): Promise<PaginatedResult<Doctor>> {
    await simulateLatency(160);
    const db = getDb();
    let list = [...db.doctors];

    if (!params.includeUnverified) {
      list = list.filter((d) => d.verificationStatus === 'verified');
    }

    if (params.query && params.query.trim() !== '') {
      const q = params.query.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.specialtyName.toLowerCase().includes(q) ||
          d.facilityName.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.subSpecialties.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (params.specialtyId && params.specialtyId !== 'all') {
      list = list.filter(
        (d) => d.specialtyId === params.specialtyId || d.specialtyName.toLowerCase() === params.specialtyId?.toLowerCase()
      );
    }

    if (params.state && params.state !== 'all') {
      list = list.filter(
        (d) =>
          d.state.toLowerCase() === params.state?.toLowerCase() ||
          d.city.toLowerCase().includes(params.state?.toLowerCase() ?? '')
      );
    }

    if (typeof params.maxFee === 'number' && params.maxFee > 0) {
      list = list.filter((d) => d.consultationFee <= params.maxFee!);
    }

    if (params.availableToday) {
      list = list.filter((d) => d.availableToday);
    }

    if (typeof params.minRating === 'number' && params.minRating > 0) {
      list = list.filter((d) => d.rating >= params.minRating!);
    }

    if (params.consultationType) {
      list = list.filter((d) => d.consultationTypes.includes(params.consultationType!));
    }

    const sortBy = params.sortBy || 'recommended';
    list.sort((a, b) => {
      if (sortBy === 'fee_asc') return a.consultationFee - b.consultationFee;
      if (sortBy === 'fee_desc') return b.consultationFee - a.consultationFee;
      if (sortBy === 'rating_desc') return b.rating - a.rating;
      if (sortBy === 'experience_desc') return b.yearsOfExperience - a.yearsOfExperience;
      // recommended: availableToday first, then rating * reviewCount
      if (a.availableToday !== b.availableToday) return a.availableToday ? -1 : 1;
      return b.rating - a.rating;
    });

    const page = Math.max(1, params.page || 1);
    const pageSize = params.pageSize || 6;
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = list.slice(start, start + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  },

  async getDoctorById(id: string): Promise<{
    doctor: Doctor;
    reviews: Review[];
    availability: Availability;
  }> {
    await simulateLatency(150);
    const db = getDb();
    const doctor = db.doctors.find((d) => d.id === id);
    if (!doctor) {
      throw new Error('Doctor profile not found.');
    }
    const reviews = db.reviews.filter((r) => r.doctorId === id);
    let availability = db.availabilities.find((a) => a.doctorId === id);
    if (!availability) {
      availability = db.availabilities[0];
    }
    return { doctor, reviews, availability };
  },

  async getAvailableTimeSlots(
    doctorId: string,
    dateStr: string
  ): Promise<{
    date: string;
    isWorkingDay: boolean;
    slots: { time: string; available: boolean }[];
  }> {
    await simulateLatency(120);
    const db = getDb();
    const avail = db.availabilities.find((a) => a.doctorId === doctorId) || db.availabilities[0];
    const dateObj = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = dateObj.getDay() as DayAvailability['dayOfWeek'];
    const dayConfig = avail.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);

    if (!dayConfig || !dayConfig.isAvailable || !isFutureOrTodayDate(dateStr)) {
      return { date: dateStr, isWorkingDay: false, slots: [] };
    }

    const bookedForDate = new Set(avail.bookedSlots[dateStr] || []);
    // Also mark active appointments for this doctor on this date as booked
    db.appointments
      .filter(
        (apt) =>
          apt.doctorId === doctorId &&
          apt.date === dateStr &&
          apt.status !== 'cancelled'
      )
      .forEach((apt) => bookedForDate.add(apt.startTime));

    const slots: { time: string; available: boolean }[] = [];
    const [openH, openM] = dayConfig.openTime.split(':').map(Number);
    const [closeH, closeM] = dayConfig.closeTime.split(':').map(Number);
    const startMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;
    const step = dayConfig.slotDurationMinutes || 30;

    for (let current = startMinutes; current + step <= endMinutes; current += step) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const inBreak = dayConfig.breaks.some((b) => {
        return timeStr >= b.startTime && timeStr < b.endTime;
      });
      if (!inBreak) {
        slots.push({
          time: timeStr,
          available: !bookedForDate.has(timeStr),
        });
      }
    }

    return { date: dateStr, isWorkingDay: true, slots };
  },

  async updateDoctorSchedule(doctorId: string, weeklySchedule: DayAvailability[]): Promise<Availability> {
    await simulateLatency(220);
    const db = getDb();
    let avail = db.availabilities.find((a) => a.doctorId === doctorId);
    if (!avail) {
      avail = {
        doctorId,
        timezone: 'Africa/Lagos',
        weeklySchedule,
        bookedSlots: {},
      };
      db.availabilities.push(avail);
    } else {
      avail.weeklySchedule = weeklySchedule;
    }
    saveDb(db);
    return avail;
  },

  async updateDoctorProfile(
    doctorId: string,
    updates: Partial<
      Pick<
        Doctor,
        | 'fullName'
        | 'phone'
        | 'about'
        | 'consultationFee'
        | 'videoConsultationFee'
        | 'consultationTypes'
        | 'languages'
        | 'qualifications'
        | 'subSpecialties'
        | 'clinicAddress'
      >
    >
  ): Promise<Doctor> {
    await simulateLatency(220);
    const db = getDb();
    const doc = db.doctors.find((d) => d.id === doctorId);
    if (!doc) throw new Error('Doctor not found');
    Object.assign(doc, updates);
    saveDb(db);
    return doc;
  },
};

export const appointmentService = {
  async getAppointments(filter?: {
    patientId?: string;
    doctorId?: string;
    status?: AppointmentStatus | 'all';
    query?: string;
  }): Promise<Appointment[]> {
    await simulateLatency(140);
    const db = getDb();
    let list = [...db.appointments];

    if (filter?.patientId) {
      list = list.filter((a) => a.patientId === filter.patientId);
    }
    if (filter?.doctorId) {
      list = list.filter((a) => a.doctorId === filter.doctorId);
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter((a) => a.status === filter.status);
    }
    if (filter?.query && filter.query.trim() !== '') {
      const q = filter.query.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.doctorName.toLowerCase().includes(q) ||
          a.patientName.toLowerCase().includes(q) ||
          a.doctorSpecialty.toLowerCase().includes(q) ||
          a.bookingReference.toLowerCase().includes(q) ||
          a.facilityName.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`));
  },

  async getAppointmentById(id: string): Promise<Appointment> {
    await simulateLatency(120);
    const apt = getDb().appointments.find((a) => a.id === id);
    if (!apt) throw new Error('Appointment record not found.');
    return apt;
  },

  async createAppointment(payload: {
    patientId: string;
    forDependantId?: string;
    doctorId: string;
    date: string;
    startTime: string;
    consultationType: ConsultationType;
    reasonForVisit: string;
    useHmoCoverage: boolean;
    paymentMethod: 'Card' | 'Bank Transfer' | 'HMO Cover' | 'USSD';
    simulatePaymentFailure?: boolean;
  }): Promise<{ appointment: Appointment; transaction: Transaction }> {
    await simulateLatency(320);

    if (!isFutureOrTodayDate(payload.date)) {
      throw new Error('Cannot book an appointment on a past date. Please select a valid future date.');
    }

    const db = getDb();
    const doctor = db.doctors.find((d) => d.id === payload.doctorId);
    if (!doctor) throw new Error('Selected doctor is no longer available.');
    if (doctor.verificationStatus !== 'verified') {
      throw new Error('This doctor account is currently unavailable for public bookings.');
    }

    const patient = db.patients.find((p) => p.id === payload.patientId) || db.patients[0];

    // Check slot conflict
    const slotConflict = db.appointments.some(
      (a) =>
        a.doctorId === payload.doctorId &&
        a.date === payload.date &&
        a.startTime === payload.startTime &&
        a.status !== 'cancelled'
    );
    const avail = db.availabilities.find((a) => a.doctorId === payload.doctorId);
    const preBooked = avail?.bookedSlots[payload.date]?.includes(payload.startTime);

    if (slotConflict || preBooked) {
      throw new Error(
        `The ${payload.startTime} slot on ${payload.date} was just taken. Please pick another available time slot.`
      );
    }

    if (payload.simulatePaymentFailure) {
      throw new Error(
        'Payment authorization failed with mock issuer bank. Your slot has not been charged — please retry or switch payment method.'
      );
    }

    const dependant = payload.forDependantId
      ? db.dependants.find((dep) => dep.id === payload.forDependantId)
      : undefined;

    const baseFee =
      payload.consultationType === 'video' ? doctor.videoConsultationFee : doctor.consultationFee;

    const hasActiveHmo = Boolean(patient.activePlanEnrollmentId && payload.useHmoCoverage);
    const copayAmount = hasActiveHmo ? Math.round(baseFee * 0.1) : baseFee;

    const bookingRef = generateReference('APT');
    const paymentRef = generateReference('PAY');
    const receiptNo = generateReference('RCP');
    const paymentId = `pay-${Date.now()}`;
    const appointmentId = `apt-${Date.now()}`;

    const transaction: Transaction = {
      id: paymentId,
      reference: paymentRef,
      receiptNumber: receiptNo,
      patientId: patient.id,
      patientName: patient.fullName,
      category: 'consultation',
      title: `${doctor.specialtyName} Consultation (${
        payload.consultationType === 'video' ? 'Video' : 'In-Person'
      })`,
      description: `Consultation with ${doctor.title} ${doctor.fullName} on ${payload.date} at ${payload.startTime}`,
      amount: copayAmount,
      currency: 'NGN',
      status: 'paid',
      method: payload.paymentMethod,
      provider: 'MedClux MockGateway (Paystack-Ready)',
      relatedEntityId: appointmentId,
      createdAt: new Date().toISOString(),
      breakdown: hasActiveHmo
        ? [
            { label: `${doctor.specialtyName} Consultation Fee`, amount: baseFee },
            { label: 'Active MedClux HMO Plan Coverage (90%)', amount: -(baseFee - copayAmount) },
            { label: 'Patient Co-Pay Paid', amount: copayAmount },
          ]
        : [{ label: `${doctor.specialtyName} Consultation Fee`, amount: baseFee }],
    };

    const appointment: Appointment = {
      id: appointmentId,
      bookingReference: bookingRef,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      forDependantId: dependant?.id,
      forDependantName: dependant?.fullName,
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      doctorTitle: doctor.title,
      doctorSpecialty: doctor.specialtyName,
      facilityName: doctor.facilityName,
      facilityAddress: doctor.clinicAddress,
      date: payload.date,
      startTime: payload.startTime,
      endTime: addMinutesToTime(payload.startTime, 30),
      consultationType: payload.consultationType,
      meetingLink:
        payload.consultationType === 'video'
          ? `https://meet.medclux.demo/${bookingRef.toLowerCase()}`
          : undefined,
      consultationFee: baseFee,
      coveredByHmo: hasActiveHmo,
      copayAmount,
      status: 'confirmed',
      reasonForVisit: payload.reasonForVisit.trim(),
      paymentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (avail) {
      if (!avail.bookedSlots[payload.date]) {
        avail.bookedSlots[payload.date] = [];
      }
      avail.bookedSlots[payload.date].push(payload.startTime);
    }

    db.transactions.unshift(transaction);
    db.appointments.unshift(appointment);
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: patient.id,
      type: 'appointment_confirmed',
      title: `Appointment Confirmed: ${doctor.title} ${doctor.fullName}`,
      message: `Your ${doctor.specialtyName} consultation on ${payload.date} at ${payload.startTime} is confirmed (${bookingRef}).`,
      isRead: false,
      actionUrl: `/patient/appointments`,
      createdAt: new Date().toISOString(),
    });

    saveDb(db);
    return { appointment, transaction };
  },

  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newStartTime: string
  ): Promise<Appointment> {
    await simulateLatency(220);
    if (!isFutureOrTodayDate(newDate)) {
      throw new Error('Please choose a future date to reschedule.');
    }
    const db = getDb();
    const apt = db.appointments.find((a) => a.id === appointmentId);
    if (!apt) throw new Error('Appointment not found.');
    if (apt.status === 'cancelled' || apt.status === 'completed') {
      throw new Error(`Cannot reschedule a ${apt.status} appointment.`);
    }

    // Free old slot
    const avail = db.availabilities.find((a) => a.doctorId === apt.doctorId);
    if (avail && avail.bookedSlots[apt.date]) {
      avail.bookedSlots[apt.date] = avail.bookedSlots[apt.date].filter((t) => t !== apt.startTime);
    }

    apt.date = newDate;
    apt.startTime = newStartTime;
    apt.endTime = addMinutesToTime(newStartTime, 30);
    apt.status = 'rescheduled';
    apt.updatedAt = new Date().toISOString();

    if (avail) {
      if (!avail.bookedSlots[newDate]) avail.bookedSlots[newDate] = [];
      avail.bookedSlots[newDate].push(newStartTime);
    }

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: apt.patientId,
      type: 'appointment_rescheduled',
      title: `Appointment Rescheduled (${apt.bookingReference})`,
      message: `Your appointment with ${apt.doctorTitle} ${apt.doctorName} has been moved to ${newDate} at ${newStartTime}.`,
      isRead: false,
      actionUrl: '/patient/appointments',
      createdAt: new Date().toISOString(),
    });

    saveDb(db);
    return apt;
  },

  async cancelAppointment(appointmentId: string, reason: string): Promise<Appointment> {
    await simulateLatency(200);
    const db = getDb();
    const apt = db.appointments.find((a) => a.id === appointmentId);
    if (!apt) throw new Error('Appointment not found.');
    if (apt.status === 'completed') {
      throw new Error('Completed appointments cannot be cancelled.');
    }

    apt.status = 'cancelled';
    apt.cancellationReason = reason || 'Cancelled by user';
    apt.updatedAt = new Date().toISOString();

    const avail = db.availabilities.find((a) => a.doctorId === apt.doctorId);
    if (avail && avail.bookedSlots[apt.date]) {
      avail.bookedSlots[apt.date] = avail.bookedSlots[apt.date].filter((t) => t !== apt.startTime);
    }

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: apt.patientId,
      type: 'appointment_cancelled',
      title: `Appointment Cancelled (${apt.bookingReference})`,
      message: `Your appointment with ${apt.doctorTitle} ${apt.doctorName} on ${apt.date} has been cancelled.`,
      isRead: false,
      actionUrl: '/patient/appointments',
      createdAt: new Date().toISOString(),
    });

    saveDb(db);
    return apt;
  },

  async updateAppointmentStatusByDoctor(
    appointmentId: string,
    status: AppointmentStatus,
    clinicalNotes?: string
  ): Promise<Appointment> {
    await simulateLatency(200);
    const db = getDb();
    const apt = db.appointments.find((a) => a.id === appointmentId);
    if (!apt) throw new Error('Appointment not found.');
    apt.status = status;
    if (clinicalNotes !== undefined) {
      apt.clinicalNotes = clinicalNotes;
    }
    apt.updatedAt = new Date().toISOString();
    saveDb(db);
    return apt;
  },
};

export const healthPlanService = {
  async getPlans(): Promise<HealthPlan[]> {
    await simulateLatency(120);
    return getDb().healthPlans;
  },

  async getPlanById(idOrSlug: string): Promise<HealthPlan> {
    await simulateLatency(100);
    const plan = getDb().healthPlans.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    if (!plan) throw new Error('Health plan not found.');
    return plan;
  },

  async getPatientActivePlan(patientId: string): Promise<{
    enrollment: PlanEnrollment | null;
    plan: HealthPlan | null;
    digitalCard: DigitalHealthCard | null;
  }> {
    await simulateLatency(120);
    const db = getDb();
    const enrollment =
      db.enrollments.find((e) => e.patientId === patientId && e.status === 'active') || null;
    if (!enrollment) {
      return { enrollment: null, plan: null, digitalCard: null };
    }
    const plan = db.healthPlans.find((p) => p.id === enrollment.planId) || null;
    const digitalCard =
      db.digitalCards.find((c) => c.enrollmentId === enrollment.id) || null;
    return { enrollment, plan, digitalCard };
  },

  async subscribeToPlan(payload: {
    patientId: string;
    planId: string;
    billingCycle: 'monthly' | 'annual';
    dependantIds: string[];
    paymentMethod: 'Card' | 'Bank Transfer' | 'USSD';
  }): Promise<{
    enrollment: PlanEnrollment;
    digitalCard: DigitalHealthCard;
    transaction: Transaction;
  }> {
    await simulateLatency(300);
    const db = getDb();
    const plan = db.healthPlans.find((p) => p.id === payload.planId);
    if (!plan) throw new Error('Selected HMO health plan is invalid.');

    const patient = db.patients.find((p) => p.id === payload.patientId) || db.patients[0];

    if (payload.dependantIds.length > plan.maxDependants) {
      throw new Error(
        `${plan.name} allows a maximum of ${plan.maxDependants} dependant(s). Please adjust your selection.`
      );
    }

    // Mark any prior active enrollment as expired/replaced
    db.enrollments
      .filter((e) => e.patientId === patient.id && e.status === 'active')
      .forEach((e) => {
        e.status = 'cancelled';
      });

    const amount = payload.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    const startDate = new Date().toISOString().split('T')[0];
    const renewal = new Date();
    if (payload.billingCycle === 'annual') {
      renewal.setFullYear(renewal.getFullYear() + 1);
    } else {
      renewal.setMonth(renewal.getMonth() + 1);
    }
    const renewalDate = renewal.toISOString().split('T')[0];
    const memberId = `MCX-HMO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const enrollmentId = `enr-${Date.now()}`;

    const enrollment: PlanEnrollment = {
      id: enrollmentId,
      patientId: patient.id,
      planId: plan.id,
      planName: plan.name,
      providerName: plan.providerName,
      tier: plan.tier,
      networkTier: plan.hospitalNetworkTier,
      billingCycle: payload.billingCycle,
      amountPaid: amount,
      startDate,
      renewalDate,
      status: 'active',
      enrolledDependantIds: payload.dependantIds,
      memberId,
    };

    const digitalCard: DigitalHealthCard = {
      id: `card-${Date.now()}`,
      enrollmentId,
      memberId,
      patientName: patient.fullName,
      planName: plan.name,
      providerName: plan.providerName,
      tier: plan.tier,
      networkTier: plan.hospitalNetworkTier,
      issueDate: startDate,
      validUntil: renewalDate,
      status: 'active',
      dependantsCount: payload.dependantIds.length,
      emergencyHelpline: '+234 700 633 2589',
    };

    const transaction: Transaction = {
      id: `pay-${Date.now()}`,
      reference: generateReference('PAY'),
      receiptNumber: generateReference('RCP'),
      patientId: patient.id,
      patientName: patient.fullName,
      category: 'hmo_subscription',
      title: `${plan.name} (${payload.billingCycle === 'annual' ? 'Annual' : 'Monthly'} Plan)`,
      description: `Fictional HMO coverage via ${plan.providerName} — Member ID ${memberId}`,
      amount,
      currency: 'NGN',
      status: 'paid',
      method: payload.paymentMethod,
      provider: 'MedClux MockGateway (Paystack-Ready)',
      relatedEntityId: enrollmentId,
      createdAt: new Date().toISOString(),
      breakdown: [
        {
          label: `${plan.name} — ${payload.billingCycle === 'annual' ? '12 Months' : '1 Month'}`,
          amount,
        },
      ],
    };

    patient.activePlanEnrollmentId = enrollmentId;

    // Update dependants covered status
    db.dependants
      .filter((d) => d.primaryPatientId === patient.id)
      .forEach((d, index) => {
        if (payload.dependantIds.includes(d.id)) {
          d.coveredUnderPlan = true;
          d.memberSubId = `${memberId}-D${index + 1}`;
        } else {
          d.coveredUnderPlan = false;
        }
      });

    db.enrollments.unshift(enrollment);
    db.digitalCards.unshift(digitalCard);
    db.transactions.unshift(transaction);
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: patient.id,
      type: 'hmo_confirmed',
      title: `HMO Plan Activated: ${plan.name}`,
      message: `Your MedClux Digital Health Card (${memberId}) is now active through ${renewalDate}.`,
      isRead: false,
      actionUrl: '/patient/health-plans',
      createdAt: new Date().toISOString(),
    });

    saveDb(db);
    return { enrollment, digitalCard, transaction };
  },

  async cancelPlanEnrollment(enrollmentId: string): Promise<void> {
    await simulateLatency(200);
    const db = getDb();
    const enr = db.enrollments.find((e) => e.id === enrollmentId);
    if (!enr) throw new Error('Enrollment not found.');
    enr.status = 'cancelled';
    const card = db.digitalCards.find((c) => c.enrollmentId === enrollmentId);
    if (card) card.status = 'inactive';
    const pat = db.patients.find((p) => p.id === enr.patientId);
    if (pat && pat.activePlanEnrollmentId === enrollmentId) {
      pat.activePlanEnrollmentId = undefined;
    }
    saveDb(db);
  },
};

export const dependantService = {
  async getDependants(patientId: string): Promise<Dependant[]> {
    await simulateLatency(100);
    return getDb().dependants.filter((d) => d.primaryPatientId === patientId);
  },

  async addDependant(payload: {
    primaryPatientId: string;
    fullName: string;
    relationship: Dependant['relationship'];
    dateOfBirth: string;
    gender: Dependant['gender'];
    bloodGroup?: string;
    genotype?: string;
    allergies?: string[];
  }): Promise<Dependant> {
    await simulateLatency(200);
    const db = getDb();
    const existing = db.dependants.filter((d) => d.primaryPatientId === payload.primaryPatientId);
    const activeEnr = db.enrollments.find(
      (e) => e.patientId === payload.primaryPatientId && e.status === 'active'
    );
    const plan = activeEnr ? db.healthPlans.find((p) => p.id === activeEnr.planId) : null;
    const maxAllowed = plan ? plan.maxDependants : 6;

    if (existing.length >= maxAllowed) {
      throw new Error(
        `You have reached the maximum of ${maxAllowed} dependants allowed under your current health plan (${
          plan?.name || 'Standard Limit'
        }). Upgrade your plan to add more dependants.`
      );
    }

    const newDep: Dependant = {
      id: `dep-${Date.now()}`,
      primaryPatientId: payload.primaryPatientId,
      fullName: payload.fullName.trim(),
      relationship: payload.relationship,
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      bloodGroup: payload.bloodGroup || 'O+',
      genotype: payload.genotype || 'AA',
      allergies: payload.allergies || [],
      coveredUnderPlan: Boolean(activeEnr),
      memberSubId: activeEnr ? `${activeEnr.memberId}-D${existing.length + 1}` : undefined,
    };

    db.dependants.push(newDep);
    if (activeEnr) {
      activeEnr.enrolledDependantIds.push(newDep.id);
      const card = db.digitalCards.find((c) => c.enrollmentId === activeEnr.id);
      if (card) card.dependantsCount = activeEnr.enrolledDependantIds.length;
    }
    saveDb(db);
    return newDep;
  },

  async updateDependant(
    dependantId: string,
    updates: Partial<Pick<Dependant, 'fullName' | 'relationship' | 'dateOfBirth' | 'gender' | 'bloodGroup' | 'genotype' | 'allergies'>>
  ): Promise<Dependant> {
    await simulateLatency(180);
    const db = getDb();
    const dep = db.dependants.find((d) => d.id === dependantId);
    if (!dep) throw new Error('Dependant not found.');
    Object.assign(dep, updates);
    saveDb(db);
    return dep;
  },

  async removeDependant(dependantId: string): Promise<void> {
    await simulateLatency(180);
    const db = getDb();
    db.dependants = db.dependants.filter((d) => d.id !== dependantId);
    db.enrollments.forEach((enr) => {
      enr.enrolledDependantIds = enr.enrolledDependantIds.filter((id) => id !== dependantId);
    });
    saveDb(db);
  },
};

export const patientService = {
  async getPatientProfile(patientId: string): Promise<Patient> {
    await simulateLatency(100);
    const pat = getDb().patients.find((p) => p.id === patientId) || getDb().patients[0];
    return pat;
  },

  async updatePatientProfile(
    patientId: string,
    updates: Partial<
      Pick<
        Patient,
        | 'fullName'
        | 'phone'
        | 'dateOfBirth'
        | 'gender'
        | 'bloodGroup'
        | 'genotype'
        | 'allergies'
        | 'city'
        | 'state'
        | 'address'
        | 'emergencyContact'
      >
    >
  ): Promise<Patient> {
    await simulateLatency(220);
    const db = getDb();
    const pat = db.patients.find((p) => p.id === patientId) || db.patients[0];
    Object.assign(pat, updates);
    saveDb(db);
    return pat;
  },

  async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    await simulateLatency(130);
    return getDb().medicalRecords.filter((r) => r.patientId === patientId);
  },

  async getPrescriptions(patientId: string): Promise<Prescription[]> {
    await simulateLatency(130);
    return getDb().prescriptions.filter((p) => p.patientId === patientId);
  },
};

export const labTestService = {
  async getLabTests(filter?: { query?: string; category?: string }): Promise<LabTest[]> {
    await simulateLatency(120);
    let tests = [...getDb().labTests];
    if (filter?.category && filter.category !== 'all') {
      tests = tests.filter((t) => t.category.toLowerCase() === filter.category?.toLowerCase());
    }
    if (filter?.query && filter.query.trim() !== '') {
      const q = filter.query.trim().toLowerCase();
      tests = tests.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return tests;
  },

  async getLabBookings(patientId: string): Promise<LabBooking[]> {
    await simulateLatency(120);
    return getDb().labBookings.filter((b) => b.patientId === patientId);
  },

  async bookLabTest(payload: {
    patientId: string;
    labTestId: string;
    facilityId: string;
    date: string;
    timeSlot: string;
    forDependantId?: string;
  }): Promise<{ booking: LabBooking; transaction: Transaction }> {
    await simulateLatency(260);
    if (!isFutureOrTodayDate(payload.date)) {
      throw new Error('Please choose a valid future date for sample collection.');
    }
    const db = getDb();
    const test = db.labTests.find((t) => t.id === payload.labTestId);
    if (!test) throw new Error('Diagnostic test not found.');
    const facility = db.facilities.find((f) => f.id === payload.facilityId) || db.facilities[4];
    const patient = db.patients.find((p) => p.id === payload.patientId) || db.patients[0];
    const dep = payload.forDependantId
      ? db.dependants.find((d) => d.id === payload.forDependantId)
      : undefined;

    const bookingId = `lbk-${Date.now()}`;
    const paymentId = `pay-${Date.now()}`;
    const bookingRef = generateReference('LAB');

    const booking: LabBooking = {
      id: bookingId,
      bookingReference: bookingRef,
      patientId: patient.id,
      patientName: patient.fullName,
      forDependantId: dep?.id,
      forDependantName: dep?.fullName,
      labTestId: test.id,
      labTestName: test.name,
      labTestCode: test.code,
      facilityId: facility.id,
      facilityName: facility.name,
      date: payload.date,
      timeSlot: payload.timeSlot,
      price: test.price,
      status: 'scheduled',
      paymentId,
      createdAt: new Date().toISOString(),
    };

    const transaction: Transaction = {
      id: paymentId,
      reference: generateReference('PAY'),
      receiptNumber: generateReference('RCP'),
      patientId: patient.id,
      patientName: patient.fullName,
      category: 'lab_test',
      title: `Lab Diagnostic: ${test.name}`,
      description: `Scheduled at ${facility.name} on ${payload.date} (${payload.timeSlot})`,
      amount: test.price,
      currency: 'NGN',
      status: 'paid',
      method: 'Card',
      provider: 'MedClux MockGateway (Paystack-Ready)',
      relatedEntityId: bookingId,
      createdAt: new Date().toISOString(),
      breakdown: [{ label: `${test.name} (${test.code})`, amount: test.price }],
    };

    db.labBookings.unshift(booking);
    db.transactions.unshift(transaction);
    saveDb(db);
    return { booking, transaction };
  },
};

export const facilityService = {
  async getFacilities(filter?: {
    query?: string;
    type?: FacilityType | 'all';
    state?: string;
    hmoProvider?: string;
    only24Hours?: boolean;
    onlyEmergency?: boolean;
  }): Promise<Facility[]> {
    await simulateLatency(130);
    let list = [...getDb().facilities];

    if (filter?.type && filter.type !== 'all') {
      list = list.filter((f) => f.type === filter.type);
    }
    if (filter?.state && filter.state !== 'all') {
      list = list.filter((f) => f.state.toLowerCase() === filter.state?.toLowerCase());
    }
    if (filter?.hmoProvider && filter.hmoProvider !== 'all') {
      list = list.filter((f) =>
        f.acceptedHmoProviders.some((h) => h.toLowerCase().includes(filter.hmoProvider!.toLowerCase()))
      );
    }
    if (filter?.only24Hours) {
      list = list.filter((f) => f.is24Hours);
    }
    if (filter?.onlyEmergency) {
      list = list.filter((f) => f.hasEmergencyUnit);
    }
    if (filter?.query && filter.query.trim() !== '') {
      const q = filter.query.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.city.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q) ||
          f.services.some((s) => s.toLowerCase().includes(q))
      );
    }

    return list;
  },

  async getFacilityById(id: string): Promise<Facility> {
    await simulateLatency(110);
    const fac = getDb().facilities.find((f) => f.id === id);
    if (!fac) throw new Error('Healthcare facility not found.');
    return fac;
  },
};

export const paymentService = {
  async getTransactions(patientId?: string): Promise<Transaction[]> {
    await simulateLatency(120);
    const list = getDb().transactions;
    if (!patientId) return list;
    return list.filter((t) => t.patientId === patientId);
  },

  async getTransactionById(id: string): Promise<Transaction> {
    await simulateLatency(100);
    const tx = getDb().transactions.find((t) => t.id === id);
    if (!tx) throw new Error('Transaction record not found.');
    return tx;
  },
};

export const notificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    await simulateLatency(90);
    return getDb().notifications.filter((n) => n.userId === userId);
  },

  async markAsRead(notificationId: string): Promise<void> {
    await simulateLatency(80);
    const db = getDb();
    const item = db.notifications.find((n) => n.id === notificationId);
    if (item) {
      item.isRead = true;
      saveDb(db);
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    await simulateLatency(100);
    const db = getDb();
    db.notifications
      .filter((n) => n.userId === userId)
      .forEach((n) => {
        n.isRead = true;
      });
    saveDb(db);
  },
};

export const adminService = {
  async getOverviewMetrics() {
    await simulateLatency(140);
    const db = getDb();
    const totalDoctors = db.doctors.length;
    const verifiedDoctors = db.doctors.filter((d) => d.verificationStatus === 'verified').length;
    const pendingDoctors = db.doctors.filter((d) => d.verificationStatus === 'pending').length;
    const totalPatients = db.patients.length;
    const totalAppointments = db.appointments.length;
    const activeEnrollments = db.enrollments.filter((e) => e.status === 'active').length;
    const totalRevenue = db.transactions
      .filter((t) => t.status === 'paid')
      .reduce((acc, item) => acc + item.amount, 0);

    return {
      totalDoctors,
      verifiedDoctors,
      pendingDoctors,
      totalPatients,
      totalAppointments,
      activeEnrollments,
      totalRevenue,
      recentAppointments: db.appointments.slice(0, 6),
      recentTransactions: db.transactions.slice(0, 5),
    };
  },

  async getAllDoctors(): Promise<Doctor[]> {
    await simulateLatency(120);
    return getDb().doctors;
  },

  async getAllPatients(): Promise<Patient[]> {
    await simulateLatency(120);
    return getDb().patients;
  },

  async updateDoctorVerification(
    doctorId: string,
    status: DoctorVerificationStatus,
    note?: string
  ): Promise<Doctor> {
    await simulateLatency(220);
    const db = getDb();
    const doc = db.doctors.find((d) => d.id === doctorId);
    if (!doc) throw new Error('Doctor not found.');
    doc.verificationStatus = status;
    doc.status =
      status === 'verified'
        ? 'active'
        : status === 'suspended'
        ? 'suspended'
        : 'pending_verification';
    if (note) doc.verificationNote = note;
    saveDb(db);
    return doc;
  },

  async resetDemoDatabase(): Promise<void> {
    await simulateLatency(200);
    resetDb();
  },
};
