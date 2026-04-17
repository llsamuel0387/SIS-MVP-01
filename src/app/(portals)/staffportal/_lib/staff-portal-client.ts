"use client";

import { secureClientFetch } from "@/lib/browser-security";
import type { StaffMe, StaffMemberRow, StaffStudentRow } from "@/app/(portals)/staffportal/_types/staff-portal";

type FetchResult<T> = { ok: boolean; data: T };

async function fetchJson<T>(url: string): Promise<FetchResult<T>> {
  const response = await secureClientFetch(url);
  const data = (await response.json()) as T;
  return { ok: response.ok, data };
}

export type StaffStudentDetailResponse = {
  id: string;
  name: string;
  studentNo: string;
  status: string;
  photoDataUrl?: string | null;
  profile?: {
    firstNameKo: string;
    lastNameKo: string;
    firstNameEn: string;
    middleNameEn: string;
    lastNameEn: string;
    nationality: string;
    dateOfBirth: string;
    email: string;
    department?: string;
    pathway?: string;
    termTimeAddress?: {
      country: string;
      addressLine1: string;
      addressLine2: string;
      postCode: string;
    };
    homeAddress?: {
      country: string;
      addressLine1: string;
      addressLine2: string;
      postCode: string;
    };
  };
};

export type StaffMemberDetailResponse = {
  id: string;
  name: string;
  staffNo: string;
  roleLabel: string;
  status: string;
  photoDataUrl?: string | null;
  profile?: {
    firstNameKo: string;
    lastNameKo: string;
    firstNameEn: string;
    middleNameEn: string;
    lastNameEn: string;
    nationality: string;
    dateOfBirth: string;
    email: string;
    department?: string;
    pathway?: string;
    termTimeAddress?: {
      country: string;
      addressLine1: string;
      addressLine2: string;
      postCode: string;
    };
    homeAddress?: {
      country: string;
      addressLine1: string;
      addressLine2: string;
      postCode: string;
    };
  };
};

export async function getStaffMe() {
  return fetchJson<StaffMe>("/api/me");
}

export async function getStaffStudents() {
  return fetchJson<StaffStudentRow[]>("/api/staff/students");
}

export async function getStaffStudentDetail(studentId: string) {
  return fetchJson<StaffStudentDetailResponse>(`/api/staff/students/${studentId}`);
}

export async function getStaffMembers() {
  return fetchJson<StaffMemberRow[]>("/api/staff/members");
}

export async function getStaffMemberDetail(staffId: string) {
  return fetchJson<StaffMemberDetailResponse>(`/api/staff/members/${staffId}`);
}
