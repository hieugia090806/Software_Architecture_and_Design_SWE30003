import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/components/RequireRole";
import { CustomerPage } from "@/pages/customer/CustomerPage";

export const Route = createFileRoute("/customer")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shipment Tracking | SmartFM Customer Portal" },
      { name: "description", content: "Track live shipments, estimate freight pricing and download invoices in the SmartFM customer portal." },
      { property: "og:title", content: "Shipment Tracking | SmartFM Customer Portal" },
      { property: "og:description", content: "Live order tracking, dynamic freight quotes and billing in one portal." },
    ],
  }),
  component: () => (
    <RequireRole role="customer">
      <CustomerPage />
    </RequireRole>
  ),
});
