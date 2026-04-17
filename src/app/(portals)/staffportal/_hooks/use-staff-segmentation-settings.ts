"use client";

import { useEffect, useState } from "react";
import { getUiErrorMessage } from "@/lib/client-error";
import { getSegmentationConfig, updateSegmentationConfig } from "@/lib/student-segmentation-client";
import type { SegmentationConfigForm, StaffMe } from "@/app/(portals)/staffportal/_types/staff-portal";
import { getStaffMe } from "@/app/(portals)/staffportal/_lib/staff-portal-client";
import { canManageDepartmentPathwaySettings } from "@/app/(portals)/staffportal/_lib/staff-portal-permissions";
import { normalizeStudentSegmentationConfig } from "@/lib/student-segmentation";

function normalizeOptions(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function useStaffSegmentationSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState<SegmentationConfigForm | null>(null);
  const [departmentDraft, setDepartmentDraft] = useState("");
  const [pathwayDraft, setPathwayDraft] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  async function reload() {
    setLoading(true);
    setError("");
    setMessage("");

    const meResult = await getStaffMe();
    if (!meResult.ok) {
      setError(getUiErrorMessage(meResult.data, "Failed to verify permissions"));
      setLoading(false);
      return;
    }

    const me = meResult.data as StaffMe;
    if (!canManageDepartmentPathwaySettings(me)) {
      setError("Your current staff authority cannot manage Department.Pathway settings.");
      setLoading(false);
      return;
    }

    const configResult = await getSegmentationConfig();
    if (!configResult.ok) {
      setError(getUiErrorMessage(configResult.data, "Failed to load segmentation settings"));
      setLoading(false);
      return;
    }

    setConfig(configResult.data);
    if (configResult.data.departments.length > 0) {
      setSelectedDepartment(configResult.data.departments[0].department);
    } else {
      setSelectedDepartment("");
    }
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  function addDepartmentOption() {
    if (!config || !departmentDraft.trim()) {
      return;
    }
    const nextDepartment = departmentDraft.trim();
    setConfig((prev) =>
      prev
        ? {
            departments: normalizeStudentSegmentationConfig({
              departments: [...prev.departments, { department: nextDepartment, pathways: [] }]
            }).departments
          }
        : prev
    );
    setSelectedDepartment(nextDepartment);
    setDepartmentDraft("");
  }

  function addPathwayOption() {
    if (!config || !pathwayDraft.trim() || !selectedDepartment) {
      return;
    }
    const nextPathway = pathwayDraft.trim();
    setConfig((prev) =>
      prev
        ? {
            departments: prev.departments.map((entry) =>
              entry.department === selectedDepartment
                ? {
                    ...entry,
                    pathways: normalizeOptions([...entry.pathways, nextPathway])
                  }
                : entry
            )
          }
        : prev
    );
    setPathwayDraft("");
  }

  function removeDepartmentOption(department: string) {
    if (!config) {
      return;
    }
    const nextDepartments = config.departments.filter((entry) => entry.department !== department);
    setConfig({ departments: nextDepartments });
    if (selectedDepartment === department) {
      setSelectedDepartment(nextDepartments[0]?.department ?? "");
    }
  }

  function removePathwayOption(pathway: string) {
    if (!config || !selectedDepartment) {
      return;
    }
    setConfig({
      departments: config.departments.map((entry) =>
        entry.department === selectedDepartment
          ? {
              ...entry,
              pathways: entry.pathways.filter((value) => value !== pathway)
            }
          : entry
      )
    });
  }

  async function saveSegmentationConfig() {
    if (!config) {
      return;
    }
    setSavingConfig(true);
    setError("");
    setMessage("");
    const normalized = normalizeStudentSegmentationConfig(config);
    const { ok, data } = await updateSegmentationConfig(normalized);
    setSavingConfig(false);
    if (!ok) {
      setError(getUiErrorMessage(data, "Failed to save segmentation settings"));
      return;
    }
    setConfig(data.config);
    setMessage("Department.Pathway settings have been saved.");
  }

  return {
    loading,
    error,
    message,
    config,
    departmentDraft,
    pathwayDraft,
    selectedDepartment,
    savingConfig,
    setDepartmentDraft,
    setPathwayDraft,
    setSelectedDepartment,
    addDepartmentOption,
    addPathwayOption,
    removeDepartmentOption,
    removePathwayOption,
    saveSegmentationConfig
  };
}
