import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, X } from "lucide-react";
import { fetchProducts, fetchCategories } from "@/lib/api";
import type { Product, Category } from "@/types";
import ProductCard from "@/components/ProductCard";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasFilters = Boolean(search || categoryId);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchProducts({ search: search || undefined, category_id: categoryId })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load products. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    // Ignore this request if the filters change or the page unmounts.
    return () => {
      cancelled = true;
    };
  }, [search, categoryId]);

  const clearFilters = () => {
    setSearch("");
    setCategoryId(undefined);
  };

  return (
    <div>
      {/* Filters bar — matches CatalogFilters layout */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <label className="mb-1.5 block text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="sm:min-w-[180px]">
          <label className="mb-1.5 block text-sm font-medium">Category</label>
          <select
            value={categoryId ?? ""}
            onChange={(e) =>
              setCategoryId(e.target.value ? Number(e.target.value) : undefined)
            }
            className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear + New Product */}
        <div className="flex items-end gap-2">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}

          <Link
            to="/products/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#2E3330] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a3f3c]"
          >
            <Plus className="h-4 w-4" />
            New Product
          </Link>
        </div>
      </div>

      {/* Only report a result count after a successful request */}
      {!loading && !error && (
        <p className="mb-4 text-sm text-muted-foreground">
          {products.length} result{products.length !== 1 ? "s" : ""} found
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm">Loading products…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-8 text-center">
          <p className="font-medium text-destructive">Could not load products</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No products found</p>
          <p className="mt-1 text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
