export function OrderTrackingDetails({
  courier,
  trackingNumber,
  trackingUrl,
  className,
}: {
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  className?: string;
}) {
  if (!courier && !trackingNumber && !trackingUrl) return null;

  return (
    <div
      className={`rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm${className ? ` ${className}` : ""}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Shipping
      </p>
      <dl className="mt-2 space-y-1.5">
        {courier ? (
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Courier</dt>
            <dd className="font-medium text-brand-950">{courier}</dd>
          </div>
        ) : null}
        {trackingNumber ? (
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Tracking number</dt>
            <dd className="font-mono text-brand-950">{trackingNumber}</dd>
          </div>
        ) : null}
        {trackingUrl ? (
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Tracking</dt>
            <dd>
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 hover:underline"
              >
                Track shipment
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
