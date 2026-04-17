import { prisma } from "@/lib/prisma";
import { toPublicProviderConfig } from "@/lib/sso";

export async function listEnabledSsoProviderConfigsForApi() {
  const rows = await prisma.identityProviderConfig.findMany({
    where: { enabled: true }
  });
  return rows.map(toPublicProviderConfig);
}
