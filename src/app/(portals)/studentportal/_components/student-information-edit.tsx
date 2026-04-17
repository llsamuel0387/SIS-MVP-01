"use client";

import { getInformationRequestStatusLabel } from "@/lib/information-change-request";
import { COUNTRY_OPTIONS } from "@/lib/country-options";
import { useStudentInformationEdit } from "@/app/(portals)/studentportal/_hooks/use-student-information-edit";
import { InformationAddressCard, InformationCurrentValues } from "@/app/(portals)/_components/information-change-request-sections";

export default function StudentInformationEdit() {
  const { loading, saving, error, message, current, draft, requests, setDraft, submitRequest } = useStudentInformationEdit();

  if (loading) {
    return <p className="muted">Loading information edit workspace...</p>;
  }

  return (
    <section className="stack">
      {error ? <p className="notice notice-error">{error}</p> : null}
      {message ? <p className="notice notice-info">{message}</p> : null}

      <section className="grid cols-2">
        <section className="stack">
          {current ? <InformationCurrentValues current={current} /> : null}
          <section className="panel stack">
            <span className="eyebrow">Request Information Change</span>
            <p className="muted">Fill only the fields you want to update.</p>

            <label className="stack">
              <span className="eyebrow">Requested Email</span>
              <input
                type="email"
                placeholder="Enter new email"
                value={draft.email}
                onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>

            <div className="grid cols-2">
              <section className="panel stack">
                <span className="eyebrow">Requested Term Time Address</span>
                <label className="stack-sm">
                  <span className="eyebrow">Country</span>
                  <select
                    value={draft.termTimeAddress.country}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        termTimeAddress: { ...prev.termTimeAddress, country: event.target.value }
                      }))
                    }
                  >
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={`term-country-${country}`} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="stack-sm">
                  <span className="eyebrow">Address Line 1</span>
                  <input
                    value={draft.termTimeAddress.addressLine1}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        termTimeAddress: { ...prev.termTimeAddress, addressLine1: event.target.value }
                      }))
                    }
                  />
                </label>
                <label className="stack-sm">
                  <span className="eyebrow">Address Line 2</span>
                  <input
                    value={draft.termTimeAddress.addressLine2}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        termTimeAddress: { ...prev.termTimeAddress, addressLine2: event.target.value }
                      }))
                    }
                  />
                </label>
                <label className="stack-sm">
                  <span className="eyebrow">Post Code</span>
                  <input
                    value={draft.termTimeAddress.postCode}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        termTimeAddress: { ...prev.termTimeAddress, postCode: event.target.value }
                      }))
                    }
                  />
                </label>
              </section>

              <section className="panel stack">
                <span className="eyebrow">Requested Home Address</span>
                <label className="stack-sm">
                  <span className="eyebrow">Country</span>
                  <select
                    value={draft.homeAddress.country}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        homeAddress: { ...prev.homeAddress, country: event.target.value }
                      }))
                    }
                  >
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={`home-country-${country}`} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="stack-sm">
                  <span className="eyebrow">Address Line 1</span>
                  <input
                    value={draft.homeAddress.addressLine1}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        homeAddress: { ...prev.homeAddress, addressLine1: event.target.value }
                      }))
                    }
                  />
                </label>
                <label className="stack-sm">
                  <span className="eyebrow">Address Line 2</span>
                  <input
                    value={draft.homeAddress.addressLine2}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        homeAddress: { ...prev.homeAddress, addressLine2: event.target.value }
                      }))
                    }
                  />
                </label>
                <label className="stack-sm">
                  <span className="eyebrow">Post Code</span>
                  <input
                    value={draft.homeAddress.postCode}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        homeAddress: { ...prev.homeAddress, postCode: event.target.value }
                      }))
                    }
                  />
                </label>
              </section>
            </div>

            <label className="stack">
              <span className="eyebrow">Request Note (Optional)</span>
              <textarea
                value={draft.requesterNote}
                onChange={(event) => setDraft((prev) => ({ ...prev, requesterNote: event.target.value }))}
                placeholder="Reason for this change request"
                rows={3}
              />
            </label>

            <div className="align-end inline-actions">
              <button className="button" type="button" disabled={saving} onClick={() => void submitRequest()}>
                {saving ? "Submitting..." : "Request to Change Information"}
              </button>
            </div>
          </section>
        </section>

        <section className="panel stack">
          <span className="eyebrow">My Request History</span>
          {requests.length === 0 ? (
            <p className="muted">No information change requests yet.</p>
          ) : (
            requests.map((item) => (
              <section key={item.id} className="panel stack-sm">
                <div className="split-row">
                  <strong>{getInformationRequestStatusLabel(item.status)}</strong>
                  <span className="muted">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <div className="grid cols-2">
                  <div className="stack-sm">
                    <span className="eyebrow">Requested Email</span>
                    <p className="text-break-anywhere">{item.requested.email || "-"}</p>
                  </div>
                </div>
                <div className="grid cols-2">
                  <InformationAddressCard title="Requested Term Time Address" value={item.requested.termTimeAddress} />
                  <InformationAddressCard title="Requested Home Address" value={item.requested.homeAddress} />
                </div>
                {item.requesterNote ? (
                  <div className="stack-sm">
                    <span className="eyebrow">Requester Note</span>
                    <p>{item.requesterNote}</p>
                  </div>
                ) : null}
                {item.reviewerNote ? (
                  <div className="stack-sm">
                    <span className="eyebrow">Admin Review Note</span>
                    <p>{item.reviewerNote}</p>
                  </div>
                ) : null}
              </section>
            ))
          )}
        </section>
      </section>

    </section>
  );
}
