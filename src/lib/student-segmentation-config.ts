import { prisma } from "@/lib/prisma";
import {
  DEFAULT_STUDENT_SEGMENTATION_LABELS,
  DEFAULT_STUDENT_SEGMENTATION_CONFIG,
  normalizeStudentSegmentationConfig,
  readStudentSegmentationSectionPayload,
  type StudentSegmentationConfig
} from "@/lib/student-segmentation";
import { decryptPersonSectionPayload } from "@/lib/person-data";

const DEFAULT_CONFIG: StudentSegmentationConfig = {
  ...DEFAULT_STUDENT_SEGMENTATION_CONFIG
};

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

function parseConfig(labelsJson: string, optionsJson: string): StudentSegmentationConfig {
  let optionsRaw: Record<string, unknown> = {};

  try {
    const parsedLabels = JSON.parse(labelsJson);
    void parsedLabels;
  } catch {
    // legacy labels payload is intentionally ignored
  }

  try {
    const parsedOptions = JSON.parse(optionsJson);
    if (parsedOptions && typeof parsedOptions === "object") {
      optionsRaw = parsedOptions as Record<string, unknown>;
    }
  } catch {
    optionsRaw = {};
  }

  const departmentsRaw = Array.isArray(optionsRaw.departments) ? optionsRaw.departments : [];

  if (departmentsRaw.length === 0) {
    const legacyDepartments = parseStringArray(optionsRaw.department);
    const legacyPathways = parseStringArray(optionsRaw.pathway);
    return normalizeStudentSegmentationConfig({
      departments: legacyDepartments.map((department) => ({
        department,
        pathways: legacyPathways
      }))
    });
  }

  return normalizeStudentSegmentationConfig({
    departments: departmentsRaw.map((entry) => {
      const row = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
      return {
        department: typeof row.department === "string" ? row.department : "",
        pathways: parseStringArray(row.pathways)
      };
    })
  });
}

export async function getStudentSegmentationConfig(): Promise<StudentSegmentationConfig> {
  const row = await prisma.studentSegmentationConfig.findUnique({
    where: { scopeKey: "global" }
  });

  if (!row) {
    return DEFAULT_CONFIG;
  }

  return parseConfig(row.labelsJson, row.optionsJson);
}

export async function upsertStudentSegmentationConfig(input: {
  config: StudentSegmentationConfig;
  actorUserId?: string;
}): Promise<StudentSegmentationConfig> {
  const normalized = normalizeStudentSegmentationConfig(input.config);
  const labelsJson = JSON.stringify(DEFAULT_STUDENT_SEGMENTATION_LABELS);
  const optionsJson = JSON.stringify(normalized);

  const row = await prisma.studentSegmentationConfig.upsert({
    where: { scopeKey: "global" },
    update: {
      labelsJson,
      optionsJson,
      updatedByUserId: input.actorUserId ?? null
    },
    create: {
      scopeKey: "global",
      labelsJson,
      optionsJson,
      updatedByUserId: input.actorUserId ?? null
    }
  });

  return parseConfig(row.labelsJson, row.optionsJson);
}

export type SegmentationDeletionConflicts = {
  departments: Array<{ department: string; count: number }>;
  pathways: Array<{ department: string; pathway: string; count: number }>;
};

export async function findSegmentationDeletionConflicts(
  nextConfig: StudentSegmentationConfig
): Promise<SegmentationDeletionConflicts> {
  const currentConfig = await getStudentSegmentationConfig();
  const normalizedNext = normalizeStudentSegmentationConfig(nextConfig);
  const nextDepartmentSet = new Set(normalizedNext.departments.map((entry) => entry.department));

  const removedDepartments = currentConfig.departments
    .map((entry) => entry.department)
    .filter((department) => !nextDepartmentSet.has(department));
  const removedDepartmentSet = new Set(removedDepartments);

  const nextPathwaysByDepartment = new Map(
    normalizedNext.departments.map((entry) => [entry.department, new Set(entry.pathways)])
  );
  const removedPathwaysByDepartment = new Map<string, Set<string>>();
  for (const entry of currentConfig.departments) {
    const nextPathways = nextPathwaysByDepartment.get(entry.department) ?? new Set<string>();
    const removedPathways = entry.pathways.filter((pathway) => !nextPathways.has(pathway));
    if (removedPathways.length > 0) {
      removedPathwaysByDepartment.set(entry.department, new Set(removedPathways));
    }
  }

  if (removedDepartmentSet.size === 0 && removedPathwaysByDepartment.size === 0) {
    return { departments: [], pathways: [] };
  }

  const sections = await prisma.personSection.findMany({
    where: { sectionKey: "student-segmentation.v1" }
  });

  const departmentUsage = new Map<string, number>();
  const pathwayUsage = new Map<string, number>();
  for (const section of sections) {
    let segmentation:
      | {
          values: { department: string; pathway: string; classes: string[] };
          labels: { department: string; pathway: string; class: string };
        }
      | undefined;
    try {
      segmentation = readStudentSegmentationSectionPayload(decryptPersonSectionPayload(section));
    } catch {
      continue;
    }

    const department = segmentation.values.department.trim();
    const pathway = segmentation.values.pathway.trim();
    if (!department) {
      continue;
    }

    if (removedDepartmentSet.has(department)) {
      departmentUsage.set(department, (departmentUsage.get(department) ?? 0) + 1);
    }

    const removedPathways = removedPathwaysByDepartment.get(department);
    if (pathway && removedPathways?.has(pathway)) {
      const key = `${department}::${pathway}`;
      pathwayUsage.set(key, (pathwayUsage.get(key) ?? 0) + 1);
    }
  }

  return {
    departments: Array.from(departmentUsage.entries()).map(([department, count]) => ({ department, count })),
    pathways: Array.from(pathwayUsage.entries()).map(([key, count]) => {
      const [department, pathway] = key.split("::");
      return { department, pathway, count };
    })
  };
}
