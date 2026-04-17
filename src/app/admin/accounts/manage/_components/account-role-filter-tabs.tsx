"use client";

import { ACCOUNT_ROLE_FILTER_OPTIONS } from "@/app/admin/accounts/manage/_config/account-role-filter";
import { Button } from "@/components/ui/button";
import type { AccountRoleFilter } from "@/lib/admin-accounts-client";

type AccountRoleFilterTabsProps = {
  roleFilter: AccountRoleFilter;
  onChange: (value: AccountRoleFilter) => void;
};

export default function AccountRoleFilterTabs({ roleFilter, onChange }: AccountRoleFilterTabsProps) {
  return (
    <section className="filter-row">
      {ACCOUNT_ROLE_FILTER_OPTIONS.map((option) => (
        <Button key={option.id} variant={roleFilter === option.id ? "default" : "outline"} type="button" onClick={() => onChange(option.id)}>
          {option.label}
        </Button>
      ))}
    </section>
  );
}
