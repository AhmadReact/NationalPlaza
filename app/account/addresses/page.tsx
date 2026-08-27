"use client";

import { useState } from "react";
import {
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useGetAddressesQuery,
  useSetDefaultAddressMutation,
  useUpdateAddressMutation,
  type Address,
  type CreateAddressInput,
} from "@/app/store/accountAPI";
import { AddressForm } from "@/components/account/address-form";
import { isValidCheckoutPhone } from "@/lib/phone";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch } from "@/lib/store/hooks";

export default function AddressesPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAddressesQuery();
  const [createAddress, { isLoading: creating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: updating }] = useUpdateAddressMutation();
  const [deleteAddress, { isLoading: deleting }] = useDeleteAddressMutation();
  const [setDefaultAddress, { isLoading: settingDefault }] =
    useSetDefaultAddressMutation();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const addresses = data?.data ?? [];
  const pending = creating || updating || deleting || settingDefault;

  const onCreate = async (input: CreateAddressInput) => {
    try {
      await createAddress(input).unwrap();
      dispatch(toast.success("Address saved"));
      setShowForm(false);
    } catch {
      // interceptor toast
    }
  };

  const onUpdate = async (input: CreateAddressInput) => {
    if (!editing) return;
    try {
      await updateAddress({ id: editing.id, body: input }).unwrap();
      dispatch(toast.success("Address updated"));
      setEditing(null);
    } catch {
      // interceptor toast
    }
  };

  const onDelete = async (address: Address) => {
    if (!window.confirm(`Remove ${address.fullName}'s address?`)) return;
    try {
      await deleteAddress(address.id).unwrap();
      dispatch(toast.success("Address removed"));
      if (editing?.id === address.id) setEditing(null);
    } catch {
      // interceptor toast
    }
  };

  const onDefault = async (address: Address) => {
    try {
      await setDefaultAddress(address.id).unwrap();
      dispatch(toast.success("Default address updated"));
    } catch {
      // interceptor toast
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="block h-1.5 w-16 rounded-full bg-gradient-to-r from-brand-600 to-brand-400" />
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-950">
            Addresses
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Used at checkout for delivery.
          </p>
        </div>
        {!showForm && !editing && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            Add address
          </button>
        )}
      </div>

      {(showForm || editing) && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-extrabold text-brand-950">
            {editing ? "Edit address" : "New address"}
          </h2>
          <div className="mt-4">
            <AddressForm
              key={editing?.id ?? "new"}
              initial={editing}
              pending={pending}
              submitLabel={editing ? "Update address" : "Save address"}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
              onSubmit={editing ? onUpdate : onCreate}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="mt-8 text-sm text-slate-500">Loading addresses…</p>
      ) : addresses.length === 0 && !showForm ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-600">No saved addresses yet.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-6 inline-flex rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
          >
            Add your first address
          </button>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-brand-950">
                    {address.label || "Address"}{" "}
                    {address.isDefault ? (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-brand-700">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {address.fullName}
                    <br />
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {address.city}
                    {address.state ? `, ${address.state}` : ""}{" "}
                    {address.postalCode}
                    <br />
                    {address.country}
                    {address.phone ? ` · ${address.phone}` : ""}
                  </p>
                  {!isValidCheckoutPhone(address.phone ?? "") ? (
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      Add a WhatsApp / mobile number before using this address.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!address.isDefault && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void onDefault(address)}
                      className="rounded-full border-2 border-slate-200 px-3 py-1.5 text-xs font-semibold text-brand-900 hover:border-brand-300 disabled:opacity-50"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setShowForm(false);
                      setEditing(address);
                    }}
                    className="rounded-full border-2 border-slate-200 px-3 py-1.5 text-xs font-semibold text-brand-900 hover:border-brand-300 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void onDelete(address)}
                    className="rounded-full border-2 border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:border-red-300 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
