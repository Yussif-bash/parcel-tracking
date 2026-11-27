"use client"

import {CircleCheck, CircleAlert} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, type FormEvent} from "react";
import { firstMessagePerField, inputClass, type FieldErrors } from "@/lib/forms";

type Registered = {trackingCode: string, receiverName: string};


const fields = [
    {name: "senderName", label: "Sender Name", type: "text"},
    {name: "senderPhone", label: "Sender Phone", type: "tel"},
    {name: "receiverName", label: "Receiver Name", type: "text"},
    {name: "receiverPhone", label: "Receiver Phone", type: "tel"},
] as const

export function RegisterParcelForm() {
    const router = useRouter()
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [registered, setRegistered] = useState<Registered | null>(null);
    const [isValid, setIsValid] = useState(false);


    function handleFormChange(event: React.FormEvent<HTMLFormElement>){
      setIsValid(event.currentTarget.checkValidity())
    }

    
async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    setFormError(null);
    setRegistered(null);

    const form = event.currentTarget

    try {
        const response = await fetch("/api/parcels", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });

        if(response.status === 401){
            router.push("/login");
            router.refresh();
            return;
        }

        if(response.status === 201){
            const parcel = await response.json();
            setRegistered({trackingCode: parcel.trackingCode, receiverName: parcel.receiverName});
            form.reset();
            router.refresh();
            return;
        }        

        const body = await response.json().catch(() => null);
        const errors = response.status === 400 ? firstMessagePerField(body?.details) : {};

        if(Object.keys(errors).length > 0){
            setFieldErrors(errors);
        }else if(response.status === 403){
            setFormError("You don't have permission to register parcels.")
        }else{
            setFormError("Something went wrong. Please try again.")
        }
    } catch (error) {
        console.error("Parcel creation failed:", error);
        setFormError("Could not reach the server. Check your connection and try again.");
         
    } finally {
        setSubmitting(false);
    }
}


   return (
    <div className="space-y-4">
      {registered && (
        <div role="status" className="rounded-xl border border-ocean-600 bg-ocean-50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-ocean-800">
            <CircleCheck aria-hidden className="size-[18px]" />
            Parcel registered for {registered.receiverName}
          </p>
          <p className="mt-2 text-xs text-fog-700">Tracking code</p>
          <p className="font-mono text-2xl font-medium tracking-wider text-ocean-800">
            {registered.trackingCode}
          </p>
          <p className="mt-1 text-sm text-fog-700">Write this code on the receipt.</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        onChange={handleFormChange}
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

        <div className="grid gap-4 md:grid-cols-2">
          {fields.map(({ name, label, type }) => (
            <div key={name}>
              <label htmlFor={name} className="block text-sm font-medium text-ocean-800">
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                required
                placeholder={`Enter ${label}`}
                inputMode={type === "tel" ? "tel" : undefined}
                aria-invalid={fieldErrors[name] ? true : undefined}
                aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
                className={`${inputClass} h-10`}
              />
              {fieldErrors[name] && (
                <p id={`${name}-error`} className="mt-1 text-xs text-coral-700">
                  {fieldErrors[name]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-ocean-800">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            required
            maxLength={300}
            aria-invalid={fieldErrors.description ? true : undefined}
            aria-describedby={fieldErrors.description ? "description-error" : undefined}
            className={`${inputClass} py-2`}
            placeholder="Enter a description"
          />
          {fieldErrors.description && (
            <p id="description-error" className="mt-1 text-xs text-coral-700">
              {fieldErrors.description}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || submitting}
          className="h-11 w-full rounded-lg bg-coral-600 px-5 font-medium text-white hover:bg-coral-700 disabled:opacity-60"
        >
          {submitting ? "Registering…" : "Register parcel"}
        </button>
      </form>
    </div>
  );
}