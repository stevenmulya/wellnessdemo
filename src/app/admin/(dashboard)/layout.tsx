import { redirect } from "next/navigation";
import { getWellnessSession } from "@/wellness/security/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWellnessSession();

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/?auth=signin&target=admin");
  }

  return <>{children}</>;
}
