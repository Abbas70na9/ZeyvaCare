import { useState, useEffect } from "react";
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredBundles,
  saveStoredBundles,
  getStoredBundlesVisible,
  saveStoredBundlesVisible,
  getStoredFaqs,
  saveStoredFaqs,
  getStoredReviews,
  saveStoredReviews,
  syncWithSupabase,
  resetAllToDefaults,
  setAdminAuthenticated,
} from "../../data/storage";
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  isSupabaseConfigured,
} from "../../lib/supabase";
import type { Product, Bundle, FAQItem, ReviewItem, ReviewMedia } from "../../types/store";
import ReviewMediaLightbox from "../ReviewMediaLightbox";

interface Props {
  onBackToStore: () => void;
  onLogout: () => void;
}

type TabType = "products" | "bundles" | "faqs" | "reviews" | "database";

export default function AdminDashboard({ onBackToStore, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("products");
  const [toast, setToast] = useState<string | null>(null);

  // States loaded from storage
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [bundles, setBundles] = useState<Bundle[]>(() => getStoredBundles());
  const [bundlesVisible, setBundlesVisible] = useState<boolean>(() => getStoredBundlesVisible());
  const [faqs, setFaqs] = useState<FAQItem[]>(() => getStoredFaqs());
  const [reviews, setReviews] = useState<ReviewItem[]>(() => getStoredReviews());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    onLogout();
  };

  const handleResetAll = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all products, bundles, FAQs, and reviews to default values? Any custom changes will be lost."
      )
    ) {
      resetAllToDefaults();
      setProducts(getStoredProducts());
      setBundles(getStoredBundles());
      setBundlesVisible(getStoredBundlesVisible());
      setFaqs(getStoredFaqs());
      setReviews(getStoredReviews());
      showToast("All store data reset to default successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f3] text-ink flex flex-col font-sans">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-ink text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 zeyva-modal-in border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium tracking-wide">{toast}</span>
        </div>
      )}

      {/* Top Navigation */}
      <header className="bg-white border-b border-cream-dark sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBackToStore}
              className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted hover:text-ink px-3 py-1.5 rounded-lg border border-cream-dark bg-cream/40 transition"
              title="View Live Store"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Live Store</span>
            </button>
            <div className="h-5 w-px bg-cream-dark" />
            <div>
              <span className="font-serif text-xl text-ink">
                Zeyva<span className="text-blush-400">.</span>
              </span>
              <span className="ml-2 text-[10px] tracking-[0.25em] uppercase font-semibold text-gold bg-lavender-100 px-2 py-0.5 rounded-full">
                Admin Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleResetAll}
              className="text-xs text-muted hover:text-red-600 px-3 py-1.5 rounded-lg transition"
              title="Reset all content to defaults"
            >
              Reset Defaults
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase bg-ink text-cream hover:bg-blush-500 px-4 py-2 rounded-full transition shadow-sm"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex space-x-1 sm:space-x-4 overflow-x-auto border-t border-cream-dark/50">
          {(() => {
            const pendingReviewsCount = reviews.filter((r) => r.status === "pending").length;
            const isCloudActive = isSupabaseConfigured();
            return [
              { id: "products", label: "Products", icon: "🛍️", count: products.length },
              { id: "bundles", label: "Bundles & Pricing", icon: "🏷️", count: bundles.length },
              { id: "faqs", label: "FAQs", icon: "❓", count: faqs.length },
              {
                id: "reviews",
                label: "Reviews",
                icon: "⭐",
                count: reviews.length,
                pendingCount: pendingReviewsCount,
              },
              {
                id: "database",
                label: "Cloud Database",
                icon: isCloudActive ? "🟢" : "☁️",
                count: isCloudActive ? "Active" : "Setup",
              },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-3 px-3 sm:px-4 text-xs font-medium tracking-wider uppercase border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                    active
                      ? "border-blush-500 text-ink font-semibold"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.pendingCount && tab.pendingCount > 0 ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold animate-pulse">
                      {tab.pendingCount} Pending
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        active ? "bg-blush-100 text-blush-500" : "bg-cream-dark text-muted"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            });
          })()}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {activeTab === "products" && (
          <ProductsManager
            products={products}
            setProducts={(p) => {
              setProducts(p);
              saveStoredProducts(p);
              showToast("Products saved & live on store! ✨");
            }}
          />
        )}

        {activeTab === "bundles" && (
          <BundlesManager
            bundles={bundles}
            unitPrice={products[0]?.price || 1999}
            bundlesVisible={bundlesVisible}
            setBundlesVisible={(v) => {
              setBundlesVisible(v);
              saveStoredBundlesVisible(v);
              showToast(
                v
                  ? "Bundle pricing boxes are now VISIBLE on store! 👁️"
                  : "Bundle pricing boxes are now HIDDEN from store! 🔒"
              );
            }}
            setBundles={(b) => {
              setBundles(b);
              saveStoredBundles(b);
              showToast("Bundles & pricing updated live! ✨");
            }}
          />
        )}

        {activeTab === "faqs" && (
          <FaqsManager
            faqs={faqs}
            setFaqs={(f) => {
              setFaqs(f);
              saveStoredFaqs(f);
              showToast("FAQs updated on store! ✨");
            }}
          />
        )}

        {activeTab === "reviews" && (
          <ReviewsManager
            reviews={reviews}
            setReviews={(r) => {
              setReviews(r);
              saveStoredReviews(r);
              showToast("Customer reviews updated! ✨");
            }}
          />
        )}

        {activeTab === "database" && (
          <DatabaseManager
            products={products}
            bundles={bundles}
            faqs={faqs}
            reviews={reviews}
            onSyncComplete={() => {
              setProducts(getStoredProducts());
              setBundles(getStoredBundles());
              setBundlesVisible(getStoredBundlesVisible());
              setFaqs(getStoredFaqs());
              setReviews(getStoredReviews());
              showToast("Synced with Cloud Database! 🚀");
            }}
          />
        )}
      </main>
    </div>
  );
}

/* =====================================================================
   1. PRODUCTS MANAGER
===================================================================== */

function ProductsManager({
  products,
  setProducts,
}: {
  products: Product[];
  setProducts: (p: Product[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(products[0]?.id || null);
  const activeProduct = products.find((p) => p.id === editingId) || products[0];

  const updateProduct = (updated: Product) => {
    const next = products.map((p) => (p.id === updated.id ? updated : p));
    setProducts(next);
  };

  const addNewProduct = () => {
    const newId = `prod-${Date.now()}`;
    const newProd: Product = {
      id: newId,
      name: "New Wellness Product",
      subtitle: "Zeyva Care · Collection",
      price: 1999,
      compareAt: 3499,
      badge: "New",
      description: "Enter product description here...",
      images: [
        { src: "/images/product-1.jpg", alt: "Product view 1" },
        { src: "/images/product-2.jpg", alt: "Product view 2" },
      ],
      features: ["Fast Heating", "USB-C Rechargeable", "Portable & Cordless"],
      isActive: false,
    };
    setProducts([...products, newProd]);
    setEditingId(newId);
  };

  const deleteProduct = (id: string) => {
    if (products.length <= 1) {
      alert("At least one product must exist in the store.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this product?")) {
      const next = products.filter((p) => p.id !== id);
      setProducts(next);
      setEditingId(next[0]?.id || null);
    }
  };

  if (!activeProduct) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-cream-dark text-center">
        <p className="text-muted">No products found.</p>
        <button
          onClick={addNewProduct}
          className="mt-4 bg-ink text-cream px-6 py-2.5 rounded-full text-xs uppercase tracking-wider"
        >
          Create First Product
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-ink">Product Catalog</h2>
          <p className="text-xs text-muted mt-1">
            Edit product title, pricing, image gallery, and key features.
          </p>
        </div>
        <button
          onClick={addNewProduct}
          className="inline-flex items-center gap-2 bg-ink text-cream hover:bg-blush-500 px-5 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition self-start sm:self-auto shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add New Product
        </button>
      </div>

      {/* Product Selector Bar if multiple products exist */}
      {products.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setEditingId(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition whitespace-nowrap flex items-center gap-2 ${
                p.id === editingId
                  ? "bg-white border-blush-500 shadow-sm text-ink font-semibold"
                  : "bg-cream/50 border-cream-dark text-muted hover:text-ink"
              }`}
            >
              <span>{p.name}</span>
              <span className="text-[10px] text-blush-500 font-bold">
                Rs. {p.price.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Edit Form */}
      <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-6 sm:p-8 space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-cream-dark">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <h3 className="font-serif text-xl text-ink">
              Editing: {activeProduct.name}
            </h3>
          </div>
          {products.length > 1 && (
            <button
              onClick={() => deleteProduct(activeProduct.id)}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition"
            >
              Delete Product
            </button>
          )}
        </div>

        {/* Basic Details */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1.5">
              Product Title
            </label>
            <input
              type="text"
              value={activeProduct.name}
              onChange={(e) => updateProduct({ ...activeProduct, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1.5">
              Collection Subtitle
            </label>
            <input
              type="text"
              value={activeProduct.subtitle}
              onChange={(e) => updateProduct({ ...activeProduct, subtitle: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1.5">
              Sale Price (PKR / Rs.)
            </label>
            <input
              type="number"
              value={activeProduct.price}
              onChange={(e) =>
                updateProduct({ ...activeProduct, price: Number(e.target.value) || 0 })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1.5">
              Compare-At / Strike-Through Price (PKR / Rs.)
            </label>
            <input
              type="number"
              value={activeProduct.compareAt}
              onChange={(e) =>
                updateProduct({ ...activeProduct, compareAt: Number(e.target.value) || 0 })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1.5">
              Product Badge (e.g. Bestseller, Limited Edition)
            </label>
            <input
              type="text"
              value={activeProduct.badge}
              onChange={(e) => updateProduct({ ...activeProduct, badge: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1.5">
              Product Description
            </label>
            <textarea
              rows={3}
              value={activeProduct.description}
              onChange={(e) => updateProduct({ ...activeProduct, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-sm resize-none"
            />
          </div>
        </div>

        {/* Gallery Management */}
        <div className="pt-6 border-t border-cream-dark space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-serif text-lg text-ink">Image Gallery</h4>
              <p className="text-xs text-muted">
                Add image URLs or upload images to preview immediately.
              </p>
            </div>
            <label className="cursor-pointer bg-blush-100 hover:bg-blush-200 text-blush-500 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Upload Local Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (loadEv) => {
                      const src = loadEv.target?.result as string;
                      if (src) {
                        const newImgs = [...activeProduct.images, { src, alt: file.name }];
                        updateProduct({ ...activeProduct, images: newImgs });
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {activeProduct.images.map((img, idx) => (
              <div
                key={idx}
                className="group relative bg-cream/50 rounded-xl border border-cream-dark overflow-hidden p-2 space-y-2"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-white">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="text"
                  value={img.src}
                  onChange={(e) => {
                    const nextImgs = [...activeProduct.images];
                    nextImgs[idx] = { ...nextImgs[idx], src: e.target.value };
                    updateProduct({ ...activeProduct, images: nextImgs });
                  }}
                  placeholder="Image URL"
                  className="w-full text-[11px] px-2 py-1 rounded border border-cream-dark bg-white truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (activeProduct.images.length <= 1) {
                      alert("Keep at least one image in gallery.");
                      return;
                    }
                    const nextImgs = activeProduct.images.filter((_, i) => i !== idx);
                    updateProduct({ ...activeProduct, images: nextImgs });
                  }}
                  className="w-full text-[11px] py-1 text-red-500 hover:bg-red-50 rounded transition font-medium"
                >
                  Remove Image
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              const url = prompt("Enter Image URL (e.g., https://... or /images/hero.jpg):");
              if (url?.trim()) {
                const nextImgs = [...activeProduct.images, { src: url.trim(), alt: "Product view" }];
                updateProduct({ ...activeProduct, images: nextImgs });
              }
            }}
            className="text-xs text-blush-500 hover:underline font-medium inline-flex items-center gap-1"
          >
            + Add Image by URL
          </button>
        </div>

        {/* Feature Bullets */}
        <div className="pt-6 border-t border-cream-dark space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-serif text-lg text-ink">Feature Bullet Points</h4>
              <p className="text-xs text-muted">
                Highlighted checklist displayed on the customer product card.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                updateProduct({
                  ...activeProduct,
                  features: [...activeProduct.features, "New feature benefit"],
                });
              }}
              className="text-xs bg-cream-dark hover:bg-blush-100 text-ink px-3 py-1.5 rounded-lg transition font-medium"
            >
              + Add Bullet
            </button>
          </div>

          <div className="space-y-2">
            {activeProduct.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blush-100 text-blush-500 flex items-center justify-center text-xs shrink-0 font-medium">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={feat}
                  onChange={(e) => {
                    const nextFeats = [...activeProduct.features];
                    nextFeats[idx] = e.target.value;
                    updateProduct({ ...activeProduct, features: nextFeats });
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextFeats = activeProduct.features.filter((_, i) => i !== idx);
                    updateProduct({ ...activeProduct, features: nextFeats });
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 flex items-center justify-center transition"
                  title="Remove bullet"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   2. BUNDLES & PRICING MANAGER
===================================================================== */

function BundlesManager({
  bundles,
  unitPrice,
  bundlesVisible,
  setBundlesVisible,
  setBundles,
}: {
  bundles: Bundle[];
  unitPrice: number;
  bundlesVisible: boolean;
  setBundlesVisible: (v: boolean) => void;
  setBundles: (b: Bundle[]) => void;
}) {
  const updateBundle = (idx: number, patch: Partial<Bundle>) => {
    const next = [...bundles];
    const updated = { ...next[idx], ...patch };
    // recalculate totalPieces
    updated.totalPieces = (updated.quantity || 1) + (updated.freeItems || 0);
    next[idx] = updated;
    setBundles(next);
  };

  const addBundle = () => {
    const nextId = bundles.length > 0 ? Math.max(...bundles.map((b) => b.id)) + 1 : 1;
    const qty = bundles.length + 1;
    const newB: Bundle = {
      id: nextId,
      quantity: qty,
      freeItems: 0,
      totalPieces: qty,
      label: `${qty} Pieces`,
      price: Math.round(unitPrice * qty * 0.9),
      savings: Math.round(unitPrice * qty * 0.1),
    };
    setBundles([...bundles, newB]);
  };

  const removeBundle = (idx: number) => {
    if (bundles.length <= 1) {
      alert("At least one bundle tier must remain.");
      return;
    }
    const next = bundles.filter((_, i) => i !== idx);
    setBundles(next);
  };

  return (
    <div className="space-y-6">
      {/* Visibility Toggle Master Card */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition shadow-sm ${
          bundlesVisible
            ? "bg-gradient-to-r from-emerald-50/70 via-white to-cream border-emerald-300"
            : "bg-gradient-to-r from-amber-50/60 via-white to-cream border-amber-300/80"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  bundlesVisible ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <h3 className="font-serif text-lg sm:text-xl text-ink font-semibold">
                Bundle Boxes Feature Display:{" "}
                <span
                  className={bundlesVisible ? "text-emerald-700" : "text-amber-700"}
                >
                  {bundlesVisible ? "VISIBLE (Active on Store)" : "HIDDEN (Disabled on Store)"}
                </span>
              </h3>
            </div>
            <p className="text-xs text-muted max-w-2xl leading-relaxed">
              Controls the visibility of the{" "}
              <strong className="text-ink">"Jitna Zyada Order, Utni Zyada Bachat! 💗"</strong>{" "}
              1-5 piece quantity discount boxes on the product page.
              {bundlesVisible
                ? " Customers can currently choose bundles on the product page."
                : " Currently hidden: product page shows standard single-item purchase."}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setBundlesVisible(!bundlesVisible)}
              className={`relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition shadow-sm focus:outline-none ${
                bundlesVisible
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-ink hover:bg-blush-500 text-white"
              }`}
            >
              {bundlesVisible ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Visible — Click to Hide
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  Hidden — Click to Show
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-ink">
            Bundle Tiers Configuration
          </h2>
          <p className="text-xs text-muted mt-1">
            Configure pricing and discount values for all bundle tiers below (saved anytime).
          </p>
        </div>
        <button
          onClick={addBundle}
          className="inline-flex items-center gap-2 bg-ink text-cream hover:bg-blush-500 px-5 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition self-start sm:self-auto shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Bundle Tier
        </button>
      </div>

      <div className="space-y-4">
        {bundles.map((b, idx) => {
          return (
            <div
              key={b.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 transition shadow-sm ${
                b.popular
                  ? "border-gold/80 bg-gradient-to-r from-white via-blush-50/30 to-white"
                  : "border-cream-dark"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cream-dark">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-blush-100 text-blush-500 flex items-center justify-center font-serif text-sm font-semibold">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-serif text-lg text-ink">{b.label}</h4>
                    <p className="text-[11px] text-muted">
                      Total Pieces: {b.totalPieces} (Paid: {b.quantity}
                      {b.freeItems > 0 ? ` + ${b.freeItems} Free` : ""})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={!!b.popular}
                      onChange={(e) => updateBundle(idx, { popular: e.target.checked })}
                      className="rounded text-gold focus:ring-gold"
                    />
                    <span className="text-gold font-semibold">★ Best Value / Glowing Highlight</span>
                  </label>
                  <button
                    onClick={() => removeBundle(idx)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 pt-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                    Label (e.g. "1 Piece")
                  </label>
                  <input
                    type="text"
                    value={b.label}
                    onChange={(e) => updateBundle(idx, { label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-cream-dark text-xs bg-cream/30 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                    Sublabel (e.g. "+ 1 FREE")
                  </label>
                  <input
                    type="text"
                    value={b.sublabel || ""}
                    placeholder="Optional"
                    onChange={(e) => updateBundle(idx, { sublabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-cream-dark text-xs bg-cream/30 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                    Paid Pieces Qty
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={b.quantity}
                    onChange={(e) =>
                      updateBundle(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-cream-dark text-xs bg-cream/30 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                    Free Items Included
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={b.freeItems || 0}
                    onChange={(e) =>
                      updateBundle(idx, { freeItems: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-cream-dark text-xs bg-cream/30 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                    Bundle Price (Rs.)
                  </label>
                  <input
                    type="number"
                    value={b.price}
                    onChange={(e) =>
                      updateBundle(idx, { price: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-cream-dark text-xs font-semibold text-ink bg-cream/30 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                    Savings Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={b.savings}
                    onChange={(e) =>
                      updateBundle(idx, { savings: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-cream-dark text-xs font-semibold text-blush-500 bg-cream/30 focus:bg-white"
                  />
                </div>
              </div>

              <div className="mt-3 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                <div>
                  Badge on Card:{" "}
                  <input
                    type="text"
                    value={b.badge || ""}
                    placeholder="None (e.g. Popular, Best Deal)"
                    onChange={(e) => updateBundle(idx, { badge: e.target.value })}
                    className="ml-2 px-2.5 py-1 rounded-lg border border-cream-dark text-xs bg-white inline-block w-40"
                  />
                </div>
                <div className="flex items-center gap-3 text-ink">
                  <span>
                    Original:{" "}
                    <span className="line-through text-muted">
                      Rs. {((b.totalPieces || b.quantity) * 3499).toLocaleString()}
                    </span>
                  </span>
                  <span className="font-semibold text-blush-500 bg-blush-100 px-2 py-0.5 rounded-full text-[10px]">
                    {Math.round(
                      ((((b.totalPieces || b.quantity) * 3499) - b.price) /
                        (((b.totalPieces || b.quantity) * 3499) || 1)) *
                        100
                    )}
                    % OFF
                  </span>
                  <span>
                    Per Piece:{" "}
                    <span className="font-semibold text-blush-500">
                      Rs. {Math.round(b.price / Math.max(1, b.totalPieces)).toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =====================================================================
   3. FAQS MANAGER
===================================================================== */

function FaqsManager({
  faqs,
  setFaqs,
}: {
  faqs: FAQItem[];
  setFaqs: (f: FAQItem[]) => void;
}) {
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");

  const addFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.trim() || !newA.trim()) return;
    const item: FAQItem = {
      id: `faq-${Date.now()}`,
      question: newQ.trim(),
      answer: newA.trim(),
    };
    setFaqs([...faqs, item]);
    setNewQ("");
    setNewA("");
  };

  const updateFaq = (id: string, patch: Partial<FAQItem>) => {
    const next = faqs.map((f) => (f.id === id ? { ...f, ...patch } : f));
    setFaqs(next);
  };

  const deleteFaq = (id: string) => {
    if (window.confirm("Delete this FAQ?")) {
      setFaqs(faqs.filter((f) => f.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl text-ink">FAQ Management</h2>
        <p className="text-xs text-muted mt-1">
          Questions and answers dynamically shown in the customer-facing accordion.
        </p>
      </div>

      {/* Add FAQ Form */}
      <form
        onSubmit={addFaq}
        className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm space-y-4"
      >
        <h3 className="font-serif text-lg text-ink">+ Add New Question</h3>
        <div className="space-y-3">
          <input
            type="text"
            required
            placeholder="Question: e.g. How long does the battery last?"
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink"
          />
          <textarea
            required
            rows={2}
            placeholder="Answer: e.g. A full charge gives you up to 6 hours..."
            value={newA}
            onChange={(e) => setNewA(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink resize-none"
          />
        </div>
        <button
          type="submit"
          className="bg-ink text-cream hover:bg-blush-500 px-5 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition"
        >
          Add to FAQs
        </button>
      </form>

      {/* Existing FAQs List */}
      <div className="space-y-3">
        {faqs.map((f, idx) => (
          <div
            key={f.id}
            className="bg-white rounded-2xl border border-cream-dark p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gold tracking-widest uppercase">
                FAQ #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => deleteFaq(f.id)}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Delete
              </button>
            </div>
            <input
              type="text"
              value={f.question}
              onChange={(e) => updateFaq(f.id, { question: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-cream-dark text-xs font-medium text-ink bg-cream/30 focus:bg-white"
            />
            <textarea
              rows={2}
              value={f.answer}
              onChange={(e) => updateFaq(f.id, { answer: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-cream-dark text-xs text-muted bg-cream/30 focus:bg-white resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* =====================================================================
   4. REVIEWS MANAGER (With Customer Submissions & Approval System)
===================================================================== */

type ReviewTab = "pending" | "approved" | "rejected" | "create";

function ReviewsManager({
  reviews,
  setReviews,
}: {
  reviews: ReviewItem[];
  setReviews: (r: ReviewItem[]) => void;
}) {
  const [filterTab, setFilterTab] = useState<ReviewTab>("pending");
  const [selectedLightboxMedia, setSelectedLightboxMedia] = useState<ReviewMedia | null>(null);

  // Manual Add Form State
  const [name, setName] = useState("");
  const [location, setLocation] = useState("Lahore, Punjab");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState("Just now");
  const [verified, setVerified] = useState(true);
  const [mediaList, setMediaList] = useState<ReviewMedia[]>([]);

  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => (r.status || "approved") === "approved").length;
  const rejectedCount = reviews.filter((r) => r.status === "rejected").length;

  const handleApprove = (id: string) => {
    const next = reviews.map((r) =>
      r.id === id ? { ...r, status: "approved" as const } : r
    );
    setReviews(next);
  };

  const handleReject = (id: string) => {
    const next = reviews.map((r) =>
      r.id === id ? { ...r, status: "rejected" as const } : r
    );
    setReviews(next);
  };

  const deleteReview = (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this review?")) {
      setReviews(reviews.filter((r) => r.id !== id));
    }
  };

  const updateReview = (id: string, patch: Partial<ReviewItem>) => {
    const next = reviews.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setReviews(next);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const reader = new FileReader();
      reader.onload = (loadEv) => {
        const src = loadEv.target?.result as string;
        if (src) {
          setMediaList((prev) => [
            ...prev,
            { type: isVideo ? "video" : "image", url: src, name: file.name },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const addManualReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    const colors = ["#e5927b", "#c9a875", "#b28bc2", "#d67560", "#6366f1"];
    const item: ReviewItem = {
      id: `rev-${Date.now()}`,
      name: name.trim(),
      location: location.trim() || "Pakistan",
      rating,
      title: title.trim() || "Customer feedback",
      body: body.trim(),
      verified,
      date: date.trim() || "Recent",
      status: "approved",
      googleReview: true,
      userType: "Verified Customer",
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      likes: 0,
      media: mediaList.length > 0 ? mediaList : undefined,
    };
    setReviews([item, ...reviews]);
    setName("");
    setTitle("");
    setBody("");
    setMediaList([]);
    setFilterTab("approved");
  };

  const displayedReviews = reviews.filter((r) => {
    if (filterTab === "pending") return r.status === "pending";
    if (filterTab === "approved") return (r.status || "approved") === "approved";
    if (filterTab === "rejected") return r.status === "rejected";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Lightbox for video / photo inspection */}
      {selectedLightboxMedia && (
        <ReviewMediaLightbox
          media={selectedLightboxMedia}
          onClose={() => setSelectedLightboxMedia(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-ink">
            Google Reviews & Customer Feedback Moderation
          </h2>
          <p className="text-xs text-muted mt-1">
            Review user submissions, customer parcel unboxing photos/videos, and approve them before they go public.
          </p>
        </div>
      </div>

      {/* Moderation Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-cream-dark pb-3">
        <button
          onClick={() => setFilterTab("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 ${
            filterTab === "pending"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-white text-muted hover:text-ink border border-cream-dark"
          }`}
        >
          <span>⏳ Pending Approval</span>
          {pendingCount > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                filterTab === "pending" ? "bg-white text-amber-600" : "bg-amber-100 text-amber-700"
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilterTab("approved")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 ${
            filterTab === "approved"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-muted hover:text-ink border border-cream-dark"
          }`}
        >
          <span>✓ Approved (Live on Store)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              filterTab === "approved" ? "bg-white text-emerald-700" : "bg-cream-dark text-muted"
            }`}
          >
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setFilterTab("rejected")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 ${
            filterTab === "rejected"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-white text-muted hover:text-ink border border-cream-dark"
          }`}
        >
          <span>✕ Rejected</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              filterTab === "rejected" ? "bg-white text-red-700" : "bg-cream-dark text-muted"
            }`}
          >
            {rejectedCount}
          </span>
        </button>

        <button
          onClick={() => setFilterTab("create")}
          className={`ml-auto px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition flex items-center gap-1.5 ${
            filterTab === "create"
              ? "bg-ink text-cream shadow-sm"
              : "bg-blush-100 text-blush-500 hover:bg-blush-200"
          }`}
        >
          <span>+ Add Review Manually</span>
        </button>
      </div>

      {/* Manual Creation Form */}
      {filterTab === "create" && (
        <form
          onSubmit={addManualReview}
          className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm space-y-4 zeyva-fade-up"
        >
          <div className="flex items-center justify-between pb-3 border-b border-cream-dark">
            <h3 className="font-serif text-lg text-ink">Publish Verified Review</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
              Auto-Approved upon publish
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                Customer Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mariam S."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                City / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Lahore, Punjab"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                Rating Stars (1-5)
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink"
              >
                <option value={5}>★★★★★ (5 Stars)</option>
                <option value={4}>★★★★☆ (4 Stars)</option>
                <option value={3}>★★★☆☆ (3 Stars)</option>
                <option value={2}>★★☆☆☆ (2 Stars)</option>
                <option value={1}>★☆☆☆☆ (1 Star)</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                Headline
              </label>
              <input
                type="text"
                placeholder="e.g. Instant cramp relief, loved the warm temperature!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                Date Display
              </label>
              <input
                type="text"
                placeholder="e.g. 2 days ago"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
              Review Body
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detailed customer review..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink resize-none"
            />
          </div>

          {/* Photo / Video upload for manual review */}
          <div className="space-y-2">
            <label className="block text-[10px] font-medium uppercase tracking-wider text-muted">
              Attach Delivery Photos / Video
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-cream-dark hover:bg-blush-100 text-ink px-4 py-2 rounded-xl text-xs font-medium transition inline-flex items-center gap-2">
                <span>📷 Upload Media Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  const url = prompt("Enter Image/Video URL:");
                  if (url?.trim()) {
                    const isVideo = url.includes(".mp4") || url.includes("video");
                    setMediaList((prev) => [
                      ...prev,
                      { type: isVideo ? "video" : "image", url: url.trim(), name: "Attached media" },
                    ]);
                  }
                }}
                className="text-xs text-blush-500 hover:underline font-medium"
              >
                + Add by URL
              </button>
            </div>

            {mediaList.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pt-2">
                {mediaList.map((m, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-cream-dark shrink-0 group bg-black"
                  >
                    {m.type === "video" ? (
                      <video src={m.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaList((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="rounded text-blush-500 focus:ring-blush-400"
              />
              <span>Google Verified Customer Badge</span>
            </label>
            <button
              type="submit"
              className="bg-ink text-cream hover:bg-blush-500 px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition"
            >
              Publish Approved Review
            </button>
          </div>
        </form>
      )}

      {/* Review List for Selected Filter Tab */}
      {filterTab !== "create" && (
        <div className="space-y-4">
          {displayedReviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-cream-dark p-12 text-center text-muted">
              <p className="text-sm">
                No reviews found in{" "}
                <strong className="text-ink font-semibold">"{filterTab}"</strong>.
              </p>
              {filterTab === "pending" && (
                <p className="text-xs mt-1 text-emerald-600">
                  🎉 All customer reviews are reviewed and up to date!
                </p>
              )}
            </div>
          ) : (
            displayedReviews.map((r) => {
              const isPending = r.status === "pending";
              const isRejected = r.status === "rejected";

              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition space-y-4 ${
                    isPending
                      ? "border-amber-300 bg-amber-50/20 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]"
                      : isRejected
                      ? "border-red-200 bg-red-50/10 opacity-75"
                      : "border-cream-dark"
                  }`}
                >
                  {/* Top Bar: Customer Info + Status + Actions */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-cream-dark">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-sm"
                        style={{ backgroundColor: r.avatarColor || "#e5927b" }}
                      >
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-base text-ink font-semibold">{r.name}</h4>
                          {r.googleReview && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-100 flex items-center gap-1">
                              <span>G</span> Google Review
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted">
                          {r.location} · {r.date}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isPending && (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          ⏳ PENDING APPROVAL
                        </span>
                      )}
                      {r.status === "approved" && (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          ✓ LIVE ON STORE
                        </span>
                      )}
                      {isRejected && (
                        <span className="bg-red-100 text-red-800 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          ✕ REJECTED
                        </span>
                      )}

                      {/* Action buttons */}
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(r.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition shadow-sm flex items-center gap-1"
                          >
                            ✓ Approve & Publish Live
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(r.id)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition shadow-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {!isPending && r.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => handleApprove(r.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1 rounded-full transition"
                        >
                          Approve
                        </button>
                      )}

                      {r.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => handleReject(r.id)}
                          className="text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1 rounded transition"
                        >
                          Unpublish
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteReview(r.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Rating Stars & Title */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                      <span className="text-xs font-bold text-ink ml-1.5">
                        {r.rating}.0 / 5.0
                      </span>
                    </div>

                    <input
                      type="text"
                      value={r.title}
                      onChange={(e) => updateReview(r.id, { title: e.target.value })}
                      className="w-full font-serif text-sm font-semibold text-ink px-2 py-1 rounded border border-transparent hover:border-cream-dark focus:border-blush-300 focus:bg-white bg-transparent"
                    />
                  </div>

                  {/* Body */}
                  <textarea
                    rows={2}
                    value={r.body}
                    onChange={(e) => updateReview(r.id, { body: e.target.value })}
                    className="w-full text-xs text-ink/80 px-2 py-1.5 rounded-lg border border-cream-dark bg-cream/20 focus:bg-white resize-none"
                  />

                  {/* Attached Customer Photos / Videos */}
                  {r.media && r.media.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                        Attached Customer Parcel Photos / Videos ({r.media.length}):
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-1">
                        {r.media.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            onClick={() => setSelectedLightboxMedia(m)}
                            className="relative w-20 h-20 rounded-xl overflow-hidden border border-cream-dark cursor-pointer group shrink-0 bg-black shadow-sm"
                            title="Click to view full size / play video"
                          >
                            {m.type === "video" ? (
                              <div className="w-full h-full relative flex items-center justify-center bg-zinc-900">
                                <video src={m.url} className="w-full h-full object-cover opacity-80" />
                                <span className="absolute inset-0 flex items-center justify-center text-white bg-black/40 text-xs">
                                  ▶
                                </span>
                              </div>
                            ) : (
                              <img
                                src={m.url}
                                alt={m.name || "Customer photo"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                            <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] px-1 py-0.2 rounded">
                              {m.type === "video" ? "Video" : "Photo"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   5. DATABASE / SUPABASE CLOUD SYNC MANAGER
===================================================================== */

function DatabaseManager({
  products,
  bundles,
  faqs,
  reviews,
  onSyncComplete,
}: {
  products: Product[];
  bundles: Bundle[];
  faqs: FAQItem[];
  reviews: ReviewItem[];
  onSyncComplete: () => void;
}) {
  const [creds, setCreds] = useState(() => getSupabaseCredentials());
  const [isConfigured, setIsConfigured] = useState(() => isSupabaseConfigured());
  const [testing, setTesting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, [creds]);

  const handleSaveCreds = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(creds.url, creds.anonKey);
    setIsConfigured(isSupabaseConfigured());
    setStatusMsg("Saved credentials successfully!");
  };

  const handleTestAndSync = async () => {
    setTesting(true);
    setStatusMsg("Connecting to Supabase and pulling cloud data...");
    const res = await syncWithSupabase();
    setTesting(false);
    setStatusMsg(res.message);
    if (res.success) {
      onSyncComplete();
    }
  };

  const handlePushAllToCloud = async () => {
    if (!isConfigured) {
      alert("Please enter and save your Supabase URL & Anon Key first.");
      return;
    }
    setPushing(true);
    setStatusMsg("Pushing all products, bundles, FAQs & reviews to Supabase...");

    try {
      saveStoredProducts(products);
      saveStoredBundles(bundles);
      saveStoredFaqs(faqs);
      saveStoredReviews(reviews);

      setTimeout(() => {
        setPushing(false);
        setStatusMsg("All data successfully pushed to Supabase Cloud Database! 🚀");
        onSyncComplete();
      }, 1200);
    } catch {
      setPushing(false);
      setStatusMsg("Failed to push data to Supabase.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl text-ink">
          Supabase Cloud Database Integration (Option B)
        </h2>
        <p className="text-xs text-muted mt-1">
          Connect your store to Supabase PostgreSQL database so reviews, photos, bundles, and product changes stay synchronized across all customer devices.
        </p>
      </div>

      {/* Connection Status Banner */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition shadow-sm ${
          isConfigured
            ? "bg-gradient-to-r from-emerald-50 via-white to-cream border-emerald-300"
            : "bg-gradient-to-r from-amber-50 via-white to-cream border-amber-300"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full ${
                isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <div>
              <h3 className="font-serif text-lg text-ink font-semibold">
                Status:{" "}
                <span className={isConfigured ? "text-emerald-700" : "text-amber-700"}>
                  {isConfigured ? "🟢 Supabase Cloud Active" : "🟡 Not Connected (Local Storage Mode)"}
                </span>
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {isConfigured
                  ? "Real-time cloud database connection is active. Reviews and store data sync with Supabase."
                  : "Currently storing data in your browser's localStorage. Enter your Supabase credentials below to connect."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={testing || !isConfigured}
              onClick={handleTestAndSync}
              className="bg-ink hover:bg-blush-500 text-cream px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition disabled:opacity-50"
            >
              {testing ? "Syncing..." : "🔄 Test & Sync Now"}
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="mt-4 pt-3 border-t border-cream-dark text-xs font-medium text-ink/80 flex items-center gap-2">
            <span>ℹ️</span>
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Credentials Form */}
      <form
        onSubmit={handleSaveCreds}
        className="bg-white rounded-2xl border border-cream-dark p-6 sm:p-8 shadow-sm space-y-5"
      >
        <h3 className="font-serif text-lg text-ink">Supabase API Credentials</h3>
        <p className="text-xs text-muted -mt-3">
          Found in your Supabase Project: <strong>Settings → API → Project URL & Project API Keys (anon public)</strong>.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-1.5">
              Project URL (e.g. https://xyzcompany.supabase.co)
            </label>
            <input
              type="url"
              required
              value={creds.url}
              onChange={(e) => setCreds({ ...creds, url: e.target.value })}
              placeholder="https://your-project-id.supabase.co"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-1.5">
              Anon / Public API Key (ey...)
            </label>
            <textarea
              rows={2}
              required
              value={creds.anonKey}
              onChange={(e) => setCreds({ ...creds, anonKey: e.target.value })}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink font-mono resize-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-cream-dark">
          <p className="text-[11px] text-muted">
            🔒 Keys are stored securely and used only for direct Supabase client connections.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-ink hover:bg-blush-500 text-cream px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition shadow-sm"
            >
              Save Credentials
            </button>
          </div>
        </div>
      </form>

      {/* Cloud Data Push Card */}
      <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm space-y-3">
        <h4 className="font-serif text-base text-ink font-semibold">
          📤 Push Store Data to Supabase
        </h4>
        <p className="text-xs text-muted leading-relaxed">
          If you just created your Supabase tables and want to upload your current products, bundles, FAQs, and reviews to your Supabase tables in one click:
        </p>
        <button
          type="button"
          disabled={pushing || !isConfigured}
          onClick={handlePushAllToCloud}
          className="bg-cream-dark hover:bg-blush-100 text-ink px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition disabled:opacity-40"
        >
          {pushing ? "Pushing Data..." : "Upload Current Store Data to Supabase"}
        </button>
      </div>
    </div>
  );
}
