import { getWorkspace } from "@/db/workspace";
import { TerraSiklusApp } from "@/components/terrasiklus-app";
import type { Page } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ halaman?: string }>;
}) {
  const [data, params] = await Promise.all([getWorkspace(), searchParams]);
  const allowed: Page[] = [
    "dashboard",
    "gardens",
    "rotation",
    "history",
    "soil",
    "catalog",
  ];
  const page = allowed.includes(params.halaman as Page)
    ? (params.halaman as Page)
    : "dashboard";
  return <TerraSiklusApp initialData={data} initialPage={page} />;
}
