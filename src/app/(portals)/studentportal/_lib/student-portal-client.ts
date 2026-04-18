"use client";

import { secureFetchJson } from "@/lib/parse-fetch-response-json";

export type StudentMyProfileResponse = {
  id: string;
  studentNo: string;
  enrollmentStatus: string;
  photoDataUrl?: string | null;
  profile?: {
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
  return secureFetchJson<StudentMyProfileResponse>("/api/my/profile");
}
