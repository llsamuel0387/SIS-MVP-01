import { prisma } from "@/lib/prisma";
import { ERROR_CODES } from "@/lib/api-error";
import { encryptNullableSensitiveField, toEmailLookupIndex } from "@/lib/pii-field";
import { decodeInformationChangeRequestedFields } from "@/lib/information-change-request";
import { upsertPersonSection } from "@/lib/person-data";
import { readIdentityFromPersonSections, readStudentAddressFromPersonSections } from "@/lib/person-profile";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type PatchInformationChangeDecisionInput = {
  requestId: string;
  decision: "APPROVE" | "REJECT";
  reviewerNote: string | null;
  reviewerUserId: string;
};

export type PatchInformationChangeDecisionSuccess = {
  status: string;
  audit: {
    action: "information_change_request_approve" | "information_change_request_reject";
    targetId: string;
    detail: Record<string, unknown>;
  };
};

export async function patchInformationChangeRequestDecision(
  input: PatchInformationChangeDecisionInput
): Promise<{ ok: true; data: PatchInformationChangeDecisionSuccess } | { ok: false; code: ErrorCode }> {
  const target = await prisma.informationChangeRequest.findUnique({
    where: { id: input.requestId }
  });

  if (!target) {
    return { ok: false, code: ERROR_CODES.RESOURCE_INFORMATION_CHANGE_REQUEST_NOT_FOUND };
  }
  if (target.status !== "PENDING") {
    return { ok: false, code: ERROR_CODES.ACCOUNT_INVALID_STATUS };
  }

  const handledAt = new Date();
  const reviewerNote = input.reviewerNote ?? null;

  if (input.decision === "REJECT") {
    const rejected = await prisma.informationChangeRequest.update({
      where: { id: input.requestId },
      data: {
        status: "REJECTED",
        reviewerNote: encryptNullableSensitiveField(reviewerNote),
        handledAt,
        handledByUserId: input.reviewerUserId
      }
    });

    return {
      ok: true,
      data: {
        status: rejected.status,
        audit: {
          action: "information_change_request_reject",
          targetId: rejected.id,
          detail: {
            requesterUserId: rejected.requesterUserId,
            targetUserId: rejected.targetUserId
          }
        }
      }
    };
  }

  const approved = await prisma.$transaction(async (tx) => {
    const currentProfile = await tx.userProfile.findUnique({
      where: { userId: target.targetUserId },
      include: { user: { include: { person: { include: { sections: true } } } } }
    });
    const identity = readIdentityFromPersonSections(currentProfile?.user.person?.sections);
    const studentAddress = readStudentAddressFromPersonSections(currentProfile?.user.person?.sections);
    const requested = decodeInformationChangeRequestedFields(target);

    const nextEmail = requested.email || identity.email;
    const nextTermCountry = requested.termTimeAddress.country || studentAddress.termTimeAddress.country;
    const nextTermAddressLine1 = requested.termTimeAddress.addressLine1 || studentAddress.termTimeAddress.addressLine1;
    const nextTermAddressLine2 = requested.termTimeAddress.addressLine2 || studentAddress.termTimeAddress.addressLine2;
    const nextTermPostCode = requested.termTimeAddress.postCode || studentAddress.termTimeAddress.postCode;
    const nextHomeCountry = requested.homeAddress.country || studentAddress.homeAddress.country;
    const nextHomeAddressLine1 = requested.homeAddress.addressLine1 || studentAddress.homeAddress.addressLine1;
    const nextHomeAddressLine2 = requested.homeAddress.addressLine2 || studentAddress.homeAddress.addressLine2;
    const nextHomePostCode = requested.homeAddress.postCode || studentAddress.homeAddress.postCode;

    await tx.userProfile.upsert({
      where: { userId: target.targetUserId },
      create: {
        userId: target.targetUserId,
        firstNameKo: currentProfile?.firstNameKo ?? "",
        lastNameKo: currentProfile?.lastNameKo ?? "",
        firstNameEn: currentProfile?.firstNameEn ?? null,
        middleNameEn: currentProfile?.middleNameEn ?? null,
        lastNameEn: currentProfile?.lastNameEn ?? null,
        dateOfBirth: null,
        email: nextEmail ? toEmailLookupIndex(nextEmail) : null,
        termCountry: encryptNullableSensitiveField(nextTermCountry),
        termAddressLine1: encryptNullableSensitiveField(nextTermAddressLine1),
        termAddressLine2: encryptNullableSensitiveField(nextTermAddressLine2),
        termPostCode: encryptNullableSensitiveField(nextTermPostCode),
        homeCountry: encryptNullableSensitiveField(nextHomeCountry),
        homeAddressLine1: encryptNullableSensitiveField(nextHomeAddressLine1),
        homeAddressLine2: encryptNullableSensitiveField(nextHomeAddressLine2),
        homePostCode: encryptNullableSensitiveField(nextHomePostCode),
        nationality: currentProfile?.nationality ?? null
      },
      update: {
        email: nextEmail ? toEmailLookupIndex(nextEmail) : null,
        termCountry: encryptNullableSensitiveField(nextTermCountry),
        termAddressLine1: encryptNullableSensitiveField(nextTermAddressLine1),
        termAddressLine2: encryptNullableSensitiveField(nextTermAddressLine2),
        termPostCode: encryptNullableSensitiveField(nextTermPostCode),
        homeCountry: encryptNullableSensitiveField(nextHomeCountry),
        homeAddressLine1: encryptNullableSensitiveField(nextHomeAddressLine1),
        homeAddressLine2: encryptNullableSensitiveField(nextHomeAddressLine2),
        homePostCode: encryptNullableSensitiveField(nextHomePostCode)
      }
    });

    const person =
      currentProfile?.user.person ??
      (await tx.person.create({
        data: {
          userId: target.targetUserId,
          type: "STUDENT"
        }
      }));

    const requestRow = await tx.informationChangeRequest.update({
      where: { id: input.requestId },
      data: {
        status: "APPROVED",
        reviewerNote: encryptNullableSensitiveField(reviewerNote),
        handledAt,
        handledByUserId: input.reviewerUserId
      }
    });

    const identityPayload = {
      firstNameKo: identity.firstNameKo,
      lastNameKo: identity.lastNameKo,
      firstNameEn: identity.firstNameEn,
      middleNameEn: identity.middleNameEn,
      lastNameEn: identity.lastNameEn,
      nationality: identity.nationality,
      dateOfBirth: identity.dateOfBirth,
      email: nextEmail
    };

    const addressPayload = {
      termTimeAddress: {
        country: nextTermCountry,
        addressLine1: nextTermAddressLine1,
        addressLine2: nextTermAddressLine2,
        postCode: nextTermPostCode
      },
      homeAddress: {
        country: nextHomeCountry,
        addressLine1: nextHomeAddressLine1,
        addressLine2: nextHomeAddressLine2,
        postCode: nextHomePostCode
      }
    };

    await upsertPersonSection(
      {
        personId: person.id,
        sectionKey: "identity.v1",
        payload: identityPayload
      },
      tx
    );
    await upsertPersonSection(
      {
        personId: person.id,
        sectionKey: "student-address.v1",
        payload: addressPayload
      },
      tx
    );

    return { requestRow };
  });

  return {
    ok: true,
    data: {
      status: approved.requestRow.status,
      audit: {
        action: "information_change_request_approve",
        targetId: approved.requestRow.id,
        detail: {
          requesterUserId: approved.requestRow.requesterUserId,
          targetUserId: approved.requestRow.targetUserId
        }
      }
    }
  };
}
