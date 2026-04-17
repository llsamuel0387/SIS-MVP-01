"use client";

import { secureClientFetch } from "@/lib/browser-security";

type FetchResult<T> = { ok: boolean; data: T };

async function fetchJson<T>(url: string): Promise<FetchResult<T>> {
  const response = await secureClientFetch(url);
  const data = (await response.json()) as T;
  return { ok: response.ok, data };
}

export type StudentMyProfileResponse = {
  id: string;
  studentNo: string;
  enrollmentStatus: string;
  photoDataUrl?: string | null;
  profile: {
    firstNameKo?: string | null;
    lastNameKo?: string | null;
    firstNameEn?: string | null;
    middleNameEn?: string;
    lastNameEn?: string;
    nationality?: string;
    dateOfBirth?: string;
    email?: string;
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

export async function getStudentMyProfile() {
  return fetchJson<StudentMyProfileResponse>("/api/my/profile");
}
