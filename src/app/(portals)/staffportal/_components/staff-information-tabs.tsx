"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STAFF_INFORMATION_TABS } from "@/app/(portals)/staffportal/_config/staff-information-navigation";

export default function StaffInformationTabs() {
  const pathname = usePathname();

  return (
    <section className="panel stack-sm">
      <span className="eyebrow">Information Tabs</span>
      <div className="inline-actions">
        {STAFF_INFORMATION_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`button secondary${pathname === tab.href ? " active-link" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
