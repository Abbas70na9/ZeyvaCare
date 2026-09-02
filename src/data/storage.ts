import { DEFAULT_PRODUCTS, DEFAULT_BUNDLES, DEFAULT_FAQS, DEFAULT_REVIEWS } from "./initialData";
import type { Product, Bundle, FAQItem, ReviewItem } from "../types/store";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

const KEYS = {
  PRODUCTS: "zeyva_products",
  BUNDLES: "zeyva_bundles",
  BUNDLES_VISIBLE: "zeyva_bundles_visible",
  FAQS: "zeyva_faqs",
  REVIEWS: "zeyva_reviews",
  MY_SUBMITTED_REVIEWS: "zeyva_my_submitted_reviews",
  AUTH: "zeyva_admin_session",
};

const DATA_CHANGED_EVENT = "zeyva_data_changed";

function getJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function setJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyDataChanged();
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

export function notifyDataChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  }
}

export function subscribeDataChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(DATA_CHANGED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(DATA_CHANGED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/* =========================================================================
   PRODUCTS
========================================================================= */
export function getStoredProducts(): Product[] {
  const items = getJson<Product[]>(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  if (!Array.isArray(items) || items.length === 0) return DEFAULT_PRODUCTS;
  return items.map((p) => {
    if (p.name === "Period Pain Relief Heating Pad") {
      return { ...p, name: "Zeyva Care Period Pain Relief Heating Pad" };
    }
    return p;
  });
}

export function saveStoredProducts(products: Product[]): void {
  setJson(KEYS.PRODUCTS, products);

  // Sync with Supabase in background
  const supabase = getSupabase();
  if (supabase) {
    (async () => {
      try {
        for (const prod of products) {
          await supabase.from("products").upsert({
            id: prod.id,
            name: prod.name,
            subtitle: prod.subtitle,
            price: prod.price,
            compare_at: prod.compareAt,
            badge: prod.badge,
            description: prod.description,
            images: prod.images,
            features: prod.features,
            is_active: prod.isActive ?? true,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn("Supabase products sync error:", e);
      }
    })();
  }
}

/* =========================================================================
   BUNDLES & VISIBILITY
========================================================================= */
export function getStoredBundles(): Bundle[] {
  const items = getJson<Bundle[]>(KEYS.BUNDLES, DEFAULT_BUNDLES);
  return Array.isArray(items) && items.length > 0 ? items : DEFAULT_BUNDLES;
}

export function saveStoredBundles(bundles: Bundle[]): void {
  setJson(KEYS.BUNDLES, bundles);

  const supabase = getSupabase();
  if (supabase) {
    (async () => {
      try {
        for (const b of bundles) {
          await supabase.from("bundles").upsert({
            id: b.id,
            quantity: b.quantity,
            free_items: b.freeItems || 0,
            total_pieces: b.totalPieces || b.quantity,
            label: b.label,
            sublabel: b.sublabel || null,
            price: b.price,
            savings: b.savings || 0,
            badge: b.badge || null,
            popular: b.popular || false,
          });
        }
      } catch (e) {
        console.warn("Supabase bundles sync error:", e);
      }
    })();
  }
}

export function getStoredBundlesVisible(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(KEYS.BUNDLES_VISIBLE);
    if (raw === null) {
      return false; // Default hidden
    }
    return raw === "true";
  } catch {
    return false;
  }
}

export function saveStoredBundlesVisible(visible: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.BUNDLES_VISIBLE, visible ? "true" : "false");
    notifyDataChanged();

    const supabase = getSupabase();
    if (supabase) {
      (async () => {
        try {
          await supabase.from("store_settings").upsert({
            key: "bundles_visible",
            value: { visible },
            updated_at: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Supabase settings sync error:", err);
        }
      })();
    }
  } catch (err) {
    console.error("Error saving bundles visibility:", err);
  }
}

/* =========================================================================
   FAQS
========================================================================= */
export function getStoredFaqs(): FAQItem[] {
  const items = getJson<FAQItem[]>(KEYS.FAQS, DEFAULT_FAQS);
  return Array.isArray(items) && items.length > 0 ? items : DEFAULT_FAQS;
}

export function saveStoredFaqs(faqs: FAQItem[]): void {
  setJson(KEYS.FAQS, faqs);

  const supabase = getSupabase();
  if (supabase) {
    (async () => {
      try {
        for (let i = 0; i < faqs.length; i++) {
          const f = faqs[i];
          await supabase.from("faqs").upsert({
            id: f.id,
            question: f.question,
            answer: f.answer,
            order_index: i,
          });
        }
      } catch (e) {
        console.warn("Supabase faqs sync error:", e);
      }
    })();
  }
}

/* =========================================================================
   REVIEWS & MODERATION
========================================================================= */
export function getStoredReviews(): ReviewItem[] {
  const items = getJson<ReviewItem[]>(KEYS.REVIEWS, DEFAULT_REVIEWS);
  if (!Array.isArray(items) || items.length === 0) return DEFAULT_REVIEWS;
  return items.map((r) => ({
    ...r,
    status: r.status || "approved",
  }));
}

export function saveStoredReviews(reviews: ReviewItem[]): void {
  setJson(KEYS.REVIEWS, reviews);
}

export function getMySubmittedReviewIds(): string[] {
  return getJson<string[]>(KEYS.MY_SUBMITTED_REVIEWS, []);
}

export function submitUserReview(
  data: Omit<ReviewItem, "id" | "status" | "date">
): ReviewItem {
  const newId = `rev-user-${Date.now()}`;
  const colors = ["#e5927b", "#c9a875", "#b28bc2", "#d67560", "#6366f1", "#10b981"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newReview: ReviewItem = {
    ...data,
    id: newId,
    date: "Just now",
    status: "approved", // Goes live immediately for all users; admin can still reject/delete later
    googleReview: true,
    userType: "Verified Customer",
    avatarColor: randomColor,
    likes: 0,
  };

  const existing = getStoredReviews();
  saveStoredReviews([newReview, ...existing]);

  const myIds = getMySubmittedReviewIds();
  if (!myIds.includes(newId)) {
    setJson(KEYS.MY_SUBMITTED_REVIEWS, [newId, ...myIds]);
  }

  // Insert to Supabase cloud table if connected
  const supabase = getSupabase();
  if (supabase) {
    (async () => {
      try {
        await supabase.from("reviews").insert({
          id: newReview.id,
          name: newReview.name,
          location: newReview.location || "Pakistan",
          rating: newReview.rating,
          title: newReview.title || null,
          body: newReview.body,
          verified: newReview.verified ?? true,
          date: "Just now",
          status: "approved",
          google_review: true,
          user_type: newReview.userType || "Verified Customer",
          avatar_color: newReview.avatarColor,
          likes: 0,
          media: newReview.media || [],
        });
      } catch (err) {
        console.warn("Supabase review submit sync error:", err);
      }
    })();
  }

  return newReview;
}

export function approveReview(id: string): void {
  const reviews = getStoredReviews();
  const next = reviews.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r));
  saveStoredReviews(next);

  const supabase = getSupabase();
  if (supabase) {
    (async () => {
      try {
        await supabase.from("reviews").update({ status: "approved" }).eq("id", id);
      } catch (err) {
        console.warn("Supabase approve sync error:", err);
      }
    })();
  }
}

export function rejectReview(id: string): void {
  const reviews = getStoredReviews();
  const next = reviews.map((r) => (r.id === id ? { ...r, status: "rejected" as const } : r));
  saveStoredReviews(next);

  const supabase = getSupabase();
  if (supabase) {
    (async () => {
      try {
        await supabase.from("reviews").update({ status: "rejected" }).eq("id", id);
      } catch (err) {
        console.warn("Supabase reject sync error:", err);
      }
    })();
  }
}

export function deleteReview(id: string): void {
  const reviews = getStoredReviews();
  const next = reviews.filter((r) => r.id !== id);
  saveStoredReviews(next);

  const supabase = getSupabase();
  if (supabase) {
    (async () => {
      try {
        await supabase.from("reviews").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete sync error:", err);
      }
    })();
  }
}

export function toggleLikeReview(id: string): void {
  const reviews = getStoredReviews();
  let updatedLikes = 0;
  const next = reviews.map((r) => {
    if (r.id === id) {
      updatedLikes = (r.likes || 0) + 1;
      return { ...r, likes: updatedLikes };
    }
    return r;
  });
  saveStoredReviews(next);

  const supabase = getSupabase();
  if (supabase && updatedLikes > 0) {
    (async () => {
      try {
        await supabase.from("reviews").update({ likes: updatedLikes }).eq("id", id);
      } catch (err) {
        console.warn("Supabase like sync error:", err);
      }
    })();
  }
}

/* =========================================================================
   CLOUD SYNC INITIALIZATION (Pulls latest data from Supabase)
========================================================================= */
export async function syncWithSupabase(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false, message: "Supabase credentials not set yet. Running on local storage." };
  }

  try {
    // 1. Sync reviews
    const { data: revData, error: revError } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (!revError && Array.isArray(revData) && revData.length > 0) {
      const mappedReviews: ReviewItem[] = revData.map((r) => ({
        id: r.id,
        name: r.name,
        location: r.location || "Pakistan",
        rating: r.rating,
        title: r.title || "",
        body: r.body,
        verified: r.verified ?? true,
        date: r.date || "Recent",
        status: r.status || "approved",
        googleReview: r.google_review ?? true,
        userType: r.user_type || "Verified Customer",
        avatarColor: r.avatar_color || "#e5927b",
        likes: r.likes || 0,
        media: r.media || [],
      }));
      setJson(KEYS.REVIEWS, mappedReviews);
    }

    // 2. Sync settings (bundles visibility)
    const { data: setData } = await supabase
      .from("store_settings")
      .select("*")
      .eq("key", "bundles_visible")
      .single();

    if (setData && setData.value && typeof setData.value.visible === "boolean") {
      setJson(KEYS.BUNDLES_VISIBLE, setData.value.visible ? "true" : "false");
    }

    // 3. Sync FAQs
    const { data: faqData } = await supabase
      .from("faqs")
      .select("*")
      .order("order_index", { ascending: true });

    if (Array.isArray(faqData) && faqData.length > 0) {
      const mappedFaqs: FAQItem[] = faqData.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
      }));
      setJson(KEYS.FAQS, mappedFaqs);
    }

    notifyDataChanged();
    return { success: true, message: "Connected & synced with Supabase Database! ✨" };
  } catch (err) {
    console.warn("Error syncing with Supabase:", err);
    return { success: false, message: "Could not reach Supabase. Working with local cache." };
  }
}

/* =========================================================================
   ADMIN AUTH & DEFAULTS
========================================================================= */
export function resetAllToDefaults(): void {
  setJson(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  setJson(KEYS.BUNDLES, DEFAULT_BUNDLES);
  setJson(KEYS.FAQS, DEFAULT_FAQS);
  setJson(KEYS.REVIEWS, DEFAULT_REVIEWS);
  setJson(KEYS.MY_SUBMITTED_REVIEWS, []);
  saveStoredBundlesVisible(false);
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEYS.AUTH) === "true";
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(val: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (val) {
      localStorage.setItem(KEYS.AUTH, "true");
    } else {
      localStorage.removeItem(KEYS.AUTH);
    }
  } catch (err) {
    console.error("Error setting auth state:", err);
  }
}
