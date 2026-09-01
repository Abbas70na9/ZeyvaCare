import { useEffect, useRef, useState } from "react";
import type { Bundle } from "../types/store";

type Props = {
  open: boolean;
  onClose: () => void;
  unitPrice: number;
  selectedBundle?: Bundle;
  productName?: string;
  productImage?: string;
};

const WHATSAPP_NUMBER = "923498015702";

export default function OrderModal({
  open,
  onClose,
  unitPrice,
  selectedBundle,
  productName = "Zeyva Care Period Pain Relief Heating Pad",
  productImage = "/images/product-1.jpg",
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [quantity, setQuantity] = useState(selectedBundle?.totalPieces ?? 1);
  const [coupon, setCoupon] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);

  // Pre-fill quantity from selected bundle whenever the modal is (re)opened
  // or the bundle selection changes.
  useEffect(() => {
    if (open && selectedBundle) {
      setQuantity(selectedBundle.totalPieces);
    }
  }, [open, selectedBundle]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  // If the current quantity matches the selected bundle's total pieces, we use
  // the bundle's discounted price. Otherwise fall back to unit pricing.
  const bundleActive =
    !!selectedBundle && selectedBundle.totalPieces === quantity;
  const subtotal = bundleActive ? selectedBundle!.price : unitPrice * quantity;
  const savings = bundleActive ? selectedBundle!.savings : 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please enter your full name";
    if (!phone.trim()) e.phone = "Phone number is required";
    else if (!/^[0-9+\-\s()]{10,15}$/.test(phone.trim()))
      e.phone = "Please enter a valid phone number";
    if (!address.trim()) e.address = "Please enter your full address";
    if (quantity < 1) e.quantity = "Quantity must be at least 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const bundleLine = bundleActive
      ? `*Bundle Selected:* ${selectedBundle!.label}${
          selectedBundle!.sublabel ? " " + selectedBundle!.sublabel : ""
        }`
      : "";
    const savingsLine =
      bundleActive && savings > 0
        ? `*You Save:* Rs. ${savings.toLocaleString()} 🎉`
        : "";

    const lines = [
      "*🌸 New Order — Zeyva Care 🌸*",
      "",
      `*Product:* ${productName}`,
      bundleLine,
      `*Unit Price:* Rs. ${unitPrice.toLocaleString()}`,
      `*Quantity:* ${quantity}${
        bundleActive && selectedBundle!.freeItems > 0
          ? ` (incl. ${selectedBundle!.freeItems} FREE)`
          : ""
      }`,
      `*Total Price:* Rs. ${subtotal.toLocaleString()}`,
      savingsLine,
      "*Delivery:* FREE (Lahore)",
      "",
      "*Customer Details*",
      `• Name: ${name.trim()}`,
      `• Phone: ${phone.trim()}`,
      `• Address: ${address.trim()}`,
      landmark.trim() ? `• Landmark: ${landmark.trim()}` : "",
      coupon.trim() ? `• Coupon Code: ${coupon.trim()}` : "",
      "",
      "Please confirm my order. Thank you!",
    ].filter(Boolean);

    const message = lines.join("\n");
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    // Show confirmation, then redirect
    setConfirmed(true);
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      // Reset after a beat
      setTimeout(() => {
        setSubmitting(false);
        setConfirmed(false);
        onClose();
      }, 400);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 zeyva-overlay-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(42, 35, 32, 0.55)" }}
        onClick={() => !submitting && onClose()}
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden zeyva-modal-in max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-cream-dark flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-gold font-medium">
              Zeyva Care
            </p>
            <h2
              id="order-modal-title"
              className="font-serif text-2xl sm:text-3xl text-ink mt-1"
            >
              Complete Your Order
            </h2>
            <p className="text-sm text-muted mt-1">
              Cash on Delivery • Free shipping in Lahore
            </p>
          </div>
          <button
            onClick={() => !submitting && onClose()}
            aria-label="Close"
            disabled={submitting}
            className="shrink-0 w-9 h-9 rounded-full hover:bg-cream-dark flex items-center justify-center text-ink/60 hover:text-ink transition disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Confirmation state */}
        {confirmed ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-blush-100 flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d67560" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl text-ink">Order Received 🌸</h3>
            <p className="text-muted mt-2 max-w-xs">
              Redirecting you to WhatsApp to confirm your order with our team...
            </p>
            <div className="mt-6 flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blush-300 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blush-300 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blush-300 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-4"
          >
            {/* Product summary */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-cream border border-cream-dark">
              <img
                src={productImage}
                alt=""
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">
                  {productName}
                </p>
                <p className="text-xs text-muted">
                  {bundleActive
                    ? `${selectedBundle!.label}${
                        selectedBundle!.sublabel ? " " + selectedBundle!.sublabel : ""
                      }`
                    : "Blush Pink • Cordless"}
                </p>
              </div>
              <p className="text-sm font-semibold text-ink whitespace-nowrap">
                Rs. {subtotal.toLocaleString()}
              </p>
            </div>

            <Field
              label="Full Name"
              required
              error={errors.name}
              value={name}
              onChange={setName}
              placeholder="e.g. Ayesha Khan"
            />

            <Field
              label="Phone Number"
              required
              error={errors.phone}
              value={phone}
              onChange={setPhone}
              placeholder="03XX XXXXXXX"
              type="tel"
            />

            <div>
              <label className="block text-xs font-medium tracking-wide text-ink/70 uppercase mb-1.5">
                Full Address <span className="text-blush-500">*</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="House #, Street, Area, City"
                className={`w-full px-4 py-3 rounded-xl border bg-cream/40 focus:bg-white focus:outline-none focus:border-blush-300 focus:ring-2 focus:ring-blush-100 transition text-sm resize-none ${
                  errors.address ? "border-red-300" : "border-cream-dark"
                }`}
              />
              {errors.address && (
                <p className="text-xs text-red-500 mt-1">{errors.address}</p>
              )}
            </div>

            <Field
              label="Nearby Landmark"
              value={landmark}
              onChange={setLandmark}
              placeholder="e.g. Near McDonald's, DHA Phase 5"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium tracking-wide text-ink/70 uppercase mb-1.5">
                  Quantity
                </label>
                <div className="flex items-center border border-cream-dark rounded-xl overflow-hidden bg-cream/40">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-12 text-lg text-ink/70 hover:bg-cream-dark transition"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="flex-1 text-center bg-transparent focus:outline-none text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-11 h-12 text-lg text-ink/70 hover:bg-cream-dark transition"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <Field
                label="Coupon Code"
                value={coupon}
                onChange={setCoupon}
                placeholder="Optional"
              />
            </div>

            {/* Order total */}
            <div className="pt-4 mt-2 border-t border-cream-dark space-y-1.5">
              <div className="flex justify-between text-sm text-muted">
                <span>
                  Subtotal
                  {bundleActive && selectedBundle!.freeItems > 0 && (
                    <span className="text-blush-500"> · incl. {selectedBundle!.freeItems} FREE</span>
                  )}
                </span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              {bundleActive && savings > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gold font-medium">Bundle Discount</span>
                  <span className="text-gold font-medium">
                    − Rs. {savings.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm text-muted">
                <span>Delivery (Lahore)</span>
                <span className="text-blush-500 font-medium">FREE</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-serif text-lg text-ink">Total</span>
                <span className="font-serif text-2xl text-ink">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-ink text-cream py-4 rounded-full font-medium tracking-wide hover:bg-blush-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>Processing...</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Confirm Order via WhatsApp
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-muted">
              🔒 Your details are only shared with our order team on WhatsApp.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium tracking-wide text-ink/70 uppercase mb-1.5">
        {label} {required && <span className="text-blush-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border bg-cream/40 focus:bg-white focus:outline-none focus:border-blush-300 focus:ring-2 focus:ring-blush-100 transition text-sm ${
          error ? "border-red-300" : "border-cream-dark"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
