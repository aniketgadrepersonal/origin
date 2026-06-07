/**
 * useRegistrations — register and unregister from an event.
 */

"use client";

import { useCallback } from "react";
import type { ApiResponse, Registration } from "@/types";

export function useRegistrations(onSuccess?: () => void) {
  const register = useCallback(async (
    eventId: string,
    userId: string
  ): Promise<{ success: boolean; registrationId?: string; error?: string }> => {
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, userId }),
      });
      const json: ApiResponse<Registration> = await res.json();
      if (!json.success) return { success: false, error: json.error };
      onSuccess?.();
      return { success: true, registrationId: json.data?.id };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, [onSuccess]);

  const unregister = useCallback(async (
    registrationId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/registrations/${registrationId}`, { method: "DELETE" });
      const json: ApiResponse = await res.json();
      if (!json.success) return { success: false, error: json.error };
      onSuccess?.();
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, [onSuccess]);

  return { register, unregister };
}
