/**
 * Input validation utilities.
 *
 * All validation is pure — no side effects, easy to unit test.
 * Validators return a structured error list so the API can return
 * field-level feedback rather than a single generic error message.
 */

import type {
  CreateEventInput,
  UpdateEventInput,
  CreateRegistrationInput,
  ValidationError,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isValidISODate = (value: unknown): boolean => {
  if (!isNonEmptyString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};

const isFutureDate = (value: string): boolean =>
  new Date(value).getTime() > Date.now();

const isPositiveInteger = (value: unknown): boolean =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

// ---------------------------------------------------------------------------
// Event validators
// ---------------------------------------------------------------------------

/**
 * Validates the body of a POST /api/events request.
 * Returns an empty array when the input is valid.
 */
export function validateCreateEvent(
  input: Partial<CreateEventInput>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isNonEmptyString(input.title)) {
    errors.push({ field: "title", message: "Title is required." });
  } else if (input.title.trim().length > 200) {
    errors.push({
      field: "title",
      message: "Title must be 200 characters or fewer.",
    });
  }

  if (!isNonEmptyString(input.description)) {
    errors.push({ field: "description", message: "Description is required." });
  }

  if (!isValidISODate(input.date)) {
    errors.push({
      field: "date",
      message: "Date must be a valid ISO 8601 date-time string.",
    });
  } else if (!isFutureDate(input.date as string)) {
    errors.push({
      field: "date",
      message: "Event date must be in the future.",
    });
  }

  if (!isPositiveInteger(input.maxCapacity)) {
    errors.push({
      field: "maxCapacity",
      message: "maxCapacity must be a positive integer.",
    });
  } else if ((input.maxCapacity as number) > 50) {
    errors.push({
      field: "maxCapacity",
      message: "maxCapacity cannot exceed 50.",
    });
  }

  return errors;
}

/**
 * Validates the body of a PATCH /api/events/[id] request.
 * All fields are optional, but any provided field must be valid.
 */
export function validateUpdateEvent(
  input: Partial<UpdateEventInput>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if ("title" in input) {
    if (!isNonEmptyString(input.title)) {
      errors.push({ field: "title", message: "Title cannot be empty." });
    } else if ((input.title as string).trim().length > 200) {
      errors.push({
        field: "title",
        message: "Title must be 200 characters or fewer.",
      });
    }
  }

  if ("date" in input) {
    if (!isValidISODate(input.date)) {
      errors.push({
        field: "date",
        message: "Date must be a valid ISO 8601 date-time string.",
      });
    } else if (!isFutureDate(input.date as string)) {
      errors.push({
        field: "date",
        message: "Event date must be in the future.",
      });
    }
  }

  if ("maxCapacity" in input) {
    if (!isPositiveInteger(input.maxCapacity)) {
      errors.push({
        field: "maxCapacity",
        message: "maxCapacity must be a positive integer.",
      });
    } else if ((input.maxCapacity as number) > 50) {
      errors.push({
        field: "maxCapacity",
        message: "maxCapacity cannot exceed 50.",
      });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Registration validators
// ---------------------------------------------------------------------------

/**
 * Validates the body of a POST /api/registrations request.
 */
export function validateCreateRegistration(
  input: Partial<CreateRegistrationInput>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isNonEmptyString(input.eventId)) {
    errors.push({ field: "eventId", message: "eventId is required." });
  }

  if (!isNonEmptyString(input.userId)) {
    errors.push({ field: "userId", message: "userId is required." });
  }

  return errors;
}
