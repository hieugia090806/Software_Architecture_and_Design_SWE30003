import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/components/RequireRole";
import { StaffPage } from "@/pages/staff/StaffPage";

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Driver Execution Workspace | SmartFM Staff" },
      { name: "description", content: "Trip execution, task checklists and emergency incident reporting for SmartFM drivers." },
      { property: "og:title", content: "Driver Execution Workspace | SmartFM Staff" },
      { property: "og:description", content: "Run your assigned trip, complete checklists and report incidents instantly." },
    ],
  }),
  component: () => (
    <RequireRole role="staff">
      <StaffPage />
    </RequireRole>
  ),
});
