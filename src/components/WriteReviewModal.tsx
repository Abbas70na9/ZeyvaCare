import { useState } from "react";
import { submitUserReview } from "../data/storage";
import type { ReviewMedia } from "../types/store";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function WriteReviewModal({ open, onClose, onSubmitted }: Props) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaList, setMediaList] = useState<ReviewMedia[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isImage && !isVideo) {
        alert("Please select only image or video files.");
        return;
      }

      // Check max size (video 25MB, image 10MB)
      if (file.size > 25 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Please select a clip under 25MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEv) => {
        const resultUrl = loadEv.target?.result as string;
        if (resultUrl) {
          setMediaList((prev) => [
            ...prev,
            {
              type: isVideo ? "video" : "image",
              url: resultUrl,
              name: file.name,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const addUrlMedia = () => {
    if (!urlInput.trim()) return;
    const isVideo =
      urlInput.includes(".mp4") ||
      urlInput.includes(".webm") ||
      urlInput.includes(".mov") ||
      urlInput.includes("youtube") ||
      urlInput.includes("video");
    setMediaList((prev) => [
      ...prev,
      {
        type: isVideo ? "video" : "image",
        url: urlInput.trim(),
        name: "Attached media",
      },
    ]);
    setUrlInput("");
    setShowUrlInput(false);
  };

  const removeMedia = (idx: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!body.trim()) {
      setError("Please write a few words about your experience with Zeyva.");
      return;
    }

    setSubmitting(true);
    setError("");

    setTimeout(() => {
      submitUserReview({
        name: name.trim(),
        location: location.trim() || "Pakistan",
        rating,
        title: title.trim() || "My experience with Zeyva Care",
        body: body.trim(),
        verified: true,
        media: mediaList.length > 0 ? mediaList : undefined,
      });

      setSubmitting(false);
      setSubmittedSuccess(true);
      onSubmitted();

      setTimeout(() => {
        setSubmittedSuccess(false);
        onClose();
      }, 2400);
    }, 600);
  };

  const ratingDescriptions: Record<number, string> = {
    5: "★★★★★ (Loved it! Instant relief 🌸)",
    4: "★★★★☆ (Very good experience 👍)",
    3: "★★★☆☆ (Average / Satisfactory)",
    2: "★★☆☆☆ (Could be better)",
    1: "★☆☆☆☆ (Not satisfied)",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 zeyva-overlay-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden zeyva-modal-in max-h-[92vh] flex flex-col border border-cream-dark">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-cream-dark flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {/* Google G logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-ink/70">
                Verified Customer Review
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-ink mt-1">
              Share Your Experience
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Help other women discover real comfort and relief 🌸
            </p>
          </div>
          <button
            onClick={() => !submitting && onClose()}
            className="w-9 h-9 rounded-full hover:bg-cream-dark flex items-center justify-center text-ink/60 hover:text-ink transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {submittedSuccess ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl">
              ✓
            </div>
            <h3 className="font-serif text-2xl text-ink">Thank You for Reviewing! 🌸</h3>
            <p className="text-xs sm:text-sm text-muted max-w-md leading-relaxed">
              Your review has been successfully submitted! Thank you for sharing your experience with Zeyva Care.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs">
                {error}
              </div>
            )}

            {/* Star Rating Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-2">
                Overall Rating <span className="text-blush-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-3xl focus:outline-none transition-transform hover:scale-110"
                    >
                      <span className={filled ? "text-amber-400" : "text-gray-300"}>★</span>
                    </button>
                  );
                })}
                <span className="text-xs text-muted font-medium ml-2">
                  {ratingDescriptions[rating]}
                </span>
              </div>
            </div>

            {/* Name and Location */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1.5">
                  Your Full Name <span className="text-blush-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sana Tariq"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1.5">
                  City / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lahore, DHA Phase 6"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink"
                />
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1.5">
                Review Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Parcel received on time, very warm & soothing!"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink"
              />
            </div>

            {/* Review Body */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1.5">
                Detailed Review <span className="text-blush-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share details of delivery, parcel condition, how the heating pad helped your cramps, battery life, etc."
                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white text-xs text-ink resize-none"
              />
            </div>

            {/* Photo / Video Upload Section */}
            <div className="pt-3 border-t border-cream-dark space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                    Add Photos or Short Video 📸 🎥
                  </label>
                  <p className="text-[11px] text-muted">
                    Show your delivered parcel, unboxing, or product in action.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs text-blush-500 hover:underline font-medium"
                >
                  {showUrlInput ? "Hide URL" : "+ Add by URL"}
                </button>
              </div>

              {/* URL Input */}
              {showUrlInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste image or video link here..."
                    className="flex-1 px-3 py-2 rounded-xl border border-cream-dark text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={addUrlMedia}
                    className="bg-ink text-cream px-4 py-2 rounded-xl text-xs font-medium"
                  >
                    Attach
                  </button>
                </div>
              )}

              {/* Upload Dropzone / Button */}
              <div className="flex flex-wrap gap-3">
                <label className="cursor-pointer border-2 border-dashed border-blush-200 hover:border-blush-400 bg-blush-50/50 hover:bg-blush-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition flex-1 min-w-[200px]">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blush-500 mb-1.5">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-ink">
                    Upload Photos / Short Videos
                  </span>
                  <span className="text-[10px] text-muted mt-0.5">
                    PNG, JPG, MP4, WEBM (From your camera or gallery)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Uploaded Media Thumbnails */}
              {mediaList.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                  {mediaList.map((m, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-cream-dark bg-black aspect-square"
                    >
                      {m.type === "video" ? (
                        <div className="w-full h-full relative flex items-center justify-center bg-zinc-900">
                          <video
                            src={m.url}
                            className="w-full h-full object-cover opacity-80"
                            muted
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-white bg-black/30">
                            ▶
                          </span>
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                            Video
                          </span>
                        </div>
                      ) : (
                        <img
                          src={m.url}
                          alt={m.name || "Review attachment"}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center hover:bg-red-700 transition shadow"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ink text-cream hover:bg-blush-500 py-4 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting Review...
                  </>
                ) : (
                  <>Submit Review 🌸</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
