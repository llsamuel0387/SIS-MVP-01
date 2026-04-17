import { prisma } from "@/lib/prisma";
import {
  toAdminInformationChangeRequestListItem
} from "@/lib/information-change-requests/list-admin-information-change-requests.helpers";

export async function listAdminInformationChangeRequests() {
  const rows = await prisma.informationChangeRequest.findMany({
    include: {
      requester: {
        include: { profile: true, person: { include: { sections: true } } }
      }
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200
  });
  return rows.map(toAdminInformationChangeRequestListItem);
}
