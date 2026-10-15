import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { createProduct, fetchCategories } from "@/lib/api";
import type { Category, CreateProductInput } from "@/types";

const inputClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

type ParseResult =
  | { ok: true; value: CreateProductInput }
  | { ok: false; error: string };

type ErrorResponse = { error: string };
type CreatedProductResponse = { id: number };

/** Converts form values into the representation validated by POST /products. */
function parseProductForm(
  form: HTMLFormElement,
  variantCount: number,
): ParseResult {
  const formData = new FormData(form);
  const name = String(formData.get("name") ?? "").trim();

  if (name === "") {
    return { ok: false, error: "Product name is required" };
  }

  if (variantCount === 0) {
    return { ok: false, error: "At least one product variant is required" };
  }

  const variants: CreateProductInput["variants"] = [];
  const seenSkus = new Set<string>();

  for (let index = 0; index < variantCount; index += 1) {
    const position = index + 1;
    const sku = String(formData.get(`variants[${index}].sku`) ?? "").trim();
    const variantName = String(
      formData.get(`variants[${index}].name`) ?? "",
    ).trim();
    const priceText = String(
      formData.get(`variants[${index}].price`) ?? "",
    );
    const inventoryText = String(
      formData.get(`variants[${index}].inventory_count`) ?? "",
    );

    if (sku === "") {
      return { ok: false, error: `Variant ${position}: SKU is required` };
    }

    if (seenSkus.has(sku)) {
      return { ok: false, error: `Duplicate SKU in request: ${sku}` };
    }
    seenSkus.add(sku);

    if (variantName === "") {
      return { ok: false, error: `Variant ${position}: name is required` };
    }

    // The form accepts dollars, while the API validates integer cents.
    const price = Number(priceText);
    const priceCents = Math.round(price * 100);
    if (
      priceText === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isSafeInteger(priceCents) ||
      Math.abs(price * 100 - priceCents) > 1e-6
    ) {
      return {
        ok: false,
        error: `Variant ${position}: price_cents must be a non-negative integer`,
      };
    }

    const inventoryCount = Number(inventoryText);
    if (
      inventoryText === "" ||
      !Number.isSafeInteger(inventoryCount) ||
      inventoryCount < 0
    ) {
      return {
        ok: false,
        error: `Variant ${position}: inventory_count must be a non-negative integer`,
      };
    }

    variants.push({
      sku,
      name: variantName,
      price_cents: priceCents,
      inventory_count: inventoryCount,
    });
  }

  const status = formData.get("status");
  if (status !== "active" && status !== "draft") {
    return { ok: false, error: "Select a valid product status" };
  }

  const categoryValue = String(formData.get("category_id") ?? "");
  const categoryId = categoryValue ? Number(categoryValue) : null;
  if (categoryId !== null && !Number.isSafeInteger(categoryId)) {
    return { ok: false, error: "Select a valid category" };
  }

  const description = String(formData.get("description") ?? "").trim();
  return {
    ok: true,
    value: {
      name,
      description: description || null,
      category_id: categoryId,
      status,
      variants,
    },
  };
}

export default function CreateProductPage() {
  const navigate = useNavigate();
  const nextVariantId = useRef(1);
  const [variantIds, setVariantIds] = useState([0]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    /** Loads categories independently so category failure does not block the form */
    const loadCategories = async () => {
      try {
        const response = await fetchCategories();
        if (!response.ok) throw new Error("Category request failed");

        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid category response");

        if (!cancelled) setCategories(data as Category[]);
      } catch {
        if (!cancelled) setCategoriesError(true);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    };

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Adds an empty variant section */
  const addVariant = () => {
    const id = nextVariantId.current;
    nextVariantId.current += 1;
    setVariantIds((current) => [...current, id]);
  };

  /** Removes a variant */
  const removeVariant = (id: number) => {
    setVariantIds((current) =>
      current.length > 1
        ? current.filter((variantId) => variantId !== id)
        : current,
    );
  };

  /** Submits valid form data and redirects to the created product */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitError(null);
    const parsed = parseProductForm(event.currentTarget, variantIds.length);
    if (!parsed.ok) {
      setSubmitError(parsed.error);
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await createProduct(parsed.value);
      if (!response.ok) {
        const result = (await response.json()) as ErrorResponse;
        setSubmitError(result.error || `Unable to create product (${response.status}).`);
        return;
      }

      const created = (await response.json()) as CreatedProductResponse;
      navigate(`/products/${created.id}`);
    } catch {
      setSubmitError(
        "Unable to create the product. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Create New Product
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the product details and at least one purchasable variant.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit} aria-busy={submitting}>
        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <section className="rounded-lg border bg-card p-5 shadow-card sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">
              Product details
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="product-name" className={labelClassName}>
                Product name <span className="text-destructive">*</span>
              </label>
              <input
                id="product-name"
                name="name"
                type="text"
                required
                placeholder="e.g. Angus Beef Patties"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="product-category" className={labelClassName}>
                Category
              </label>
              <select
                id="product-category"
                name="category_id"
                defaultValue=""
                disabled={categoriesLoading}
                className={inputClassName}
              >
                <option value="">
                  {categoriesLoading ? "Loading categories…" : "No category"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categoriesError && (
                <p className="mt-1.5 text-xs text-destructive">
                  Categories could not be loaded. You can still create an
                  uncategorized product.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="product-status" className={labelClassName}>
                Status
              </label>
              <select
                id="product-status"
                name="status"
                defaultValue="active"
                className={inputClassName}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="product-description" className={labelClassName}>
                Description
                <span className="ml-1 font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <textarea
                id="product-description"
                name="description"
                rows={4}
                placeholder="Describe any details about the product..."
                className="flex min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 shadow-card sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Variants</h2>
            </div>
            <button
              type="button"
              onClick={addVariant}
              disabled={submitting}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add variant
            </button>
          </div>

          <div className="space-y-4">
            {variantIds.map((id, index) => (
              <fieldset
                key={id}
                disabled={submitting}
                className="rounded-lg border bg-muted/20 p-4 disabled:opacity-70 sm:p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <legend className="font-medium text-foreground">
                    Variant {index + 1}
                  </legend>
                  <button
                    type="button"
                    onClick={() => removeVariant(id)}
                    disabled={variantIds.length === 1 || submitting}
                    aria-label={`Remove variant ${index + 1}`}
                    title={
                      variantIds.length === 1
                        ? "A product must have at least one variant"
                        : "Remove variant"
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label htmlFor={`variant-${id}-sku`} className={labelClassName}>
                      SKU <span className="text-destructive">*</span>
                    </label>
                    <input
                      id={`variant-${id}-sku`}
                      name={`variants[${index}].sku`}
                      type="text"
                      required
                      placeholder="e.g. ABP-4OZ"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label htmlFor={`variant-${id}-name`} className={labelClassName}>
                      Variant name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id={`variant-${id}-name`}
                      name={`variants[${index}].name`}
                      type="text"
                      required
                      placeholder="e.g. 4 oz case"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label htmlFor={`variant-${id}-price`} className={labelClassName}>
                      Price <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <input
                        id={`variant-${id}-price`}
                        name={`variants[${index}].price`}
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        className={`${inputClassName} pl-7`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`variant-${id}-inventory`}
                      className={labelClassName}
                    >
                      Inventory <span className="text-destructive">*</span>
                    </label>
                    <input
                      id={`variant-${id}-inventory`}
                      name={`variants[${index}].inventory_count`}
                      type="number"
                      required
                      min="0"
                      step="1"
                      inputMode="numeric"
                      placeholder="0"
                      className={inputClassName}
                    />
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
          <Link
            to="/products"
            aria-disabled={submitting}
            className={`inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-muted ${submitting ? "pointer-events-none opacity-50" : ""}`}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2E3330] px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a3f3c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {submitting ? "Creating product…" : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
}
