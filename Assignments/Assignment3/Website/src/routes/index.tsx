import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/login/LoginPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartFM — Sign In | Fleet Intelligence Platform" },
      { name: "description", content: "Sign in to SmartFM for real-time GPS telemetry, dispatch allocation, freight pricing and incident management." },
      { property: "og:title", content: "SmartFM — Fleet Intelligence Platform" },
      { property: "og:description", content: "Centralized logistics and fleet control with live telemetry and multi-role dashboards." },
    ],
  }),
  component: LoginPage,
});
