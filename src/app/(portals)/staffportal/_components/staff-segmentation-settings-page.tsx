"use client";

import StaffSegmentationPanel from "@/app/(portals)/staffportal/_components/staff-segmentation-panel";
import { useStaffSegmentationSettings } from "@/app/(portals)/staffportal/_hooks/use-staff-segmentation-settings";

export default function StaffSegmentationSettingsPage() {
  const {
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
  } = useStaffSegmentationSettings();

  if (loading) {
    return <p className="muted">Loading Department.Pathway settings...</p>;
  }

  return (
    <section className="stack">
      {error ? <p className="danger">{error}</p> : null}
      {message ? <p className="muted">{message}</p> : null}

      <StaffSegmentationPanel
        config={config}
        departmentDraft={departmentDraft}
        pathwayDraft={pathwayDraft}
        selectedDepartment={selectedDepartment}
        saving={savingConfig}
        setDepartmentDraft={setDepartmentDraft}
        setPathwayDraft={setPathwayDraft}
        setSelectedDepartment={setSelectedDepartment}
        onAddDepartment={addDepartmentOption}
        onAddPathway={addPathwayOption}
        onRemoveDepartment={removeDepartmentOption}
        onRemovePathway={removePathwayOption}
        onSave={saveSegmentationConfig}
      />
    </section>
  );
}
