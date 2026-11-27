export type FieldErrors = Record<string, string>;

export const inputClass =
  "mt-1 w-full rounded-lg border border-ocean-200 bg-fog-50 px-3 text-base text-ocean-800 focus:border-ocean-600 focus:outline-none focus:ring-2 focus:ring-ocean-600/30 aria-[invalid=true]:border-coral-500";

/** Turns the backend's list of problems into one message per field. */
export function firstMessagePerField(details: unknown): FieldErrors {
  const errors: FieldErrors = {};
  if (!Array.isArray(details)) return errors;
  for (const detail of details as { field?: string; message?: string }[]) {
    if (detail.field && detail.message && !(detail.field in errors)) {
      errors[detail.field] = detail.message;
    }
  }
  return errors;
}