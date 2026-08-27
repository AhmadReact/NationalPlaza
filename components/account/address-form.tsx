"use client";

import { type FormEvent, useState } from "react";
import type {
  Address,
  CreateAddressInput,
} from "@/app/store/accountAPI";
import {
  CHECKOUT_PHONE_HELPER,
  CHECKOUT_PHONE_LABEL,
  isValidCheckoutPhone,
} from "@/lib/phone";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch } from "@/lib/store/hooks";

const emptyForm: CreateAddressInput = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "PK",
  isDefault: false,
};

function fromAddress(address: Address): CreateAddressInput {
  return {
    label: address.label ?? "",
    fullName: address.fullName,
    phone: address.phone ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state ?? "",
    postalCode: address.postalCode,
    country: address.country || "PK",
    isDefault: address.isDefault,
  };
}

type AddressFormProps = {
  initial?: Address | null;
  pending?: boolean;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (input: CreateAddressInput) => Promise<void>;
};

export function AddressForm({
  initial,
  pending = false,
  submitLabel,
  onCancel,
  onSubmit,
}: AddressFormProps) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<CreateAddressInput>(
    initial ? fromAddress(initial) : emptyForm,
  );

  const setField = (key: keyof CreateAddressInput, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidCheckoutPhone(form.phone ?? "")) {
      dispatch(
        toast.error(
          "Enter a valid WhatsApp / mobile number (03XXXXXXXXX, +92…, or 92…).",
        ),
      );
      return;
    }

    try {
      await onSubmit({
        ...form,
        label: form.label?.trim() || undefined,
        phone: form.phone?.trim(),
        line2: form.line2?.trim() || undefined,
        state: form.state?.trim() || undefined,
        country: form.country?.trim() || "PK",
      });
    } catch {
      // interceptor toast
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Label"
          value={form.label ?? ""}
          onChange={(value) => setField("label", value)}
        />
        <Field
          label="Full name"
          required
          value={form.fullName}
          onChange={(value) => setField("fullName", value)}
        />
        <label className="block sm:col-span-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {CHECKOUT_PHONE_LABEL}
          </span>
          <input
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone ?? ""}
            onChange={(e) => setField("phone", e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-600"
          />
          <span className="mt-1 block text-xs text-slate-500">
            {CHECKOUT_PHONE_HELPER}
          </span>
        </label>
        <Field
          label="Address line 1"
          required
          className="sm:col-span-2"
          value={form.line1}
          onChange={(value) => setField("line1", value)}
        />
        <Field
          label="Address line 2"
          className="sm:col-span-2"
          value={form.line2 ?? ""}
          onChange={(value) => setField("line2", value)}
        />
        <Field
          label="City"
          required
          value={form.city}
          onChange={(value) => setField("city", value)}
        />
        <Field
          label="State / province"
          value={form.state ?? ""}
          onChange={(value) => setField("state", value)}
        />
        <Field
          label="Postal code"
          required
          value={form.postalCode}
          onChange={(value) => setField("postalCode", value)}
        />
        <Field
          label="Country"
          required
          value={form.country ?? "PK"}
          onChange={(value) => setField("country", value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(form.isDefault)}
          onChange={(e) => setField("isDefault", e.target.checked)}
        />
        Set as default shipping address
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-600"
      />
    </label>
  );
}
