import type { ReviewMedia } from "../types/store";

interface Props {
  media: ReviewMedia | null;
  onClose: () => void;
}

export default function ReviewMediaLightbox({ media, onClose }: Props) {
  if (!media) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 zeyva-overlay-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center text-lg transition z-20"
        aria-label="Close"
      >
        ✕
      </button>

      <div
        className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-2xl zeyva-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {media.type === "video" ? (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-h-[80vh] max-w-full rounded-2xl"
          />
        ) : (
          <img
            src={media.url}
            alt={media.name || "Customer review photo"}
            className="max-h-[80vh] max-w-full object-contain rounded-2xl"
          />
        )}
      </div>
    </div>
  );
}
