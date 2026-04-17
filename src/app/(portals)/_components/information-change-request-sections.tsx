"use client";

import type { RequestedAddress } from "@/lib/information-change-request";

export type CurrentInformationView = {
  email: string;
  termTimeAddress: RequestedAddress;
  homeAddress: RequestedAddress;
};

type AddressCardProps = {
  title: string;
  value: RequestedAddress;
};

export function InformationAddressCard({ title, value }: AddressCardProps) {
  return (
    <section className="panel stack-sm">
      <span className="eyebrow">{title}</span>
      <p>{value.country || "-"}</p>
      <p>{value.addressLine1 || "-"}</p>
      {value.addressLine2 ? <p>{value.addressLine2}</p> : null}
      <p>Post code: {value.postCode || "-"}</p>
    </section>
  );
}

export function InformationCurrentValues({ current }: { current: CurrentInformationView }) {
  return (
    <section className="panel stack">
      <span className="eyebrow">Current Information</span>
      <div className="stack-sm">
        <span className="eyebrow">Current Email</span>
        <p className="text-break-anywhere">{current.email || "-"}</p>
      </div>
      <div className="grid cols-2">
        <InformationAddressCard title="Current Term Time Address" value={current.termTimeAddress} />
        <InformationAddressCard title="Current Home Address" value={current.homeAddress} />
      </div>
    </section>
  );
}
