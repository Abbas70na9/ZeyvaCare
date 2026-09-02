import { useEffect, useMemo, useState, useCallback } from "react";
import OrderModal from "./components/OrderModal";
import AdminPage from "./components/admin/AdminPage";
import WriteReviewModal from "./components/WriteReviewModal";
import ReviewMediaLightbox from "./components/ReviewMediaLightbox";
import {
  getStoredProducts,
  getStoredBundles,
  getStoredBundlesVisible,
  getStoredFaqs,
  getStoredReviews,
  getMySubmittedReviewIds,
  toggleLikeReview,
  subscribeDataChanges,
  syncWithSupabase,
} from "./data/storage";
import type { Product, Bundle, FAQItem, ReviewItem, ReviewMedia } from "./types/store";

export type { Bundle, Product, FAQItem, ReviewItem };

function checkIsAdminRoute(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  return (
    hash === "#admin" ||
    hash.startsWith("#/admin") ||
    path === "/admin" ||
    path.startsWith("/admin/") ||
    search.includes("admin")
  );
}

function checkIsAllReviewsRoute(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  return (
    hash === "#all-reviews" ||
    hash.startsWith("#/reviews") ||
    path === "/reviews" ||
    path.startsWith("/reviews/")
  );
}

export default function App() {
  const [isAdminView, setIsAdminView] = useState<boolean>(() => checkIsAdminRoute());
  const [isAllReviewsView, setIsAllReviewsView] = useState<boolean>(() => checkIsAllReviewsRoute());
  const [modalOpen, setModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Dynamic store data from localStorage
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [bundles, setBundles] = useState<Bundle[]>(() => getStoredBundles());
  const [bundlesVisible, setBundlesVisible] = useState<boolean>(() => getStoredBundlesVisible());
  const [faqs, setFaqs] = useState<FAQItem[]>(() => getStoredFaqs());
  const [reviews, setReviews] = useState<ReviewItem[]>(() => getStoredReviews());

  // Active product displayed on landing page
  const activeProduct = useMemo(() => {
    return products.find((p) => p.isActive) || products[0];
  }, [products]);

  const [selectedBundle, setSelectedBundle] = useState<Bundle>(() => bundles[0]);

  // Keep selectedBundle updated if bundles array changes in admin panel
  useEffect(() => {
    setSelectedBundle((current) => {
      const match = bundles.find((b) => b.id === current?.id);
      return match || bundles[0];
    });
  }, [bundles]);

  // Reset active image index if current product changes
  useEffect(() => {
    setActiveImage(0);
  }, [activeProduct.id]);

  // Subscribe to storage changes & initial cloud sync
  useEffect(() => {
    // Initial Supabase cloud fetch in background
    syncWithSupabase();

    const unsubscribe = subscribeDataChanges(() => {
      setProducts(getStoredProducts());
      setBundles(getStoredBundles());
      setBundlesVisible(getStoredBundlesVisible());
      setFaqs(getStoredFaqs());
      setReviews(getStoredReviews());
    });
    return unsubscribe;
  }, []);

  // Sync route changes (hashchange/popstate)
  useEffect(() => {
    const onLocationChange = () => {
      setIsAdminView(checkIsAdminRoute());
      setIsAllReviewsView(checkIsAllReviewsRoute());
    };
    window.addEventListener("hashchange", onLocationChange);
    window.addEventListener("popstate", onLocationChange);
    return () => {
      window.removeEventListener("hashchange", onLocationChange);
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  const openAdmin = useCallback(() => {
    window.location.hash = "admin";
    setIsAdminView(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const closeAdmin = useCallback(() => {
    if (window.location.hash.includes("admin")) {
      window.location.hash = "";
      if (window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
    setIsAdminView(false);
  }, []);

  const openAllReviews = useCallback(() => {
    window.location.hash = "all-reviews";
    setIsAllReviewsView(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const closeAllReviews = useCallback(() => {
    if (window.location.hash.includes("all-reviews") || window.location.hash.includes("reviews")) {
      window.location.hash = "";
      if (window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
    setIsAllReviewsView(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openModal = () => setModalOpen(true);

  // If in Admin view, render Admin portal
  if (isAdminView) {
    return <AdminPage onBackToStore={closeAdmin} />;
  }

  // If in the dedicated "All Reviews" view, render every review on its own page
  if (isAllReviewsView) {
    return (
      <div className="min-h-screen bg-cream text-ink overflow-x-hidden">
        <AnnouncementBar />
        <Header onOrderClick={openModal} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <ReviewsSection reviews={reviews} onBack={closeAllReviews} />
        <Footer onAdminClick={openAdmin} />
        <OrderModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          unitPrice={activeProduct.price}
          productName={activeProduct.name}
          productImage={
            (activeProduct.images && activeProduct.images[0]?.src) || "/images/product-1.jpg"
          }
          selectedBundle={bundlesVisible ? selectedBundle : undefined}
        />
      </div>
    );
  }

  const images =
    activeProduct.images && activeProduct.images.length > 0
      ? activeProduct.images
      : [{ src: "/images/product-1.jpg", alt: activeProduct.name }];

  const currentImage = images[activeImage] || images[0];

  return (
    <div className="min-h-screen bg-cream text-ink overflow-x-hidden">
      <AnnouncementBar />
      <Header onOrderClick={openModal} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Hero onOrderClick={openModal} product={activeProduct} reviewCount={reviews.length} />
      <ProductSection
        product={activeProduct}
        bundles={bundles}
        bundlesVisible={bundlesVisible}
        activeImage={activeImage}
        setActiveImage={setActiveImage}
        onZoom={() => setZoomOpen(true)}
        onOrderClick={openModal}
        selectedBundle={selectedBundle}
        setSelectedBundle={setSelectedBundle}
      />
      <FeatureIcons />
      <BenefitsSection />
      <HowItWorks />
      <ReviewsSection reviews={reviews} limit={6} onViewMore={openAllReviews} />
      <FAQSection faqs={faqs} />
      <TrustBanner onOrderClick={openModal} product={activeProduct} />
      <Footer onAdminClick={openAdmin} />

      <SocialProofWidget />
      <StickyMobileBar
        onOrderClick={openModal}
        selectedBundle={selectedBundle}
        bundlesVisible={bundlesVisible}
        productPrice={activeProduct.price}
      />

      <OrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        unitPrice={activeProduct.price}
        productName={activeProduct.name}
        productImage={currentImage.src}
        selectedBundle={bundlesVisible ? selectedBundle : undefined}
      />

      {zoomOpen && (
        <div
          className="fixed inset-0 z-[90] bg-ink/80 flex items-center justify-center p-4 zeyva-overlay-in"
          onClick={() => setZoomOpen(false)}
        >
          <button
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/90 text-ink flex items-center justify-center hover:bg-white transition"
            aria-label="Close zoom"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────  ANNOUNCEMENT BAR  ───────────────── */

function AnnouncementBar() {
  const items = [
    "✨ FREE Delivery in Lahore",
    "🌸 Cash on Delivery Available",
    "💗 Loved by 4,000+ Women",
    "🚚 Nationwide Shipping",
    "⚡ Same-Day Dispatch",
  ];
  const track = [...items, ...items];
  return (
    <div className="bg-ink text-cream text-xs py-2.5 overflow-hidden relative">
      <div className="flex whitespace-nowrap zeyva-marquee">
        {track.map((t, i) => (
          <span key={i} className="mx-8 tracking-[0.15em] uppercase text-[10.5px] opacity-90">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────  HEADER  ───────────────── */

function Header({
  onOrderClick,
  menuOpen,
  setMenuOpen,
}: {
  onOrderClick: () => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-cream/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.04)]"
          : "bg-cream/70 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Left: mobile menu / nav */}
        <div className="flex-1 flex items-center gap-6">
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center -ml-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <nav className="hidden lg:flex items-center gap-8 text-sm text-ink/80">
            <a href="#product" className="hover:text-blush-500 transition">Shop</a>
            <a href="#benefits" className="hover:text-blush-500 transition">Benefits</a>
            <a href="#reviews" className="hover:text-blush-500 transition">Reviews</a>
            <a href="#faq" className="hover:text-blush-500 transition">FAQ</a>
          </nav>
        </div>

        {/* Center: Logo */}
        <a href="#top" className="flex flex-col items-center leading-none">
          <span className="font-serif text-2xl sm:text-3xl tracking-tight text-ink">
            Zeyva<span className="text-blush-400">.</span>
          </span>
          <span className="text-[9px] tracking-[0.35em] uppercase text-muted mt-0.5">
            Care
          </span>
        </a>

        {/* Right: icons */}
        <div className="flex-1 flex items-center justify-end gap-4">
          <button aria-label="Search" className="hidden sm:block text-ink/70 hover:text-ink transition">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
          <button aria-label="Account" className="hidden sm:block text-ink/70 hover:text-ink transition">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
            </svg>
          </button>
          <button
            onClick={onOrderClick}
            aria-label="Cart"
            className="relative text-ink/80 hover:text-ink transition"
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span className="absolute -top-1.5 -right-2 bg-blush-500 text-white text-[10px] font-medium w-4 h-4 rounded-full flex items-center justify-center">
              0
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-cream-dark bg-cream">
          <nav className="px-6 py-4 flex flex-col gap-4 text-sm">
            <a href="#product" onClick={() => setMenuOpen(false)} className="py-1">Shop</a>
            <a href="#benefits" onClick={() => setMenuOpen(false)} className="py-1">Benefits</a>
            <a href="#reviews" onClick={() => setMenuOpen(false)} className="py-1">Reviews</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="py-1">FAQ</a>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ─────────────────  HERO  ───────────────── */

function Hero({
  onOrderClick,
  reviewCount,
}: {
  onOrderClick: () => void;
  product: Product;
  reviewCount: number;
}) {
  return (
    <section id="top" className="relative">
      <div className="relative h-[92vh] min-h-[560px] sm:h-[88vh] w-full overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt="Woman relaxing with Zeyva Care heating pad"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay gradient for contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-ink/10" />

        <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-center">
          <div className="max-w-xl text-cream zeyva-fade-up">
            <p className="text-[11px] sm:text-xs tracking-[0.35em] uppercase text-blush-200 mb-5 flex items-center gap-3">
              <span className="w-8 h-px bg-blush-200" />
              New Wellness Essential
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl leading-[1.02] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)]">
              Zeyva Care
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-white/90 max-w-md leading-relaxed font-light drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
              Soothing warmth, effortless relief. The comfort your body deserves,
              every day of the month.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                onClick={onOrderClick}
                className="group inline-flex items-center gap-3 bg-cream text-ink px-8 sm:px-10 py-4 rounded-full text-sm font-medium tracking-widest uppercase hover:bg-blush-100 transition-all shadow-lg hover:shadow-xl"
              >
                Shop Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
              <a
                href="#product"
                className="inline-flex items-center gap-2 text-cream text-sm tracking-widest uppercase border-b border-cream/50 pb-1 hover:border-cream transition"
              >
                Learn More
              </a>
            </div>

            <div className="mt-10 flex items-center gap-5 text-white/85 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <Stars value={5} size={14} color="#f5d1c6" />
                <span className="ml-1">4.9 · {reviewCount > 0 ? `${reviewCount * 300 + 47}` : "1,247"} reviews</span>
              </div>
              <span className="w-px h-4 bg-white/30" />
              <span>🚚 Free Lahore Delivery</span>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-cream/80 text-[10px] tracking-[0.4em] uppercase flex flex-col items-center gap-2">
          Scroll
          <span className="w-px h-8 bg-cream/50 animate-pulse" />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────  PRODUCT SECTION  ───────────────── */

function ProductSection({
  product,
  bundles,
  bundlesVisible,
  activeImage,
  setActiveImage,
  onZoom,
  onOrderClick,
  selectedBundle,
  setSelectedBundle,
}: {
  product: Product;
  bundles: Bundle[];
  bundlesVisible: boolean;
  activeImage: number;
  setActiveImage: (i: number) => void;
  onZoom: () => void;
  onOrderClick: () => void;
  selectedBundle: Bundle;
  setSelectedBundle: (b: Bundle) => void;
}) {
  const images = product.images && product.images.length > 0 ? product.images : [{ src: "/images/product-1.jpg", alt: product.name }];
  const currentImg = images[activeImage] || images[0];

  const savingsPercent =
    product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : 43;

  return (
    <section id="product" className="py-16 sm:py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-5 sm:px-10">
        <p className="text-xs text-muted tracking-wider mb-6 sm:mb-10 hidden sm:block">
          Home <span className="mx-2">/</span> Wellness <span className="mx-2">/</span>{" "}
          <span className="text-ink">{product.name}</span>
        </p>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div>
            <div
              className="relative aspect-square bg-blush-50 rounded-2xl overflow-hidden group cursor-zoom-in"
              onClick={onZoom}
            >
              <img
                src={currentImg.src}
                alt={currentImg.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <button
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur text-ink flex items-center justify-center hover:bg-white transition shadow-sm"
                aria-label="Zoom image"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3M8 11h6M11 8v6" />
                </svg>
              </button>
              {product.badge && (
                <div className="absolute top-4 left-4 bg-blush-500 text-white text-[10px] px-3 py-1.5 rounded-full tracking-wider uppercase font-medium">
                  {product.badge}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                      activeImage === i ? "border-blush-400" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:pt-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium mb-3">
              {product.subtitle || "Zeyva Care · Wellness Collection"}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight text-ink">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-3">
              <Stars value={5} size={16} />
              <span className="text-sm text-muted">
                <span className="text-ink font-medium">4.9</span> · 1,247 verified reviews
              </span>
            </div>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-3 flex-wrap">
              <span className="font-serif text-4xl text-ink">Rs. {product.price.toLocaleString()}</span>
              {product.compareAt > product.price && (
                <span className="text-lg text-muted line-through">
                  Rs. {product.compareAt.toLocaleString()}
                </span>
              )}
              <span className="bg-blush-100 text-blush-500 text-xs px-2.5 py-1 rounded-full font-medium">
                Save {savingsPercent}%
              </span>
            </div>

            {/* Free delivery badge */}
            <div className="mt-4 inline-flex items-center gap-2 bg-lavender-100 text-ink text-sm px-4 py-2 rounded-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="6" width="15" height="12" rx="2" />
                <path d="M16 10h4l3 3v5h-7" />
                <circle cx="6" cy="20" r="2" /><circle cx="18" cy="20" r="2" />
              </svg>
              <span className="font-medium">Free Delivery in Lahore</span>
              <span className="text-muted">· 24–48 hrs</span>
            </div>

            {/* Bundle Pricing Selector (visible only when enabled in Admin Panel) */}
            {bundlesVisible && (
              <BundleSelector
                bundles={bundles}
                selected={selectedBundle}
                onSelect={setSelectedBundle}
                compareAt={product.compareAt || 3499}
              />
            )}

            {/* Short description */}
            <p className="mt-6 text-muted leading-relaxed">
              {product.description}
            </p>

            {/* Feature bullets */}
            {product.features && product.features.length > 0 && (
              <ul className="mt-6 space-y-3">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-ink/85">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-blush-100 flex items-center justify-center shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#d67560" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {/* CTA */}
            <div className="mt-8 space-y-3">
              {bundlesVisible && (
                <div className="flex items-baseline justify-between px-1">
                  <span className="text-xs tracking-widest uppercase text-muted">
                    Your Total
                    {selectedBundle.totalPieces > selectedBundle.quantity && (
                      <span className="ml-2 text-blush-500 normal-case tracking-normal">
                        ({selectedBundle.totalPieces} pieces incl. {selectedBundle.freeItems || 1} FREE)
                      </span>
                    )}
                  </span>
                  <span className="font-serif text-2xl text-ink">
                    Rs. {selectedBundle.price.toLocaleString()}
                  </span>
                </div>
              )}
              <button
                onClick={onOrderClick}
                className="w-full bg-ink text-cream py-4 rounded-full font-medium tracking-widest uppercase text-sm hover:bg-blush-500 transition-colors"
              >
                Order Now — Rs.{" "}
                {bundlesVisible
                  ? selectedBundle.price.toLocaleString()
                  : product.price.toLocaleString()}
              </button>
              <button
                onClick={onOrderClick}
                className="w-full border border-ink/20 text-ink py-4 rounded-full font-medium tracking-widest uppercase text-sm hover:bg-white transition"
              >
                Buy It Now
              </button>
            </div>

            {/* Trust items */}
            <div className="mt-8 pt-6 border-t border-cream-dark grid grid-cols-3 gap-3 text-center">
              {[
                { icon: "🚚", label: "Free Lahore Delivery" },
                { icon: "💵", label: "Cash on Delivery" },
                { icon: "✨", label: "100% Quality Checked" },
              ].map((t) => (
                <div key={t.label} className="text-xs text-muted flex flex-col items-center gap-1.5">
                  <span className="text-xl">{t.icon}</span>
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────  FEATURE ICONS STRIP  ───────────────── */

function FeatureIcons() {
  const features = [
    {
      title: "Fast Heat",
      desc: "Warms up in 30 seconds",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2s5 5 5 10a5 5 0 01-10 0c0-5 5-10 5-10z" />
        </svg>
      ),
    },
    {
      title: "Rechargeable",
      desc: "USB-C, 6-hour battery",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="18" height="10" rx="2" />
          <path d="M22 11v2" /><path d="M6 10v4M10 10v4" />
        </svg>
      ),
    },
    {
      title: "Portable",
      desc: "Cordless & travel-friendly",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="7" width="16" height="13" rx="2" />
          <path d="M9 7V5a3 3 0 016 0v2" />
        </svg>
      ),
    },
    {
      title: "Ultra-Slim",
      desc: "Fits under any outfit",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5" />
        </svg>
      ),
    },
    {
      title: "Safe Auto-Off",
      desc: "Smart shut-off system",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-white py-14 sm:py-20 border-y border-cream-dark">
      <div className="max-w-7xl mx-auto px-5 sm:px-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium mb-3">
            Why She Loves It
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl">
            Designed for real comfort, made to feel effortless.
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-4">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center px-3">
              <div className="w-14 h-14 rounded-full bg-blush-50 text-blush-500 flex items-center justify-center mb-3">
                <span className="w-6 h-6 block">{f.icon}</span>
              </div>
              <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────  BENEFITS SECTION  ───────────────── */

function BenefitsSection() {
  return (
    <section id="benefits" className="py-20 sm:py-28 bg-gradient-to-b from-cream to-blush-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-10">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-xl">
              <img src="/images/product-3.jpg" alt="Zeyva Care in use" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block absolute -bottom-6 -right-6 lg:-right-10 bg-white rounded-2xl p-5 shadow-xl max-w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <Stars value={5} size={14} />
              </div>
              <p className="text-sm text-ink italic leading-relaxed">
                "Genuinely the only thing that helps my cramps now."
              </p>
              <p className="text-xs text-muted mt-2">— Hina S., Lahore</p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium mb-3">
              The Zeyva Difference
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] text-ink">
              Say goodbye to painkillers.
              <br />
              <span className="italic text-blush-500">Say hello to warmth.</span>
            </h2>
            <p className="mt-6 text-muted leading-relaxed">
              Menstrual pain shouldn't put your life on hold. Our clinically-inspired heating
              therapy targets cramps with gentle, penetrating warmth — the same natural
              relief experts recommend, now cordless and portable.
            </p>

            <div className="mt-10 space-y-6">
              {[
                {
                  title: "Instant Cramp Relief",
                  body: "Deep, steady heat relaxes uterine muscles in minutes — a drug-free alternative to painkillers.",
                },
                {
                  title: "Wear It Anywhere",
                  body: "Ultra-slim and cordless so you can work, sleep, travel, or relax — pain-free.",
                },
                {
                  title: "Beautiful by Design",
                  body: "A calm blush pink finish that feels like a wellness ritual, not a medical device.",
                },
              ].map((b, i) => (
                <div key={b.title} className="flex gap-5">
                  <div className="w-10 h-10 rounded-full bg-white border border-blush-100 text-blush-500 flex items-center justify-center shrink-0 font-serif">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-ink">{b.title}</h3>
                    <p className="text-sm text-muted mt-1 leading-relaxed">{b.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────  HOW IT WORKS  ───────────────── */

function HowItWorks() {
  const steps = [
    { n: "01", t: "Charge It", d: "Plug in via USB-C. A full charge takes just 90 minutes." },
    { n: "02", t: "Place It", d: "Position on your lower belly, back, or wherever needs care." },
    { n: "03", t: "Feel Relief", d: "Choose your heat level. Warm relief begins in 30 seconds." },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-10">
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium mb-3">
            How It Works
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl">Simple, gentle, effective.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((s) => (
            <div key={s.n} className="text-center relative">
              <span className="font-serif text-6xl text-blush-200 block leading-none">{s.n}</span>
              <h3 className="font-serif text-2xl mt-3">{s.t}</h3>
              <p className="text-sm text-muted mt-2 max-w-xs mx-auto leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────  REVIEWS (Google Reviews Style & Customer Submission)  ───────────────── */

function ReviewsSection({
  reviews,
  limit,
  onViewMore,
  onBack,
}: {
  reviews: ReviewItem[];
  /** Max reviews to render (landing page teaser). Omit to show all (full reviews page). */
  limit?: number;
  /** Shown as a "View More Reviews" button when there are more reviews than `limit`. */
  onViewMore?: () => void;
  /** When provided, renders a "Back to Store" link at the top (full reviews page). */
  onBack?: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<ReviewMedia | null>(null);
  const [filter, setFilter] = useState<"all" | "media" | "5star">("all");
  const [mySubmittedIds, setMySubmittedIds] = useState<string[]>(() => getMySubmittedReviewIds());

  const refreshMyIds = () => {
    setMySubmittedIds(getMySubmittedReviewIds());
  };

  // Filter reviews: show approved reviews to all, plus pending reviews ONLY if submitted by this user on this device
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const isApproved = (r.status || "approved") === "approved";
      const isMyPending = r.status === "pending" && mySubmittedIds.includes(r.id);
      if (!isApproved && !isMyPending) return false;

      if (filter === "media") return r.media && r.media.length > 0;
      if (filter === "5star") return r.rating === 5;
      return true;
    });
  }, [reviews, filter, mySubmittedIds]);

  // Landing page only teases a handful of reviews; the full list lives on the "all reviews" page
  const visibleReviews = useMemo(() => {
    return typeof limit === "number" ? filteredReviews.slice(0, limit) : filteredReviews;
  }, [filteredReviews, limit]);

  const hasMoreReviews = typeof limit === "number" && filteredReviews.length > limit;

  const approvedReviews = useMemo(() => {
    return reviews.filter((r) => (r.status || "approved") === "approved");
  }, [reviews]);

  const avgRating = useMemo(() => {
    if (!approvedReviews || approvedReviews.length === 0) return "4.9";
    const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / approvedReviews.length).toFixed(1);
  }, [approvedReviews]);

  const mediaCount = useMemo(() => {
    return approvedReviews.filter((r) => r.media && r.media.length > 0).length;
  }, [approvedReviews]);

  const onLike = (id: string) => {
    toggleLikeReview(id);
  };

  return (
    <section id="reviews" className="py-20 sm:py-28 bg-gradient-to-b from-cream via-white to-cream">
      {/* Lightbox for customer delivery photos & videos */}
      {selectedMedia && (
        <ReviewMediaLightbox media={selectedMedia} onClose={() => setSelectedMedia(null)} />
      )}

      {/* Customer Write Review Modal */}
      <WriteReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={refreshMyIds}
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition"
          >
            <span aria-hidden="true">←</span> Back to Store
          </button>
        )}

        {/* Google Reviews Official Style Header Card */}
        <div className="bg-white rounded-3xl border border-cream-dark p-6 sm:p-10 shadow-sm mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3">
              {/* Google Verified Banner */}
              <div className="inline-flex items-center gap-2 bg-[#f8f9fa] border border-[#e8eaed] px-3.5 py-1.5 rounded-full shadow-xs">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs font-semibold text-[#3c4043] tracking-wide">
                  Google Customer Reviews · Verified Store
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
                Authentic Customer Feedback
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
                Real experiences and delivery parcel photos shared by verified Pakistani buyers.
              </p>
            </div>

            {/* Big Aggregate Rating + Write Review CTA */}
            <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end gap-5">
              <div className="flex items-center gap-4 bg-cream/40 p-4 rounded-2xl border border-cream-dark">
                <span className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-none">
                  {avgRating}
                </span>
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-lg">
                    {"★".repeat(5)}
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Based on {approvedReviews.length * 300 + 47}+ Google & store ratings
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 bg-ink hover:bg-blush-500 text-cream px-6 py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Write a Review
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="mt-8 pt-6 border-t border-cream-dark flex flex-wrap gap-2.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition ${
                filter === "all"
                  ? "bg-ink text-white font-semibold shadow-xs"
                  : "bg-cream/60 text-muted hover:text-ink hover:bg-cream"
              }`}
            >
              All Reviews ({approvedReviews.length})
            </button>
            <button
              onClick={() => setFilter("media")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                filter === "media"
                  ? "bg-ink text-white font-semibold shadow-xs"
                  : "bg-cream/60 text-muted hover:text-ink hover:bg-cream"
              }`}
            >
              <span>📸 Photos & Videos</span>
              <span className="text-[11px] opacity-80">({mediaCount})</span>
            </button>
            <button
              onClick={() => setFilter("5star")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition ${
                filter === "5star"
                  ? "bg-ink text-white font-semibold shadow-xs"
                  : "bg-cream/60 text-muted hover:text-ink hover:bg-cream"
              }`}
            >
              ★ 5-Star Reviews
            </button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {visibleReviews.map((r) => {
            const isMyPending = r.status === "pending" && mySubmittedIds.includes(r.id);

            return (
              <article
                key={r.id}
                className={`relative bg-white p-6 sm:p-7 rounded-3xl border transition-all duration-300 hover:shadow-md flex flex-col justify-between ${
                  isMyPending
                    ? "border-amber-300 bg-amber-50/20 ring-2 ring-amber-300/40"
                    : "border-cream-dark"
                }`}
              >
                {/* Pending Notice for the submitter */}
                {isMyPending && (
                  <div className="mb-4 -mt-2 -mx-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3.5 py-2 rounded-2xl text-[11px] font-medium flex items-center justify-between gap-2 shadow-xs">
                    <span className="flex items-center gap-1.5">
                      <span>⏳</span>
                      <span>Your review is submitted & awaiting admin approval</span>
                    </span>
                    <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      Visible only to you
                    </span>
                  </div>
                )}

                <div>
                  {/* Google Review Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-full text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0"
                        style={{ backgroundColor: r.avatarColor || "#e5927b" }}
                      >
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base text-ink">
                            {r.name}
                          </h3>
                          {r.verified && (
                            <span
                              className="text-emerald-600 inline-flex items-center gap-0.5 text-[11px] font-medium"
                              title="Verified Buyer"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="shrink-0"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                              <span className="text-[10px] uppercase tracking-wider">Verified</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted">
                          {r.userType ? `${r.userType} · ` : ""}
                          {r.location}
                        </p>
                      </div>
                    </div>

                    {/* Google G Icon or Date */}
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span className="text-[10px] text-muted">{r.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stars in Google Gold */}
                  <div className="flex items-center gap-1 text-amber-400 text-sm mb-2.5">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </div>

                  {/* Headline & Body */}
                  {r.title && (
                    <h4 className="font-serif text-base text-ink font-semibold mb-1.5 leading-snug">
                      {r.title}
                    </h4>
                  )}
                  <p className="text-xs sm:text-[13px] text-ink/80 leading-relaxed mb-4">
                    {r.body}
                  </p>

                  {/* Attached Customer Delivery Photos / Videos */}
                  {r.media && r.media.length > 0 && (
                    <div className="mb-4 pt-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1">
                        <span>📸</span> Customer Delivery Photos & Video ({r.media.length})
                      </p>
                      <div className="flex gap-2.5 overflow-x-auto pb-1">
                        {r.media.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            onClick={() => setSelectedMedia(m)}
                            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-cream-dark cursor-zoom-in group shrink-0 bg-black shadow-xs"
                            title="Click to view full size"
                          >
                            {m.type === "video" ? (
                              <div className="w-full h-full relative flex items-center justify-center bg-zinc-900">
                                <video
                                  src={m.url}
                                  className="w-full h-full object-cover opacity-80"
                                  muted
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-white bg-black/40 text-sm">
                                  ▶
                                </span>
                                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                                  Video
                                </span>
                              </div>
                            ) : (
                              <>
                                <img
                                  src={m.url}
                                  alt={m.name || "Customer photo"}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                                  🔍 Zoom
                                </span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Helpful Button */}
                <div className="pt-3 border-t border-cream-dark/60 flex items-center justify-between text-xs text-muted">
                  <span className="text-[11px]">Posted on Google Verified Reviews</span>
                  <button
                    type="button"
                    onClick={() => onLike(r.id)}
                    className="inline-flex items-center gap-1.5 hover:text-ink text-muted bg-cream/40 hover:bg-cream-dark px-3 py-1 rounded-full transition"
                  >
                    <span>👍</span>
                    <span className="text-[11px]">Helpful ({r.likes || 0})</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* View More Reviews Button */}
        {hasMoreReviews && onViewMore && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onViewMore}
              className="inline-flex items-center justify-center gap-2 bg-white border border-cream-dark hover:border-ink text-ink px-7 py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-all shadow-xs hover:shadow-md"
            >
              View More Reviews ({filteredReviews.length - visibleReviews.length} more)
            </button>
          </div>
        )}

        {/* Bottom CTA Banner */}
        <div className="mt-14 text-center bg-blush-50 border border-blush-100 rounded-3xl p-8 sm:p-10 space-y-3">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold">
            Have you received your Zeyva Care?
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl text-ink">
            Join thousands of comfortable, pain-free women.
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
            Share your unboxing photo or review to help other women find the relief they need.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="bg-ink hover:bg-blush-500 text-cream px-8 py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors shadow-md"
            >
              Leave a Review Now 🌸
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────  FAQ  ───────────────── */

function FAQSection({ faqs }: { faqs: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-5 sm:px-10">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium mb-3">
            Frequently Asked
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl">Questions, answered.</h2>
        </div>
        <div className="divide-y divide-cream-dark border-y border-cream-dark">
          {faqs.map((f, i) => (
            <div key={f.id}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full py-5 flex items-center justify-between gap-4 text-left"
              >
                <span className="font-medium text-ink pr-4">{f.question}</span>
                <span
                  className={`w-8 h-8 rounded-full border border-cream-dark flex items-center justify-center shrink-0 transition-transform ${
                    open === i ? "rotate-45 bg-blush-100 border-blush-100" : ""
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              {open === i && (
                <p className="pb-6 pr-12 text-sm text-muted leading-relaxed -mt-1">{f.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────  TRUST BANNER  ───────────────── */

function TrustBanner({ onOrderClick, product }: { onOrderClick: () => void; product: Product }) {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-blush-100">
      <div className="max-w-4xl mx-auto px-5 sm:px-10 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-blush-500 font-medium mb-3">
          Limited-Time Offer
        </p>
        <h2 className="font-serif text-4xl sm:text-5xl leading-tight text-ink">
          Give yourself the comfort <br className="hidden sm:block" />
          you've been waiting for.
        </h2>
        <p className="mt-5 text-muted max-w-xl mx-auto">
          Order today and get your Zeyva Care heating pad delivered to your door — free in Lahore,
          with cash on delivery available nationwide.
        </p>
        <button
          onClick={onOrderClick}
          className="mt-8 bg-ink text-cream px-10 py-4 rounded-full text-sm tracking-widest uppercase font-medium hover:bg-blush-500 transition"
        >
          Order Now · Rs. {product.price.toLocaleString()}
        </button>
        <p className="mt-4 text-xs text-muted">
          🌸 Cash on Delivery · Free Lahore Delivery · 100% Quality Checked
        </p>
      </div>
    </section>
  );
}

/* ─────────────────  FOOTER (With Inconspicuous Hidden Dot)  ───────────────── */

function Footer({ onAdminClick }: { onAdminClick: () => void }) {
  return (
    <footer className="bg-ink text-cream/80 pt-16 pb-24 lg:pb-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2 max-w-sm">
            <div className="flex flex-col leading-none">
              <span className="font-serif text-3xl text-white">
                Zeyva<span className="text-blush-300">.</span>
              </span>
              <span className="text-[9px] tracking-[0.35em] uppercase text-cream/50 mt-0.5">
                Care
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-cream/70">
              Premium wellness essentials designed for the modern woman. Because
              comfort should never be a luxury — it should be a ritual.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-medium mb-4 tracking-wider uppercase text-xs">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#product" className="hover:text-blush-200 transition">Heating Pad</a></li>
              <li><a href="#benefits" className="hover:text-blush-200 transition">Benefits</a></li>
              <li><a href="#reviews" className="hover:text-blush-200 transition">Reviews</a></li>
              <li><a href="#faq" className="hover:text-blush-200 transition">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-medium mb-4 tracking-wider uppercase text-xs">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="https://wa.me/923498015702" className="hover:text-blush-200 transition inline-flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0012.05 0z"/></svg>
                  +92 349 8015702
                </a>
              </li>
              <li>hello@zeyvacare.com</li>
              <li>Lahore, Pakistan</li>
            </ul>
            <div className="mt-4 flex gap-3">
              {["📷", "📘", "🎵"].map((i, idx) => (
                <a key={idx} href="#" className="w-8 h-8 rounded-full border border-cream/20 flex items-center justify-center text-xs hover:bg-cream/10 transition">
                  {i}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-cream/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-cream/50">
          <div className="flex items-center gap-2">
            <p>© {new Date().getFullYear()} Zeyva Care. All rights reserved.</p>
            {/* Hidden admin access point: very small subtle dot with generous click area */}
            <button
              onClick={onAdminClick}
              className="p-2 -m-2 flex items-center justify-center focus:outline-none cursor-pointer group"
              aria-label="Admin Portal"
              title="Admin Portal"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cream/20 group-hover:bg-cream/60 transition-colors" />
            </button>
          </div>
          <p className="flex gap-5">
            <a href="#" className="hover:text-cream">Privacy</a>
            <a href="#" className="hover:text-cream">Terms</a>
            <a href="#" className="hover:text-cream">Shipping</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────  SOCIAL PROOF WIDGET  ───────────────── */

function SocialProofWidget() {
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(() => randInt(10, 20));
  const [key, setKey] = useState(0);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setCount((prev) => {
        const delta = randInt(-2, 2);
        let next = prev + delta;
        if (next < 10) next = 10 + randInt(0, 3);
        if (next > 20) next = 20 - randInt(0, 3);
        return next;
      });
      setKey((k) => k + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="fixed bottom-24 left-4 sm:bottom-6 sm:left-6 z-30 max-w-[280px]">
      <div
        key={key}
        className="zeyva-fade-up bg-white/95 backdrop-blur-md border border-cream-dark shadow-lg rounded-full pl-2 pr-5 py-2 flex items-center gap-3"
      >
        <span className="relative flex w-2.5 h-2.5">
          <span className="absolute inset-0 rounded-full bg-blush-400 opacity-60 animate-ping" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blush-500" />
        </span>
        <p className="text-xs sm:text-[13px] text-ink leading-tight">
          <span className="font-semibold">{count}</span> people are viewing this now
        </p>
      </div>
    </div>
  );
}

/* ─────────────────  STICKY MOBILE BAR  ───────────────── */

function StickyMobileBar({
  onOrderClick,
  selectedBundle,
  bundlesVisible,
  productPrice,
}: {
  onOrderClick: () => void;
  selectedBundle: Bundle;
  bundlesVisible: boolean;
  productPrice: number;
}) {
  const displayPrice = bundlesVisible ? selectedBundle.price : productPrice;
  const subtitle = bundlesVisible
    ? selectedBundle.totalPieces > selectedBundle.quantity
      ? `${selectedBundle.totalPieces} pcs · incl. ${selectedBundle.freeItems || 1} FREE`
      : `${selectedBundle.quantity} ${selectedBundle.quantity === 1 ? "Piece" : "Pieces"} · Free Delivery`
    : "Free Delivery in Lahore";

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-cream/95 backdrop-blur-md border-t border-cream-dark px-4 py-3 flex items-center gap-3 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]">
      <div className="flex-shrink-0">
        <p className="font-serif text-lg leading-none text-ink">
          Rs. {displayPrice.toLocaleString()}
        </p>
        <p className="text-[10px] text-muted mt-0.5">{subtitle}</p>
      </div>
      <button
        onClick={onOrderClick}
        className="flex-1 bg-ink text-cream py-3.5 rounded-full text-xs tracking-widest uppercase font-medium hover:bg-blush-500 transition-colors"
      >
        Order Now
      </button>
    </div>
  );
}

/* ─────────────────  BUNDLE SELECTOR  ───────────────── */

function BundleSelector({
  bundles,
  selected,
  onSelect,
  compareAt = 3499,
}: {
  bundles: Bundle[];
  selected: Bundle;
  onSelect: (b: Bundle) => void;
  compareAt?: number;
}) {
  return (
    <div className="mt-8 relative">
      {/* Heading */}
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium mb-1.5">
            Bundle & Save
          </p>
          <h3 className="font-serif text-xl sm:text-2xl text-ink leading-tight">
            Jitna Zyada Order, Utni Zyada Bachat! <span className="align-middle">💗</span>
          </h3>
        </div>
      </div>

      {/* Options */}
      <div
        role="radiogroup"
        aria-label="Select bundle"
        className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3"
      >
        {bundles.map((b) => {
          const isSelected = selected.id === b.id;
          const isPopular = !!b.popular;
          const totalPieces = b.totalPieces || (b.quantity + (b.freeItems || 0));

          // Base original price per piece is Rs. 3,499
          const baseOriginalPerPiece = compareAt > 0 ? compareAt : 3499;

          // For each bundle: Original Price = Rs. 3,499 * quantity (or * totalPieces if free items included, e.g. 5+1 free = 6 * 3499 = Rs. 20,994)
          const originalPrice = totalPieces * baseOriginalPerPiece;
          const sellingPrice = b.price;

          // Discount % = ((Original Price - Selling Price) / Original Price) * 100
          const discountPercent =
            originalPrice > sellingPrice
              ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
              : 0;

          return (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(b)}
              className={`group relative text-left rounded-2xl border-2 p-3 sm:p-3.5 transition-all duration-200 focus:outline-none flex flex-col justify-between ${
                isSelected
                  ? isPopular
                    ? "border-gold bg-gradient-to-b from-white to-blush-50 shadow-[0_0_0_4px_rgba(201,168,117,0.18),0_8px_24px_-8px_rgba(201,168,117,0.35)]"
                    : "border-blush-400 bg-blush-50 shadow-[0_0_0_3px_rgba(238,179,162,0.25)]"
                  : isPopular
                  ? "border-gold/60 bg-white hover:border-gold hover:shadow-md"
                  : "border-cream-dark bg-white hover:border-blush-200 hover:shadow-sm"
              } ${isPopular ? "md:scale-[1.02]" : ""}`}
            >
              {/* Badge on top of card (e.g. Best Deal / Popular) */}
              {b.badge && (
                <span
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.15em] uppercase font-semibold px-2.5 py-1 rounded-full whitespace-nowrap z-10 ${
                    isPopular
                      ? "bg-gold text-white shadow-md"
                      : "bg-blush-500 text-white"
                  }`}
                >
                  {b.badge}
                </span>
              )}

              {/* Top Row: Radio Indicator + Discount % Badge */}
              <div className="flex items-center justify-between mb-1.5 w-full">
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
                    isSelected
                      ? isPopular
                        ? "border-gold bg-gold"
                        : "border-blush-500 bg-blush-500"
                      : "border-cream-dark bg-white"
                  }`}
                >
                  {isSelected && (
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </span>

                {/* Discount % Badge */}
                {discountPercent > 0 && (
                  <span
                    className={`text-[9.5px] sm:text-[10px] tracking-wide font-bold px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                      isPopular
                        ? "bg-gold/15 text-gold border border-gold/30"
                        : "bg-blush-100 text-blush-500 border border-blush-200/50"
                    }`}
                  >
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Label & Sublabel */}
              <div className="mt-1">
                <p className="font-serif text-base sm:text-lg leading-tight text-ink font-semibold">
                  {b.label}
                </p>
                {b.sublabel && (
                  <p className="text-[10px] font-semibold tracking-wider uppercase text-gold mt-0.5">
                    {b.sublabel}
                  </p>
                )}
              </div>

              {/* Price Section */}
              <div className="mt-2.5 space-y-0.5">
                {/* Original Strikethrough Price */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] sm:text-xs text-muted/75 line-through decoration-muted/60">
                    Rs. {originalPrice.toLocaleString()}
                  </span>
                </div>

                {/* Selling Price (Bold / Brand Color) */}
                <p className="text-base sm:text-lg font-bold text-ink leading-tight">
                  Rs. {sellingPrice.toLocaleString()}
                </p>

                {/* Price per piece */}
                <p className="text-[10px] text-muted">
                  Rs. {Math.round(sellingPrice / Math.max(1, totalPieces)).toLocaleString()} / pc
                </p>
              </div>

              {/* Savings Footer */}
              <div className="mt-2 pt-2 border-t border-cream-dark/70 min-h-[22px] w-full">
                {originalPrice > sellingPrice ? (
                  <p
                    className={`text-[11px] font-medium flex items-center gap-1 ${
                      isPopular ? "text-gold font-semibold" : "text-blush-500"
                    }`}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                      <path d="M12 2l2.4 4.8L20 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.6-1.2z" />
                    </svg>
                    Save Rs. {(originalPrice - sellingPrice).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted">Standard price</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-muted flex items-center gap-1.5">
        <span className="text-blush-500">✨</span>
        Selected total updates below — free delivery in Lahore on every bundle.
      </p>
    </div>
  );
}

/* ─────────────────  UTILITIES  ───────────────── */

function Stars({ value, size = 14, color = "#e5927b" }: { value: number; size?: number; color?: string }) {
  const stars = useMemo(() => Array.from({ length: 5 }, (_, i) => i < value), [value]);
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {stars.map((filled, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "#e8ded2"}>
          <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.6L6 22l1.5-7.2L2 10l7.1-1.1z" />
        </svg>
      ))}
    </span>
  );
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
