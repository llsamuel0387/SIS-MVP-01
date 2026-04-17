import type { Prisma } from "@prisma/client";
import { getDisplayNameFromUser } from "@/lib/user-admin";
import {
  decodeInformationChangeNotes,
  decodeInformationChangeRequestedFields
} from "@/lib/information-change-request";

export type AdminInformationChangeRequestRow = Prisma.InformationChangeRequestGetPayload<{
  include: {
    requester: {
      include: { profile: true; person: { include: { sections: true } } };
    };
  };
}>;

export function toAdminInformationChangeRequestListItem(row: AdminInformationChangeRequestRow) {
  return {
    id: row.id,
    status: row.status,
    requesterUserId: row.requesterUserId,
    requesterLoginId: row.requester.loginId,
    requesterName: getDisplayNameFromUser(row.requester.profile, row.requester.person) || row.requester.loginId,
    ...decodeInformationChangeNotes(row),
    createdAt: row.createdAt.toISOString(),
    handledAt: row.handledAt?.toISOString() ?? null,
    requested: decodeInformationChangeRequestedFields(row)
  };
}
