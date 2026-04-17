"use client";

import type { StaffEntityDetail } from "@/app/(portals)/staffportal/_types/staff-portal";
import PortalMyInformationPanel from "@/app/(portals)/_components/portal-my-information-panel";

type StaffMyInformationPanelProps = {
  loading: boolean;
  error: string;
  detail: StaffEntityDetail | null;
};

export default function StaffMyInformationPanel({ loading, error, detail }: StaffMyInformationPanelProps) {
  return (
    <PortalMyInformationPanel
      loading={loading}
      error={error}
      detail={detail}
      description="Personal profile data assigned to your current staff account."
      showStudentOnlySections={false}
    />
  );
}
