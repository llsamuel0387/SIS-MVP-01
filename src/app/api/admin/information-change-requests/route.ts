import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { listAdminInformationChangeRequests } from "@/lib/information-change-requests/list-admin-information-change-requests.service";

export async function GET(request: Request) {
  const { response } = await guardApiRequest(request, {
    permissions: [PERMISSIONS.userUpdate]
  });
  if (response) {
    return response;
  }

  const items = await listAdminInformationChangeRequests();
  return NextResponse.json(items);
}
