# MedClux — Healthcare Appointment, Care Navigation & HMO Platform

> **Portfolio Disclaimer:** **MedClux** is a fictional healthcare SaaS portfolio platform. All HMO providers, health plans, Naira (`₦`) prices, doctors, hospitals, diagnostic centers, and medical records are fictional demonstration data and do not represent real medical coverage or clinical claims.

## Overview

**MedClux** is a modern, multi-role healthcare platform built with **Next.js (App Router)**, **React**, **TypeScript**, and **Tailwind CSS**, tailored to a realistic Nigerian healthcare context.

### Core User Portals & Demo Accounts

Demo credentials are isolated in the mock service layer (`src/mocks/seedData.ts`) and can be switched with one click from the top bar or `/auth/login`:

| Role | Demo Email | Persona | Highlights |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@medclux.demo` | **Adaeze Okafor** | Active *MedClux Silver Shield* HMO plan, Digital Health Card (`MCX-HMO-2026-8841`), 2 family dependants, upcoming & completed consultations, lab bookings, medical records, and prescriptions |
| **Doctor** | `doctor@medclux.demo` | **Dr. Babatunde Adeyemi** | MDCN-Verified Consultant Cardiologist at *Lagoon Crest Specialist Hospital* (Victoria Island, Lagos); manages consultation requests, clinical notes, weekly schedule, and fees |
| **Admin** | `admin@medclux.demo` | **Chinedu Eze** | Clinical Operations governance; verifies/suspends doctor MDCN credentials, audits appointments, HMO plans, partner facilities, and platform payments |

## Key Features

- **Public Discovery (`/`, `/doctors`, `/doctors/[id]`, `/health-plans`, `/facilities`, `/emergency`)**:
  - Multi-criteria doctor search & filtering (Specialty, State/Location, Consultation Fee ceiling in `₦`, Available Today, Minimum Rating, Consultation Mode, Sort order) with URL query synchronization, removable filter chips, and mobile bottom-sheet drawer.
  - Side-by-side HMO Plan Comparison matrix and monthly/annual billing toggle.
  - Clearly distinguished **24/7 Emergency Access (`/emergency`)** featuring Nigerian emergency response numbers (`112`, `767`) and 24-hour trauma centers.
- **7-Step Validated Appointment Booking Engine (`/book/[doctorId]`)**:
  - Date → Time Slot → Consultation Mode (`In-Person` / `Video`) → Patient or Dependant Info & HMO Cover Toggle → Summary Review → Mock Payment Gateway (with edge-case payment failure simulator) → Instant Confirmation (`MCX-APT-...`).
  - Automatic draft persistence in `sessionStorage` so refreshing mid-booking never loses progress.
- **Patient Workspace (`/patient/*`)**:
  - Overview Dashboard, Appointments management (Reschedule & Cancel modals), HMO Plans & **MedClux Digital Health Card**, Family Dependants CRUD (with plan limit enforcement), Medical Records, Prescriptions, Diagnostic Lab Tests booking, Payments & printable Official Receipts, Notifications, and Profile management.
- **Doctor Workspace (`/doctor/*`)**:
  - Overview, Appointments Queue (Accept/Confirm, Mark Completed with clinical notes, Cancel), Weekly Schedule & Slot Duration Configurator, Assigned Patients clinical directory, and Practice Profile.
- **Admin Workspace (`/admin/*`)**:
  - Operational KPIs, MDCN Doctor Credential Verification Queue, Doctors/Patients/Appointments/HMO Plans/Facilities/Payments data tables, and one-click Demo Database Reset.

## Getting Started

```bash
npm install
npm run dev
```
