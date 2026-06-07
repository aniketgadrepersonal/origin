/**
 * useEvents — fetches and manages the full list of events.
 * Provides create, update, and refresh capabilities.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { EventResponse, CreateEventInput, UpdateEventInput, ApiResponse } from "@/types";

export function useEvents() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/events");
      const json: ApiResponse<EventResponse[]> = await res.json();
      if (!json.success || !json.data) throw new Error(json.error ?? "Failed to load events.");
      setEvents(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const createEvent = useCallback(async (input: CreateEventInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json: ApiResponse<EventResponse> = await res.json();
      if (!json.success) return { success: false, error: json.message ?? json.error };
      await fetchEvents();
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, [fetchEvents]);

  const updateEvent = useCallback(async (id: string, input: UpdateEventInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json: ApiResponse<EventResponse> = await res.json();
      if (!json.success) return { success: false, error: json.message ?? json.error };
      await fetchEvents();
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, [fetchEvents]);

  return { events, loading, error, refresh: fetchEvents, createEvent, updateEvent };
}
