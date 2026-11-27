"use client";

import { CircleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { firstMessagePerField, inputClass, type FieldErrors } from "@/lib/forms";
import type { Driver } from "@/lib/trips";

export function NewTripForm({ drivers }: { drivers: Driver[] }) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (drivers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ocean-500 bg-white p-6 text-sm text-fog-700">
        There are no drivers yet. Ask the owner to add a driver account before creating a trip.
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });

      if (response.status === 401) {
        router.push("/login");
        router.refresh();
        return;
      }

      if (response.status === 201) {
        form.reset();
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
      const errors = response.status === 400 ? firstMessagePerField(body?.details) : {};

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const error = (name: string) => fieldErrors[name];

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-xl border border-fog-200 bg-fog-100 p-5"
    >
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-coral-500 bg-coral-50 px-3 py-2.5 text-sm text-coral-700"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-[18px] shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="driverId" className="block text-sm font-medium text-ocean-800">
            Driver
          </label>
          <select
            id="driverId"
            name="driverId"
            defaultValue=""
            aria-invalid={error("driverId") ? true : undefined}
            aria-describedby={error("driverId") ? "driverId-error" : undefined}
            className={`${inputClass} h-10`}
          >
            <option value="" className="text-ocean-80">Choose a driver</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id} className="text-ocean-80">
                {driver.name}
              </option>
            ))}
          </select>
          {error("driverId") && (
            <p id="driverId-error" className="mt-1 text-xs text-coral-700">
              {error("driverId")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="vehicleNumber" className="block text-sm font-medium text-ocean-800">
            Vehicle number
          </label>
          <input
            id="vehicleNumber"
            name="vehicleNumber"
            type="text"
            aria-invalid={error("vehicleNumber") ? true : undefined}
            aria-describedby={error("vehicleNumber") ? "vehicleNumber-error" : undefined}
            className={`${inputClass} h-10 uppercase`}
          />
          {error("vehicleNumber") && (
            <p id="vehicleNumber-error" className="mt-1 text-xs text-coral-700">
              {error("vehicleNumber")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-ocean-800">
            Destination
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            aria-invalid={error("destination") ? true : undefined}
            aria-describedby={error("destination") ? "destination-error" : undefined}
            className={`${inputClass} h-10`}
          />
          {error("destination") && (
            <p id="destination-error" className="mt-1 text-xs text-coral-700">
              {error("destination")}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="h-11 w-full rounded-lg bg-coral-600 px-5 font-medium text-white hover:bg-coral-700 disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create trip"}
      </button>
    </form>
  );
}