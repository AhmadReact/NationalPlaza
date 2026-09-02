"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCreateAddressMutation,
  useGetAddressesQuery,
  type CreateAddressInput,
} from "@/app/store/accountAPI";
import {
  useGetDeliveryMethodsQuery,
  usePlaceGuestOrderMutation,
  usePlaceOrderMutation,
  usePreviewCheckoutMutation,
  usePreviewGuestCheckoutMutation,
  useRequestCheckoutOtpMutation,
  useRequestGuestCheckoutOtpMutation,
  useValidateCouponMutation,
  type CheckoutInput,
  type CheckoutOtpResult,
  type CheckoutPreview,
  type GuestCheckoutAddressInput,
  type GuestCheckoutInput,
  type PlaceOrderResult,
} from "@/app/store/checkoutAPI";
import { clearCartState, selectCart } from "@/app/store/cartSlice";
import { loadCart } from "@/app/store/cartThunk";
import {
  selectCustomerIsAuthenticated,
  selectCustomerUser,
} from "@/app/store/customerAuthSlice";
import { CheckoutOtpModal } from "@/components/checkout-otp-modal";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { clearGuestToken, getGuestToken } from "@/lib/cart/guestToken";
import { saveLastPlacedOrder } from "@/lib/order/lastOrder";
import { formatPrice } from "@/lib/data";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { CHECKOUT_EMAIL_HELPER, isValidEmail } from "@/lib/email";
import {
  CHECKOUT_PHONE_HELPER,
  CHECKOUT_PHONE_LABEL,
  isValidCheckoutPhone,
} from "@/lib/phone";
import { toast } from "@/lib/store/snackbarSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  checkoutShippingCopy,
  formatDeliveryEta,
} from "@/lib/order/status";
import {
  filledButInvalid,
  filledButTooShort,
  getCheckoutBlockers,
} from "@/app/checkout/checkout-requirements";

const emptyShipping: GuestCheckoutAddressInput = {
  fullName: "",
  line1: "",
  city: "",
  postalCode: "",
  phone: "",
  line2: "",
  state: "Punjab",
  country: "PK",
};

function isGuestAddressReady(address: GuestCheckoutAddressInput): boolean {
  return Boolean(
    address.fullName.trim().length >= 2 &&
      address.line1.trim().length >= 2 &&
      address.city.trim().length >= 2 &&
      isValidCheckoutPhone(address.phone ?? ""),
  );
}

function PhoneHint({ id }: { id?: string }) {
  return (
    <span id={id} className="mt-1 block text-xs text-slate-500">
      {CHECKOUT_PHONE_HELPER} Use 03XXXXXXXXX, +92…, or 92….
    </span>
  );
}

function FieldLabel({
  required,
  optional,
  children,
}: {
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
}) {
  const showOptional = optional ?? !required;
  return (
    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
      {children}
      {required ? (
        <>
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
          <span className="sr-only"> (required)</span>
        </>
      ) : showOptional ? (
        <span className="ml-1 font-medium normal-case tracking-normal text-slate-400">
          (optional)
        </span>
      ) : null}
    </span>
  );
}

function FieldError({ id, children }: { id: string; children?: string | null }) {
  if (!children) return null;
  return (
    <span id={id} className="mt-1 block text-xs font-semibold text-red-600">
      {children}
    </span>
  );
}

type FetchLikeError = { status?: number | string; data?: unknown };

function asFetchError(error: unknown): FetchLikeError {
  if (typeof error === "object" && error !== null) {
    return error as FetchLikeError;
  }
  return {};
}

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectCustomerIsAuthenticated);
  const customerUser = useAppSelector(selectCustomerUser);
  const cart = useAppSelector(selectCart);

  const {
    data: addressesData,
    isLoading: addressesLoading,
    refetch: refetchAddresses,
  } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });
  const { data: deliveryData, isLoading: deliveryLoading } =
    useGetDeliveryMethodsQuery();

  const [previewCheckout, { isLoading: customerPreviewLoading }] =
    usePreviewCheckoutMutation();
  const [requestCheckoutOtp, { isLoading: sendingCustomerOtp }] =
    useRequestCheckoutOtpMutation();
  const [placeOrder, { isLoading: customerPlacing }] = usePlaceOrderMutation();
  const [previewGuestCheckout, { isLoading: guestPreviewLoading }] =
    usePreviewGuestCheckoutMutation();
  const [requestGuestCheckoutOtp, { isLoading: sendingGuestOtp }] =
    useRequestGuestCheckoutOtpMutation();
  const [placeGuestOrder, { isLoading: guestPlacing }] =
    usePlaceGuestOrderMutation();
  const [createAddress, { isLoading: creatingAddress }] =
    useCreateAddressMutation();
  const [validateCoupon] = useValidateCouponMutation();

  const addresses = addressesData?.data ?? [];
  const deliveryMethods = (deliveryData?.data ?? []).filter((d) => d.isActive);

  const [shippingAddressId, setShippingAddressId] = useState("");
  const [deliveryMethodId, setDeliveryMethodId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestShipping, setGuestShipping] =
    useState<GuestCheckoutAddressInput>(emptyShipping);

  const [addressForm, setAddressForm] = useState<CreateAddressInput>({
    fullName: "",
    line1: "",
    city: "",
    postalCode: "",
    phone: "",
    state: "Punjab",
    country: "PK",
    isDefault: true,
  });

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSession, setOtpSession] = useState<CheckoutOtpResult | null>(null);

  const previewLoading = customerPreviewLoading || guestPreviewLoading;
  const sendingOtp = sendingCustomerOtp || sendingGuestOtp;
  const placing = customerPlacing || guestPlacing;

  useEffect(() => {
    void dispatch(loadCart());
  }, [dispatch]);

  useEffect(() => {
    if (!cart) return;
    if ((cart.itemCount ?? 0) === 0 || (cart.items?.length ?? 0) === 0) {
      router.replace("/cart");
    }
  }, [cart, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!shippingAddressId && addresses.length > 0) {
      const preferred =
        addresses.find((a) => a.isDefault)?.id ?? addresses[0].id;
      setShippingAddressId(preferred);
    }
    if (addresses.length === 0 && !addressesLoading) {
      setShowAddressForm(true);
    }
  }, [addresses, shippingAddressId, addressesLoading, isAuthenticated]);

  useEffect(() => {
    if (!deliveryMethodId && deliveryMethods.length > 0) {
      setDeliveryMethodId(deliveryMethods[0].id);
    }
  }, [deliveryMethods, deliveryMethodId]);

  const canPreviewCustomer = Boolean(
    isAuthenticated && shippingAddressId && deliveryMethodId,
  );

  const canPreviewGuest = Boolean(
    !isAuthenticated &&
      getGuestToken() &&
      isValidEmail(guestEmail) &&
      isValidCheckoutPhone(guestPhone) &&
      deliveryMethodId &&
      isGuestAddressReady(guestShipping),
  );

  const canPreview = canPreviewCustomer || canPreviewGuest;

  useEffect(() => {
    if (!canPreview) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        if (isAuthenticated) {
          const result = await previewCheckout({
            shippingAddressId,
            deliveryMethodId,
            billingSameAsShipping: true,
            couponCode: couponApplied || undefined,
            notes: notes || undefined,
          }).unwrap();
          if (!cancelled) {
            setPreview(result.data);
            setPreviewError(null);
          }
          return;
        }

        const guestToken = getGuestToken();
        if (!guestToken) {
          if (!cancelled) {
            setPreview(null);
            setPreviewError("Guest cart not found. Add items again.");
          }
          return;
        }

        const result = await previewGuestCheckout({
          guestToken,
          email: guestEmail.trim(),
          phone: guestPhone.trim() || guestShipping.phone?.trim() || undefined,
          shippingAddress: {
            fullName: guestShipping.fullName.trim(),
            line1: guestShipping.line1.trim(),
            city: guestShipping.city.trim(),
            postalCode: guestShipping.postalCode.trim(),
            phone:
              guestShipping.phone?.trim() || guestPhone.trim() || undefined,
            line2: guestShipping.line2?.trim() || undefined,
            state: "Punjab",
            country: guestShipping.country?.trim() || "PK",
          },
          billingSameAsShipping: true,
          deliveryMethodId,
          couponCode: couponApplied || undefined,
          notes: notes || undefined,
        }).unwrap();

        if (!cancelled) {
          setPreview(result.data);
          setPreviewError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(
            getFetchErrorMessage(
              error as { status?: number | string; data?: unknown },
              "Could not preview totals.",
            ),
          );
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    canPreview,
    isAuthenticated,
    shippingAddressId,
    deliveryMethodId,
    couponApplied,
    notes,
    guestEmail,
    guestPhone,
    guestShipping,
    previewCheckout,
    previewGuestCheckout,
  ]);

  const selectedAddress = addresses.find((a) => a.id === shippingAddressId);
  const selectedAddressPhoneOk = Boolean(
    selectedAddress && isValidCheckoutPhone(selectedAddress.phone ?? ""),
  );

  const checkoutBlockers = useMemo(
    () =>
      getCheckoutBlockers({
        isAuthenticated,
        guestEmail,
        guestPhone,
        guestShipping,
        deliveryMethodId,
        shippingAddressId,
        hasAddresses: addresses.length > 0,
        selectedAddressPhoneOk,
        hasGuestToken: Boolean(getGuestToken()),
      }),
    [
      isAuthenticated,
      guestEmail,
      guestPhone,
      guestShipping,
      deliveryMethodId,
      shippingAddressId,
      addresses.length,
      selectedAddressPhoneOk,
    ],
  );

  const canPlaceOrder = Boolean(
    preview &&
      !placing &&
      !sendingOtp &&
      !otpOpen &&
      !previewError &&
      checkoutBlockers.length === 0,
  );

  const onCreateAddress = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidCheckoutPhone(addressForm.phone ?? "")) {
      dispatch(
        toast.error(
          "Enter a valid WhatsApp / mobile number (03XXXXXXXXX, +92…, or 92…).",
        ),
      );
      return;
    }
    try {
      const result = await createAddress({
        ...addressForm,
        phone: addressForm.phone?.trim(),
        state: "Punjab",
      }).unwrap();
      dispatch(toast.success("Address saved"));
      setShippingAddressId(result.data.id);
      setShowAddressForm(false);
      await refetchAddresses();
    } catch (error) {
      dispatch(
        toast.error(
          getFetchErrorMessage(
            error as { status?: number | string; data?: unknown },
            "Failed to save address.",
          ),
        ),
      );
    }
  };

  const onApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponApplied(null);
      return;
    }
    try {
      await validateCoupon({
        code,
        subtotal: cart?.subtotal ?? preview?.subtotal ?? 0,
      }).unwrap();
      setCouponApplied(code.toUpperCase());
      dispatch(toast.success("Coupon applied"));
    } catch (error) {
      setCouponApplied(null);
      dispatch(
        toast.error(
          getFetchErrorMessage(
            error as { status?: number | string; data?: unknown },
            "Invalid coupon.",
          ),
        ),
      );
    }
  };

  const buildCustomerCheckoutInput = (): CheckoutInput | null => {
    if (!shippingAddressId || !deliveryMethodId) return null;
    return {
      shippingAddressId,
      deliveryMethodId,
      billingSameAsShipping: true,
      couponCode: couponApplied || undefined,
      notes: notes || undefined,
    };
  };

  const buildGuestCheckoutInput = (): GuestCheckoutInput | null => {
    const guestToken = getGuestToken();
    if (!guestToken || !deliveryMethodId) return null;
    const contactPhone = guestPhone.trim() || guestShipping.phone?.trim() || "";
    const shippingPhone =
      guestShipping.phone?.trim() || guestPhone.trim() || "";
    return {
      guestToken,
      email: guestEmail.trim(),
      phone: contactPhone || undefined,
      shippingAddress: {
        fullName: guestShipping.fullName.trim(),
        line1: guestShipping.line1.trim(),
        city: guestShipping.city.trim(),
        postalCode: guestShipping.postalCode.trim(),
        phone: shippingPhone || undefined,
        line2: guestShipping.line2?.trim() || undefined,
        state: "Punjab",
        country: guestShipping.country?.trim() || "PK",
      },
      billingSameAsShipping: true,
      deliveryMethodId,
      couponCode: couponApplied || undefined,
      notes: notes || undefined,
    };
  };

  const finishPlacedOrder = (result: PlaceOrderResult, isGuest: boolean) => {
    saveLastPlacedOrder(result);
    if (isGuest) clearGuestToken();
    dispatch(clearCartState());
    dispatch(toast.success(`Order ${result.orderNumber} has been placed.`));
    setOtpOpen(false);
    setOtpSession(null);
    setOtpError(null);
    router.replace(`/orders/${result.id}?placed=1`);
  };

  const onPlaceOrder = async () => {
    if (!deliveryMethodId) return;

    try {
      if (isAuthenticated) {
        if (!shippingAddressId) return;
        if (!selectedAddressPhoneOk) {
          dispatch(
            toast.error(
              "Choose or add a shipping address with a WhatsApp / mobile number.",
            ),
          );
          return;
        }
        const body = buildCustomerCheckoutInput();
        if (!body) return;
        const result = await requestCheckoutOtp(body).unwrap();
        setOtpError(null);
        setOtpSession(result.data);
        setOtpOpen(true);
        return;
      }

      if (!isValidEmail(guestEmail)) {
        dispatch(toast.error("Enter a valid email address."));
        return;
      }

      const body = buildGuestCheckoutInput();
      const contactPhone = body?.phone ?? "";
      const shippingPhone = body?.shippingAddress.phone ?? "";

      if (
        !body ||
        !canPreviewGuest ||
        !isValidCheckoutPhone(contactPhone) ||
        !isValidCheckoutPhone(shippingPhone)
      ) {
        dispatch(
          toast.error(
            "Enter a valid WhatsApp / mobile number so we can send order updates.",
          ),
        );
        return;
      }

      const result = await requestGuestCheckoutOtp(body).unwrap();
      setOtpError(null);
      setOtpSession(result.data);
      setOtpOpen(true);
    } catch (error) {
      const message = getFetchErrorMessage(
        asFetchError(error),
        "Could not send the verification code.",
      );
      if (otpSession) {
        setOtpError(message);
        setOtpOpen(true);
        return;
      }
      dispatch(toast.error(message));
    }
  };

  const onVerifyOtp = async (otp: string) => {
    try {
      if (isAuthenticated) {
        const body = buildCustomerCheckoutInput();
        if (!body) return;
        const result = await placeOrder({ ...body, otp }).unwrap();
        finishPlacedOrder(result.data, false);
        return;
      }

      const body = buildGuestCheckoutInput();
      if (!body) return;
      const result = await placeGuestOrder({ ...body, otp }).unwrap();
      finishPlacedOrder(result.data, true);
    } catch (error) {
      setOtpError(
        getFetchErrorMessage(
          asFetchError(error),
          "Could not verify the code.",
        ),
      );
    }
  };

  const onResendOtp = async (): Promise<CheckoutOtpResult | null> => {
    try {
      if (isAuthenticated) {
        const body = buildCustomerCheckoutInput();
        if (!body) return null;
        const result = await requestCheckoutOtp(body).unwrap();
        setOtpError(null);
        setOtpSession(result.data);
        return result.data;
      }

      const body = buildGuestCheckoutInput();
      if (!body) return null;
      const result = await requestGuestCheckoutOtp(body).unwrap();
      setOtpError(null);
      setOtpSession(result.data);
      return result.data;
    } catch (error) {
      setOtpError(
        getFetchErrorMessage(
          asFetchError(error),
          "Could not resend the code.",
        ),
      );
      return null;
    }
  };

  const closeOtpModal = () => {
    if (placing) return;
    setOtpOpen(false);
    setOtpError(null);
  };

  const loadingGate = deliveryLoading || (isAuthenticated && addressesLoading);

  const summaryRows = useMemo(() => {
    if (!preview) return [];
    const rows: Array<{
      label: string;
      value: string;
      hint?: string;
      pending?: boolean;
    }> = [
      { label: "Subtotal", value: formatPrice(preview.subtotal) },
    ];
    if (preview.discountAmount > 0) {
      rows.push({
        label: `Discount${preview.couponCode ? ` (${preview.couponCode})` : ""}`,
        value: `−${formatPrice(preview.discountAmount)}`,
      });
    }
    if (preview.taxAmount > 0) {
      rows.push({
        label: `Tax (${Math.round(preview.taxRate * 100)}%)`,
        value: formatPrice(preview.taxAmount),
      });
    }
    rows.push({
      label: preview.deliveryMethodName
        ? `Shipping (${preview.deliveryMethodName})`
        : "Shipping",
      value: "To be confirmed",
      hint: checkoutShippingCopy(preview),
      pending: true,
    });
    return rows;
  }, [preview]);

  if (loadingGate) {
    return (
      <>
        <Header />
        <main className="flex-1 px-4 py-16 text-center text-sm text-slate-500">
          Loading checkout…
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-950">
                Checkout
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {isAuthenticated
                  ? "Confirm address, delivery, and place your order."
                  : "Checkout as a guest — no account required."}{" "}
                <span className="text-slate-400">
                  Required fields are marked with{" "}
                  <span className="font-semibold text-red-600">*</span>.
                </span>
              </p>
            </div>
            {!isAuthenticated && (
              <Link
                href="/login?next=/checkout"
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                Have an account? Sign in
              </Link>
            )}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {isAuthenticated && customerUser?.email ? (
                <p className="rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-brand-900">
                  We’ll send order updates to {customerUser.email}.
                </p>
              ) : null}
              {!isAuthenticated && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="font-display text-lg font-extrabold text-brand-950">
                    Contact
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    We need both of these to send your confirmation and WhatsApp
                    updates.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <FieldLabel required>Email</FieldLabel>
                      <input
                        id="checkout-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={guestEmail}
                        aria-invalid={filledButInvalid(guestEmail, isValidEmail)}
                        aria-describedby={
                          filledButInvalid(guestEmail, isValidEmail)
                            ? "checkout-email-error checkout-email-hint"
                            : "checkout-email-hint"
                        }
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-600 aria-invalid:border-red-400"
                      />
                      <span
                        id="checkout-email-hint"
                        className="mt-1 block text-xs text-slate-500"
                      >
                        {CHECKOUT_EMAIL_HELPER}
                      </span>
                      <FieldError id="checkout-email-error">
                        {filledButInvalid(guestEmail, isValidEmail)
                          ? "Enter a valid email, like name@example.com."
                          : null}
                      </FieldError>
                    </label>
                    <label className="block sm:col-span-2">
                      <FieldLabel required>{CHECKOUT_PHONE_LABEL}</FieldLabel>
                      <input
                        id="checkout-phone"
                        type="tel"
                        required
                        inputMode="tel"
                        autoComplete="tel"
                        value={guestPhone}
                        aria-invalid={filledButInvalid(
                          guestPhone,
                          isValidCheckoutPhone,
                        )}
                        aria-describedby={
                          filledButInvalid(guestPhone, isValidCheckoutPhone)
                            ? "checkout-phone-error checkout-phone-hint"
                            : "checkout-phone-hint"
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setGuestPhone(value);
                          setGuestShipping((prev) =>
                            !prev.phone || prev.phone === guestPhone
                              ? { ...prev, phone: value }
                              : prev,
                          );
                        }}
                        className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-600 aria-invalid:border-red-400"
                      />
                      <PhoneHint id="checkout-phone-hint" />
                      <FieldError id="checkout-phone-error">
                        {filledButInvalid(guestPhone, isValidCheckoutPhone)
                          ? "Use 03XXXXXXXXX, +92…, or 92…."
                          : null}
                      </FieldError>
                    </label>
                  </div>
                </section>
              )}

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-extrabold text-brand-950">
                    Shipping address
                    {!isAuthenticated ? (
                      <>
                        <span className="ml-1 text-red-600" aria-hidden="true">
                          *
                        </span>
                        <span className="sr-only"> (required)</span>
                      </>
                    ) : null}
                  </h2>
                  {isAuthenticated && addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm((v) => !v)}
                      className="text-sm font-semibold text-brand-700 hover:underline"
                    >
                      {showAddressForm ? "Cancel" : "Add new"}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  We currently deliver within Punjab only.
                </p>

                {isAuthenticated ? (
                  <>
                    {addresses.length > 0 && !showAddressForm && (
                      <ul className="mt-4 space-y-3">
                        {addresses.map((address) => (
                          <li key={address.id}>
                            <label className="flex cursor-pointer gap-3 rounded-2xl border-2 border-slate-200 p-4 has-[:checked]:border-brand-700">
                              <input
                                type="radio"
                                name="shippingAddress"
                                checked={shippingAddressId === address.id}
                                onChange={() =>
                                  setShippingAddressId(address.id)
                                }
                                className="mt-1"
                              />
                              <span className="text-sm">
                                <span className="font-bold text-brand-950">
                                  {address.fullName}
                                </span>
                                <span className="mt-1 block text-slate-500">
                                  {address.line1}
                                  {address.line2 ? `, ${address.line2}` : ""}
                                  <br />
                                  {address.city}
                                  {address.state ? `, ${address.state}` : ""}{" "}
                                  {address.postalCode}
                                  <br />
                                  {address.country}
                                  {address.phone ? ` · ${address.phone}` : ""}
                                </span>
                                {!isValidCheckoutPhone(address.phone ?? "") ? (
                                  <span className="mt-2 block text-xs font-semibold text-amber-700">
                                    Add a WhatsApp / mobile number before using
                                    this address.
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}

                    {showAddressForm && (
                      <form
                        onSubmit={onCreateAddress}
                        className="mt-4 space-y-3"
                      >
                        {(
                          [
                            ["fullName", "Full name", true],
                            ["line1", "Address line 1", true],
                            ["city", "City", true],
                            ["postalCode", "Postal code", false],
                            ["phone", CHECKOUT_PHONE_LABEL, true],
                          ] as const
                        ).map(([key, label, required]) => (
                          <label key={key} className="block">
                            <FieldLabel required={required}>{label}</FieldLabel>
                            <input
                              required={required}
                              minLength={
                                required && key !== "phone" ? 2 : undefined
                              }
                              type={key === "phone" ? "tel" : "text"}
                              inputMode={key === "phone" ? "tel" : undefined}
                              autoComplete={
                                key === "phone" ? "tel" : undefined
                              }
                              value={addressForm[key] ?? ""}
                              aria-invalid={
                                key === "phone"
                                  ? filledButInvalid(
                                      addressForm.phone ?? "",
                                      isValidCheckoutPhone,
                                    )
                                  : required
                                    ? filledButTooShort(addressForm[key] ?? "")
                                    : false
                              }
                              onChange={(e) =>
                                setAddressForm((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-600 aria-invalid:border-red-400"
                            />
                            {key === "phone" ? <PhoneHint /> : null}
                            <FieldError id={`address-${key}-error`}>
                              {key === "phone"
                                ? filledButInvalid(
                                    addressForm.phone ?? "",
                                    isValidCheckoutPhone,
                                  )
                                  ? "Use 03XXXXXXXXX, +92…, or 92…."
                                  : null
                                : required &&
                                    filledButTooShort(addressForm[key] ?? "")
                                  ? "Enter at least 2 characters."
                                  : null}
                            </FieldError>
                          </label>
                        ))}
                        <button
                          type="submit"
                          disabled={creatingAddress}
                          className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                        >
                          {creatingAddress ? "Saving…" : "Save address"}
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ["fullName", "Full name", true],
                        ["phone", CHECKOUT_PHONE_LABEL, true],
                        ["line1", "Address line 1", true],
                        ["line2", "Address line 2", false],
                        ["city", "City", true],
                        ["state", "State / province", false],
                        ["postalCode", "Postal code", false],
                        ["country", "Country (ISO)", false],
                      ] as const
                    ).map(([key, label, required]) => {
                      const isLocked = key === "state";
                      const value = isLocked
                        ? "Punjab"
                        : (guestShipping[key] ?? "");
                      const invalid =
                        key === "phone"
                          ? filledButInvalid(value, isValidCheckoutPhone)
                          : required
                            ? filledButTooShort(value)
                            : false;
                      const errorId = `guest-${key}-error`;
                      const hintId =
                        key === "phone" ? "guest-phone-hint" : undefined;
                      return (
                      <label
                        key={key}
                        className={`block ${key === "line1" || key === "line2" || key === "fullName" || key === "phone" ? "sm:col-span-2" : ""}`}
                      >
                        <FieldLabel required={required} optional={!required && !isLocked}>
                          {label}
                        </FieldLabel>
                        <input
                          required={required}
                          readOnly={isLocked}
                          minLength={required && key !== "phone" ? 2 : undefined}
                          type={key === "phone" ? "tel" : "text"}
                          inputMode={key === "phone" ? "tel" : undefined}
                          autoComplete={key === "phone" ? "tel" : undefined}
                          value={value}
                          aria-invalid={invalid}
                          aria-readonly={isLocked || undefined}
                          aria-describedby={
                            [invalid ? errorId : null, hintId]
                              .filter(Boolean)
                              .join(" ") || undefined
                          }
                          onChange={(e) => {
                            if (isLocked) return;
                            const next = e.target.value;
                            if (key === "phone") {
                              setGuestShipping((prev) => ({
                                ...prev,
                                phone: next,
                              }));
                              setGuestPhone((prev) =>
                                !prev || prev === guestShipping.phone
                                  ? next
                                  : prev,
                              );
                              return;
                            }
                            setGuestShipping((prev) => ({
                              ...prev,
                              [key]: next,
                            }));
                          }}
                          className={`mt-1 w-full rounded-xl border-2 px-3 py-2 text-sm outline-none aria-invalid:border-red-400 ${
                            isLocked
                              ? "cursor-default border-slate-200 bg-slate-100 text-slate-600"
                              : "border-slate-200 bg-slate-50 focus:border-brand-600"
                          }`}
                        />
                        {key === "phone" ? (
                          <PhoneHint id="guest-phone-hint" />
                        ) : null}
                        <FieldError id={errorId}>
                          {key === "phone" && invalid
                            ? "Use 03XXXXXXXXX, +92…, or 92…."
                            : invalid
                              ? "Enter at least 2 characters."
                              : null}
                        </FieldError>
                      </label>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-extrabold text-brand-950">
                  Delivery method
                  <span className="ml-1 text-red-600" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only"> (required)</span>
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Shipping is not free. Charges are confirmed by our team after
                  you place the order.
                </p>
                {deliveryMethods.length === 0 ? (
                  <p className="mt-4 text-sm text-amber-800">
                    No delivery methods are available right now. Please try again
                    later.
                  </p>
                ) : null}
                <ul className="mt-4 space-y-3">
                  {deliveryMethods.map((method) => {
                    const eta = formatDeliveryEta(
                      method.estimatedDaysMin,
                      method.estimatedDaysMax,
                    );
                    return (
                      <li key={method.id}>
                        <label className="flex cursor-pointer gap-3 rounded-2xl border-2 border-slate-200 p-4 has-[:checked]:border-brand-700">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            checked={deliveryMethodId === method.id}
                            onChange={() => setDeliveryMethodId(method.id)}
                            className="mt-1"
                          />
                          <span className="flex-1 text-sm">
                            <span className="flex items-center justify-between gap-2">
                              <span className="font-bold text-brand-950">
                                {method.name}
                              </span>
                              {eta ? (
                                <span className="text-xs font-semibold text-slate-500">
                                  {eta}
                                </span>
                              ) : null}
                            </span>
                            {method.description && (
                              <span className="mt-1 block text-slate-500">
                                {method.description}
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-extrabold text-brand-950">
                  Coupon & notes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Both of these are optional.
                </p>
                <div className="mt-4 flex items-end gap-2">
                  <label className="flex-1">
                    <FieldLabel>Coupon code</FieldLabel>
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="If you have one"
                      className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-600"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void onApplyCoupon()}
                    className="rounded-full border-2 border-brand-900/15 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-900 hover:text-white"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <button
                    type="button"
                    onClick={() => {
                      setCouponApplied(null);
                      setCouponCode("");
                    }}
                    className="mt-2 text-xs font-semibold text-slate-500 hover:text-red-600"
                  >
                    Remove coupon ({couponApplied})
                  </button>
                )}
                <label className="mt-4 block">
                  <FieldLabel>Order notes</FieldLabel>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-600"
                  />
                </label>
              </section>
            </div>

            <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-extrabold text-brand-950">
                Order total
              </h2>

              <ul className="mt-4 space-y-2 border-b border-slate-100 pb-4 text-sm">
                {(preview
                  ? preview.items.map((item) => ({
                      id: item.productId,
                      name: item.productName,
                      quantity: item.quantity,
                      lineTotal: item.lineTotal,
                    }))
                  : (cart?.items ?? []).map((item) => ({
                      id: item.productId,
                      name: item.product.name,
                      quantity: item.quantity,
                      lineTotal: item.lineTotal,
                    }))
                ).map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-3"
                  >
                    <span className="text-slate-600">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-semibold">
                      {formatPrice(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              {previewLoading && (
                <p className="mt-4 text-sm text-slate-400">Updating totals…</p>
              )}
              {previewError && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {previewError}
                </p>
              )}

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd className="font-semibold text-brand-950">
                    {formatPrice(preview?.subtotal ?? cart?.subtotal ?? 0)}
                  </dd>
                </div>

                {preview ? (
                  <>
                    {summaryRows
                      .filter((row) => row.label !== "Subtotal")
                      .map((row) => (
                        <div key={row.label}>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-500">{row.label}</dt>
                            <dd
                              className={`font-semibold ${
                                row.pending
                                  ? "text-slate-600"
                                  : "text-brand-950"
                              }`}
                            >
                              {row.value}
                            </dd>
                          </div>
                          {row.hint ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {row.hint}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    <div className="flex justify-between gap-3 border-t border-slate-100 pt-3">
                      <dt className="font-bold text-brand-950">Total</dt>
                      <dd className="font-display text-xl font-extrabold text-brand-950">
                        {formatPrice(preview.total)}
                      </dd>
                    </div>
                  </>
                ) : (
                  !previewError && (
                    <p className="pt-1 text-xs text-slate-400">
                      {checkoutBlockers.length > 0
                        ? `Complete ${checkoutBlockers.length === 1 ? "this required field" : "these required fields"} to see tax and totals.`
                        : "Totals will appear once the form is complete."}
                    </p>
                  )
                )}
              </dl>

              <button
                type="button"
                disabled={!canPlaceOrder}
                aria-describedby={
                  !canPlaceOrder && !otpOpen && !sendingOtp && !placing
                    ? "checkout-requirements"
                    : undefined
                }
                onClick={() => void onPlaceOrder()}
                className="mt-6 w-full rounded-full bg-gold-400 py-3 text-sm font-bold text-brand-950 shadow-lg shadow-gold-500/25 transition-all hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingOtp && !otpOpen
                  ? "Sending code…"
                  : placing
                    ? "Placing order…"
                    : "Place order"}
              </button>
              {!canPlaceOrder && !otpOpen && !sendingOtp && !placing ? (
                <div
                  id="checkout-requirements"
                  role="status"
                  aria-live="polite"
                  className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
                >
                  {previewLoading && checkoutBlockers.length === 0 ? (
                    <p>Calculating totals… Place order will enable in a moment.</p>
                  ) : checkoutBlockers.length > 0 ? (
                    <>
                      <p className="font-semibold">
                        Place order stays disabled until you add:
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {checkoutBlockers.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : previewError ? (
                    <p>{previewError}</p>
                  ) : (
                    <p>Place order enables after totals load.</p>
                  )}
                </div>
              ) : null}
              <Link
                href="/cart"
                className="mt-3 flex w-full items-center justify-center text-sm font-semibold text-slate-500 hover:text-brand-700"
              >
                Back to cart
              </Link>
            </aside>
          </div>
        </div>
      </main>
      <CheckoutOtpModal
        open={otpOpen && Boolean(otpSession)}
        phoneMasked={otpSession?.phoneMasked ?? ""}
        expiresInSeconds={otpSession?.expiresInSeconds ?? 300}
        resendAvailableInSeconds={otpSession?.resendAvailableInSeconds ?? 60}
        verifying={placing}
        error={otpError}
        onClose={closeOtpModal}
        onClearError={() => setOtpError(null)}
        onVerify={onVerifyOtp}
        onResend={onResendOtp}
      />
      <Footer />
    </>
  );
}
