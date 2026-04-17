import { secureClientFetch } from "@/lib/browser-security";
import { parseFetchResponseJson } from "@/lib/parse-fetch-response-json";
import type { StudentSegmentationConfig } from "@/lib/student-segmentation";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T }> {
  const response = await secureClientFetch(url, init);
  return parseFetchResponseJson<T>(response);
}

export async function getSegmentationConfig(): Promise<{ ok: boolean; data: StudentSegmentationConfig }> {
  return await fetchJson<StudentSegmentationConfig>("/api/staff/segmentation-config");
}

export async function updateSegmentationConfig(
  payload: StudentSegmentationConfig
): Promise<{ ok: boolean; data: { ok: boolean; config: StudentSegmentationConfig } }> {
  return await fetchJson<{ ok: boolean; config: StudentSegmentationConfig }>("/api/staff/segmentation-config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
