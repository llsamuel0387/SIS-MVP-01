"use client";

import { useEffect, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import { getSegmentationConfig } from "@/lib/student-segmentation-client";
import {
  DEFAULT_STUDENT_SEGMENTATION_LABELS,
  DEFAULT_STUDENT_SEGMENTATION_CONFIG,
  getDepartmentOptions,
  getPathwayOptionsByDepartment,
  type StudentSegmentationConfig
} from "@/lib/student-segmentation";
import type { AccountInfo } from "@/app/admin/accounts/manage/_components/account-info-sections";
import SegmentationOptionInput from "@/app/admin/accounts/_components/segmentation-option-input";

type AccountSegmentationEditorProps = {
  account: AccountInfo;
  pending: boolean;
  onSave: (account: AccountInfo, segmentation: { department?: string; pathway?: string }) => Promise<void>;
};

export default function AccountSegmentationEditor({ account, pending, onSave }: AccountSegmentationEditorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [department, setDepartment] = useState(account.profile?.segmentation?.values.department ?? "");
  const [pathway, setPathway] = useState(account.profile?.segmentation?.values.pathway ?? "");
  const [segmentationConfig, setSegmentationConfig] = useState<StudentSegmentationConfig>(DEFAULT_STUDENT_SEGMENTATION_CONFIG);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [pathwayOptions, setPathwayOptions] = useState<string[]>([]);
  const labels = account.profile?.segmentation?.labels ?? DEFAULT_STUDENT_SEGMENTATION_LABELS;

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { ok, data } = await getSegmentationConfig();
      if (!mounted) {
        return;
      }
      if (!ok) {
        setError(getUiErrorMessage(data, "Failed to load segmentation options"));
      } else {
        setSegmentationConfig(data);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [account.id]);

  useEffect(() => {
    setDepartmentOptions(getDepartmentOptions(segmentationConfig));
    setPathwayOptions(getPathwayOptionsByDepartment(segmentationConfig, department));
  }, [segmentationConfig, department]);

  return (
    <section className="panel stack">
      <span className="eyebrow">Student Segmentation Update</span>
      {error ? <p className="danger">{error}</p> : null}
      {loading ? <p className="muted">Loading segmentation options...</p> : null}
      <section className="grid cols-2">
        <SegmentationOptionInput
          label={labels.department}
          value={department}
          options={departmentOptions}
          placeholder="Type or select department"
          onChange={setDepartment}
        />
        <SegmentationOptionInput
          label={labels.pathway}
          value={pathway}
          options={pathwayOptions}
          placeholder="Type or select pathway"
          onChange={setPathway}
        />
      </section>
      <button
        className="button secondary"
        type="button"
        disabled={pending}
        onClick={() =>
          void onSave(account, {
            department,
            pathway
          })
        }
      >
        {pending ? "Saving..." : "Update Student Segmentation"}
      </button>
    </section>
  );
}
