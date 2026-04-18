import { secureFetchJson } from "@/lib/parse-fetch-response-json";
import type { StudentSegmentationConfig } from "@/lib/student-segmentation";

export async function getSegmentationConfig(): Promise<{ ok: boolean; data: StudentSegmentationConfig }> {
  return await secureFetchJson<StudentSegmentationConfig>("/api/staff/segmentation-config");
}

export async function updateSegmentationConfig(
  payload: StudentSegmentationConfig
): Promise<{ ok: boolean; data: { ok: boolean; config: StudentSegmentationConfig } }> {
  return await secureFetchJson<{ ok: boolean; config: StudentSegmentationConfig }>("/api/staff/segmentation-config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
