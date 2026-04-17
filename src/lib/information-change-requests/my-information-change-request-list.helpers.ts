import type { InformationChangeRequest } from "@prisma/client";
import {
  decodeInformationChangeNotes,
  decodeInformationChangeRequestedFields
} from "@/lib/information-change-request";

export function toMyInformationChangeRequestListItem(row: InformationChangeRequest) {
  return {
    id: row.id,
    status: row.status,
    ...decodeInformationChangeNotes(row),
    createdAt: row.createdAt.toISOString(),
    handledAt: row.handledAt?.toISOString() ?? null,
    requested: decodeInformationChangeRequestedFields(row)
  };
}

export function toMyInformationChangeRequestCreateResponse(row: InformationChangeRequest) {
  return {
    ok: true as const,
    request: {
      id: row.id,
      status: row.status,
      createdAt: row.createdAt.toISOString()
    }
  };
}
