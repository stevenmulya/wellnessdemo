import { redirect } from "next/navigation";
import { getWellnessSession } from "@/wellness/security/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWellnessSession();

  if (!session) {
    redirect("/?auth=signin&target=dashboard");
  }

  return <>{children}</>;
}
