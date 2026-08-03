import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/components/RequireRole";
import { AdminPage } from "@/pages/admin/AdminPage";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Fleet Control Center | SmartFM Admin" },
      { name: "description", content: "Live GPS telemetry, trip allocation, vehicle registry and incident logs for fleet dispatchers." },
      { property: "og:title", content: "Fleet Control Center | SmartFM Admin" },
      { property: "og:description", content: "Dispatch trips, monitor telemetry and govern fleet assets in real time." },
    ],
  }),
  component: () => (
    <RequireRole role="admin">
      <AdminPage />
    </RequireRole>
  ),
});
