"use client";

import { useEffect, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import type { PortalEntityDetail } from "@/app/(portals)/_types/portal-my-information";
import { getStudentMyProfile } from "@/app/(portals)/studentportal/_lib/student-portal-client";
import { joinEnglishLegalName, joinKoreanLegalName } from "@/lib/display-name";

export function useStudentPortalData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myInformation, setMyInformation] = useState<PortalEntityDetail | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      setError("");
      const result = await getStudentMyProfile();
      if (!mounted) {
        return;
      }
      if (!result.ok) {
        setError(getUiErrorMessage(result.data, "Failed to load my profile"));
        setMyInformation(null);
        setLoading(false);
        return;
      }

      const data = result.data;
      if (!data.profile) {
        setError("Profile data is incomplete.");
        setMyInformation(null);
        setLoading(false);
        return;
      }
      const displayName =
        joinEnglishLegalName(data.profile.firstNameEn, data.profile.middleNameEn, data.profile.lastNameEn).trim() ||
        joinKoreanLegalName(data.profile.firstNameKo, data.profile.lastNameKo).trim() ||
        "-";
      setMyInformation({
        id: data.id,
        entityType: "STUDENT",
        name: displayName,
        numberLabel: "",
        numberValue: "",
        roleLabel: "STUDENT",
        status: data.enrollmentStatus,
        photoDataUrl: data.photoDataUrl ?? null,
        profile: {
          firstNameKo: data.profile.firstNameKo ?? "",
          lastNameKo: data.profile.lastNameKo ?? "",
          firstNameEn: data.profile.firstNameEn ?? "",
          middleNameEn: data.profile.middleNameEn ?? "",
          lastNameEn: data.profile.lastNameEn ?? "",
          nationality: data.profile.nationality,
          dateOfBirth: data.profile.dateOfBirth,
          email: data.profile.email,
          department: data.profile.department,
          pathway: data.profile.pathway,
          termTimeAddress: data.profile.termTimeAddress,
          homeAddress: data.profile.homeAddress
        }
      });
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    loading,
    error,
    myInformation
  };
}
