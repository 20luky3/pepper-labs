/** Provides the modal form and API integration for editing a variant. */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, LoaderCircle, X } from "lucide-react";
import { updateVariant } from "@/lib/api";
import type { UpdateVariantInput, Variant } from "@/types";

type ErrorResponse = { error: string };

interface EditVariantDialogProps {
  variant: Variant;
  onClose: () => void;
  onUpdated: (variant: Variant) => void;
}

/** Converts user-facing values and submits a variant update  */
export default function EditVariantDialog({
  variant,
  onClose,
  onUpdated,
}: EditVariantDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = `edit-variant-${variant.id}-title`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  /** Validates display values, converts dollars to cents, and saves the variant */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const formData = new FormData(event.currentTarget);
    const priceText = String(formData.get("price") ?? "");
    const inventoryText = String(formData.get("inventory_count") ?? "");
    const price = Number(priceText);
    const priceCents = Math.round(price * 100);
    const inventoryCount = Number(inventoryText);

    if (
      priceText === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isSafeInteger(priceCents) ||
      Math.abs(price * 100 - priceCents) > 1e-6
    ) {
      setError("Price must be non-negative with at most two decimal places.");
      return;
    }

    if (
      inventoryText === "" ||
      !Number.isSafeInteger(inventoryCount) ||
      inventoryCount < 0
    ) {
      setError("Inventory count must be a non-negative integer.");
      return;
    }

    const update: UpdateVariantInput = {
      price_cents: priceCents,
      inventory_count: inventoryCount,
    };

    setError(null);
    setSubmitting(true);

    try {
      const response = await updateVariant(variant.id, update);
      if (!response.ok) {
        const result = (await response.json()) as ErrorResponse;
        setError(result.error || `Unable to update variant (${response.status}).`);
        return;
      }

      const updated = (await response.json()) as Variant;
      onUpdated(updated);
    } catch {
      setError("Unable to update the variant. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-busy={submitting}
      onCancel={(event) => {
        if (submitting) event.preventDefault();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (!submitting && event.target === event.currentTarget) onClose();
      }}
      className="w-[calc(100%-2rem)] max-w-lg rounded-lg border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/40"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              Edit variant
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update the price and available inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close edit variant dialog"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <fieldset disabled={submitting} className="border-0 p-0 disabled:opacity-70">
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div className="grid gap-3 rounded-md border bg-muted/40 p-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  SKU
                </p>
                <p className="mt-1 font-mono text-sm text-foreground">
                  {variant.sku}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Variant name
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {variant.name}
                </p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor={`variant-${variant.id}-price`}
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Price <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <input
                  id={`variant-${variant.id}-price`}
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  required
                  autoFocus
                  defaultValue={(variant.price_cents / 100).toFixed(2)}
                  className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-7 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={`variant-${variant.id}-inventory`}
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Inventory count <span className="text-destructive">*</span>
              </label>
              <input
                id={`variant-${variant.id}-inventory`}
                name="inventory_count"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                required
                defaultValue={variant.inventory_count}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col-reverse gap-2 border-t bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2E3330] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a3f3c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
