import type { InformationChangeRequest } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ERROR_CODES } from "@/lib/api-error";
import {
  encryptInformationChangeDraft,
  hasInformationChangeContent,
  normalizeInformationChangeDraft,
  type InformationChangeDraft
} from "@/lib/information-change-request";
import { toMyInformationChangeRequestCreateResponse } from "@/lib/information-change-requests/my-information-change-request-list.helpers";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type CreateMyInformationChangeRequestInput = {
  userId: string;
  draft: InformationChangeDraft;
};

export type CreateMyInformationChangeRequestSuccess = ReturnType<typeof toMyInformationChangeRequestCreateResponse> & {
  row: InformationChangeRequest;
};

export async function createMyInformationChangeRequest(
  input: CreateMyInformationChangeRequestInput
): Promise<{ ok: true; data: CreateMyInformationChangeRequestSuccess } | { ok: false; code: ErrorCode }> {
  const student = await prisma.student.findUnique({ where: { userId: input.userId }, select: { id: true } });
  if (!student) {
    return { ok: false, code: ERROR_CODES.RESOURCE_STUDENT_NOT_FOUND };
  }

  const draft = normalizeInformationChangeDraft(input.draft);
  if (!hasInformationChangeContent(draft)) {
    return { ok: false, code: ERROR_CODES.VALIDATION_INVALID_PAYLOAD };
  }

  const encryptedDraft = encryptInformationChangeDraft(draft);
  const created = await prisma.informationChangeRequest.create({
    data: {
      requesterUserId: input.userId,
      targetUserId: input.userId,
      ...encryptedDraft
    }
  });

  return {
    ok: true,
    data: {
      ...toMyInformationChangeRequestCreateResponse(created),
      row: created
    }
  };
}
