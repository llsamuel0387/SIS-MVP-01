export type StudentSegmentationValues = {
  department?: string;
  pathway?: string;
  classes?: string[];
};

export type StudentSegmentationLabels = {
  department: string;
  pathway: string;
  class: string;
};

export type StudentSegmentationConfig = {
  departments: Array<{
    department: string;
    pathways: string[];
  }>;
};

export const DEFAULT_STUDENT_SEGMENTATION_LABELS: StudentSegmentationLabels = {
  department: "Department",
  pathway: "Pathway",
  class: "Class"
};

export const DEFAULT_STUDENT_SEGMENTATION_CONFIG: StudentSegmentationConfig = {
  departments: []
};

export function createEmptyStudentSegmentation(): Required<StudentSegmentationValues> {
  return {
    department: "",
    pathway: "",
    classes: [""]
  };
}

export function toStudentSegmentationSectionPayload(values: StudentSegmentationValues) {
  const cleanClasses = (values.classes ?? []).map((value) => value.trim()).filter(Boolean);
  return {
    labels: DEFAULT_STUDENT_SEGMENTATION_LABELS,
    values: {
      department: values.department ?? "",
      pathway: values.pathway ?? "",
      classes: cleanClasses
    }
  };
}

export function normalizeStudentSegmentationConfig(
  config: StudentSegmentationConfig
): StudentSegmentationConfig {
  return {
    departments: config.departments
      .map((entry) => ({
        department: entry.department.trim(),
        pathways: Array.from(new Set(entry.pathways.map((item) => item.trim()).filter(Boolean)))
      }))
      .filter((entry) => entry.department.length > 0)
  };
}

export function getDepartmentOptions(config: StudentSegmentationConfig): string[] {
  return config.departments.map((entry) => entry.department);
}

export function getPathwayOptionsByDepartment(
  config: StudentSegmentationConfig,
  department: string
): string[] {
  const target = config.departments.find((entry) => entry.department === department.trim());
  return target?.pathways ?? [];
}

export function readStudentSegmentationSectionPayload(
  payload: Record<string, unknown> | null | undefined
): { labels: StudentSegmentationLabels; values: Required<StudentSegmentationValues> } {
  if (!payload || typeof payload !== "object") {
    return {
      labels: DEFAULT_STUDENT_SEGMENTATION_LABELS,
      values: createEmptyStudentSegmentation()
    };
  }

  const labelsRaw = payload.labels as Record<string, unknown> | undefined;
  const valuesRaw = payload.values as Record<string, unknown> | undefined;
  const legacyClassValues = [
    typeof valuesRaw?.class1 === "string" ? valuesRaw.class1 : "",
    typeof valuesRaw?.class2 === "string" ? valuesRaw.class2 : "",
    typeof valuesRaw?.class3 === "string" ? valuesRaw.class3 : ""
  ].filter((value) => value.length > 0);
  const classesRaw = Array.isArray(valuesRaw?.classes) ? valuesRaw?.classes : legacyClassValues;

  const labels: StudentSegmentationLabels = {
    department: typeof labelsRaw?.department === "string" && labelsRaw.department.trim() ? labelsRaw.department : "Department",
    pathway: typeof labelsRaw?.pathway === "string" && labelsRaw.pathway.trim() ? labelsRaw.pathway : "Pathway",
    class:
      typeof labelsRaw?.class === "string" && labelsRaw.class.trim()
        ? labelsRaw.class
        : typeof labelsRaw?.class1 === "string" && labelsRaw.class1.trim()
          ? labelsRaw.class1
          : "Class"
  };

  const values = {
    department: typeof valuesRaw?.department === "string" ? valuesRaw.department : "",
    pathway: typeof valuesRaw?.pathway === "string" ? valuesRaw.pathway : "",
    classes: classesRaw
      .map((value) => (typeof value === "string" ? value : ""))
      .map((value) => value.trim())
      .filter(Boolean)
  };

  return { labels, values };
}
