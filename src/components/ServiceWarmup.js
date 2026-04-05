"use client";

import { useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Fires a single background request to /warmup which pings all Render
 * free-tier microservices in parallel. This kicks off cold starts before
 * the user navigates to AI Companion, Mood Tracker, etc.
 */
export default function ServiceWarmup() {
  useEffect(() => {
    fetch(`${API_BASE_URL}/warmup`, { method: "GET", cache: "no-store" }).catch(
      () => {},
    );
  }, []);

  return null;
}
