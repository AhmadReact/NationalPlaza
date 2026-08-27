"use client";

import { useEffect, useState } from "react";
import {
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  type CustomerPreferences,
} from "@/app/store/accountAPI";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch } from "@/lib/store/hooks";

const toggles: {
  key: keyof Pick<
    CustomerPreferences,
    | "newsletter"
    | "emailNotifications"
    | "smsNotifications"
    | "pushNotifications"
  >;
  label: string;
  hint: string;
}[] = [
  {
    key: "newsletter",
    label: "Newsletter",
    hint: "Sale alerts, new arrivals, and seasonal offers",
  },
  {
    key: "emailNotifications",
    label: "Email notifications",
    hint: "Order updates and account messages",
  },
  {
    key: "smsNotifications",
    label: "SMS notifications",
    hint: "Optional text messages for order status",
  },
  {
    key: "pushNotifications",
    label: "Push notifications",
    hint: "Browser or app alerts when available",
  },
];

export default function PreferencesPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetPreferencesQuery();
  const [updatePreferences, { isLoading: saving }] =
    useUpdatePreferencesMutation();
  const [form, setForm] = useState<CustomerPreferences | null>(null);

  useEffect(() => {
    if (data?.data) setForm(data.data);
  }, [data?.data]);

  const onSave = async () => {
    if (!form) return;
    try {
      await updatePreferences(form).unwrap();
      dispatch(toast.success("Preferences saved"));
    } catch {
      // interceptor toast
    }
  };

  return (
    <div>
      <span className="block h-1.5 w-16 rounded-full bg-gradient-to-r from-brand-600 to-brand-400" />
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-950">
        Preferences
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Choose how we contact you and how the store is displayed.
      </p>

      {isLoading || !form ? (
        <p className="mt-8 text-sm text-slate-500">Loading preferences…</p>
      ) : (
        <div className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <ul className="space-y-4">
            {toggles.map((item) => (
              <li
                key={item.key}
                className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-bold text-brand-950">{item.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.hint}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form[item.key]}
                  onClick={() =>
                    setForm((prev) =>
                      prev ? { ...prev, [item.key]: !prev[item.key] } : prev,
                    )
                  }
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    form[item.key] ? "bg-brand-900" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      form[item.key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Language
              </span>
              <select
                value={form.language}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, language: e.target.value } : prev,
                  )
                }
                className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-600"
              >
                <option value="en">English</option>
                <option value="ur">Urdu</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Currency
              </span>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, currency: e.target.value } : prev,
                  )
                }
                className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-600"
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Timezone
              </span>
              <select
                value={form.timezone ?? "Asia/Karachi"}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, timezone: e.target.value } : prev,
                  )
                }
                className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-600"
              >
                <option value="Asia/Karachi">Asia/Karachi</option>
                <option value="UTC">UTC</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave()}
            className="rounded-full bg-brand-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </div>
      )}
    </div>
  );
}
