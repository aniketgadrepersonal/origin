/**
 * Core domain types shared across the frontend and API layer.
 * Keeping types in one place ensures the API contract and UI stay in sync.
 */

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

export interface Event {
  id: string;
  title: string;
  description: string;
  /** ISO 8601 date-time string stored and returned in UTC */
  date: string;
  maxCapacity: number;
  createdAt: string;
  updatedAt: string;
}

/** Fields required to create a new event */
export type CreateEventInput = Omit<Event, "id" | "createdAt" | "updatedAt">;

/** All fields are optional on update — only provided fields are patched */
export type UpdateEventInput = Partial<CreateEventInput>;

/** Event shape returned to the client — includes computed availability */
export interface EventResponse extends Event {
  registrationCount: number;
  availableSpots: number;
  isFull: boolean;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export interface Registration {
  id: string;
  eventId: string;
  userId: string; // set to email server-side, used for dedup
  name: string;
  email: string;
  aboutMe: string;
  registeredAt: string;
}

export interface CreateRegistrationInput {
  eventId: string;
  name: string;
  email: string;
  aboutMe?: string;
}

// ---------------------------------------------------------------------------
// API response envelope
// ---------------------------------------------------------------------------

/** Every API route returns this shape so the client can handle errors uniformly */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  /** Human-readable message for UI display */
  message?: string;
}

// ---------------------------------------------------------------------------
// Validation error
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}
