import { prisma } from "@/lib/prisma";
import { toMyInformationChangeRequestListItem } from "@/lib/information-change-requests/my-information-change-request-list.helpers";

export async function listMyInformationChangeRequests(requesterUserId: string) {
  const rows = await prisma.informationChangeRequest.findMany({
    where: { requesterUserId },
    orderBy: { createdAt: "desc" },
    take: 30
  });
  return rows.map(toMyInformationChangeRequestListItem);
}
