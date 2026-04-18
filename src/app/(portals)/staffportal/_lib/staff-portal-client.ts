"use client";

import { secureFetchJson } from "@/lib/parse-fetch-response-json";
import type {
  StaffMe,
  StaffMemberListPage,
  StaffStudentListPage
} from "@/app/(portals)/staffportal/_types/staff-portal";

export const STAFF_DIRECTORY_PAGE_SIZE = 25;

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
  return secureFetchJson<StaffMe>("/api/me");
}

export async function getStaffStudents(page = 1, pageSize = STAFF_DIRECTORY_PAGE_SIZE) {
  return secureFetchJson<StaffStudentListPage>(`/api/staff/students?page=${page}&pageSize=${pageSize}`);
}

export async function getStaffStudentDetail(studentId: string) {
  return secureFetchJson<StaffStudentDetailResponse>(`/api/staff/students/${studentId}`);
}

export async function getStaffMembers(page = 1, pageSize = STAFF_DIRECTORY_PAGE_SIZE) {
  return secureFetchJson<StaffMemberListPage>(`/api/staff/members?page=${page}&pageSize=${pageSize}`);
}

export async function getStaffMemberDetail(staffId: string) {
  return secureFetchJson<StaffMemberDetailResponse>(`/api/staff/members/${staffId}`);
}
