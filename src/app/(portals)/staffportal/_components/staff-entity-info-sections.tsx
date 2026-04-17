"use client";

import type { StaffEntityDetail } from "@/app/(portals)/staffportal/_types/staff-portal";
import {
  PortalEntityIdentitySection,
  PortalEntityProfileSection
} from "@/app/(portals)/_components/portal-entity-info-sections";

export function StaffEntityIdentitySection({ detail }: { detail: StaffEntityDetail }) {
  return <PortalEntityIdentitySection detail={detail} />;
}

export function StaffEntityProfileSection({ detail }: { detail: StaffEntityDetail }) {
  return <PortalEntityProfileSection detail={detail} showStudentOnlySections />;
}
