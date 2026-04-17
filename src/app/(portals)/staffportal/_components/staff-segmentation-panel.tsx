"use client";

import type { SegmentationConfigForm } from "@/app/(portals)/staffportal/_types/staff-portal";

type StaffSegmentationPanelProps = {
  config: SegmentationConfigForm | null;
  departmentDraft: string;
  pathwayDraft: string;
  selectedDepartment: string;
  saving: boolean;
  setDepartmentDraft: (value: string) => void;
  setPathwayDraft: (value: string) => void;
  setSelectedDepartment: (value: string) => void;
  onAddDepartment: () => void;
  onAddPathway: () => void;
  onRemoveDepartment: (department: string) => void;
  onRemovePathway: (pathway: string) => void;
  onSave: () => void;
};

export default function StaffSegmentationPanel({
  config,
  departmentDraft,
  pathwayDraft,
  selectedDepartment,
  saving,
  setDepartmentDraft,
  setPathwayDraft,
  setSelectedDepartment,
  onAddDepartment,
  onAddPathway,
  onRemoveDepartment,
  onRemovePathway,
  onSave
}: StaffSegmentationPanelProps) {
  if (!config) {
    return null;
  }

  return (
    <section className="panel stack">
      <span className="eyebrow">Department / Pathway Settings</span>
      <p className="muted">
        Saved options are reused by Admin Create Account and account info editing for student segmentation.
      </p>

      <section className="grid cols-2">
        <div className="stack">
          <span className="eyebrow">Departments</span>
          <div className="inline-actions">
            <input value={departmentDraft} onChange={(event) => setDepartmentDraft(event.target.value)} placeholder="Add department" />
            <button className="button secondary" type="button" onClick={onAddDepartment}>
              Add
            </button>
          </div>
          <div className="inline-actions">
            {config.departments.map((entry) => (
              <button
                key={`department-${entry.department}`}
                className={`button secondary${selectedDepartment === entry.department ? " active-link" : ""}`}
                type="button"
                onClick={() => setSelectedDepartment(entry.department)}
              >
                {entry.department}
              </button>
            ))}
          </div>
          {selectedDepartment ? (
            <button className="button secondary" type="button" onClick={() => onRemoveDepartment(selectedDepartment)}>
              Remove Selected Department
            </button>
          ) : null}
        </div>

        <div className="stack">
          <span className="eyebrow">Pathways in Selected Department</span>
          <label className="stack-sm">
            <span className="eyebrow">Selected Department</span>
            <select value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)}>
              <option value="">Select department</option>
              {config.departments.map((entry) => (
                <option key={`select-department-${entry.department}`} value={entry.department}>
                  {entry.department}
                </option>
              ))}
            </select>
          </label>
          <div className="inline-actions">
            <input
              value={pathwayDraft}
              onChange={(event) => setPathwayDraft(event.target.value)}
              placeholder={selectedDepartment ? "Add pathway" : "Select department first"}
              disabled={!selectedDepartment}
            />
            <button className="button secondary" type="button" onClick={onAddPathway} disabled={!selectedDepartment}>
              Add
            </button>
          </div>
          <div className="inline-actions">
            {(config.departments.find((entry) => entry.department === selectedDepartment)?.pathways ?? []).map((item) => (
              <button
                key={`pathway-${selectedDepartment}-${item}`}
                className="button secondary"
                type="button"
                onClick={() => onRemovePathway(item)}
              >
                {item} x
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="inline-actions">
        <button className="button" type="button" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save Segmentation Settings"}
        </button>
      </div>
    </section>
  );
}
