import { useEffect } from "react";
import { db } from "@/services/db";

/** Drives the simulated live telemetry feed while a dashboard is mounted. */
export function useTelemetryFeed(intervalMs = 3000) {
  useEffect(() => {
    const id = window.setInterval(() => db.tickTelemetry(), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}
