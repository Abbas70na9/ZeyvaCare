export interface ProductImage {
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  compareAt: number;
  badge: string;
  description: string;
  images: ProductImage[];
  features: string[];
  isActive?: boolean;
}

export interface Bundle {
  id: number;
  quantity: number;      // number of paid pieces
  freeItems: number;     // free pieces included
  totalPieces: number;   // quantity + freeItems (used for WhatsApp / order qty)
  label: string;
  sublabel?: string;
  price: number;         // total price for the bundle
  savings: number;       // vs. quantity * PRICE
  badge?: string;
  popular?: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ReviewMedia {
  type: "image" | "video";
  url: string;
  name?: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  date: string;
  avatarColor?: string;
  media?: ReviewMedia[];
  status?: "approved" | "pending" | "rejected";
  googleReview?: boolean;
  userType?: string; // e.g. "Local Guide", "Verified Customer"
  likes?: number;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
}
