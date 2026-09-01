import type { Product, Bundle, FAQItem, ReviewItem } from "../types/store";

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "zeyva-heating-pad",
    name: "Zeyva Care Period Pain Relief Heating Pad",
    subtitle: "Zeyva Care · Wellness Collection",
    price: 1999,
    compareAt: 3499,
    badge: "Bestseller",
    description:
      "A cordless, rechargeable heating pad designed to bring instant, soothing warmth exactly where you need it. Slim, portable, and stylish — carry your comfort with you at home, at work, or on the go.",
    images: [
      { src: "/images/product-1.jpg", alt: "Zeyva Care heating pad — front view" },
      { src: "/images/product-2.jpg", alt: "Zeyva Care heating pad — side angle" },
      { src: "/images/product-3.jpg", alt: "Woman holding heating pad against sweater" },
      { src: "/images/product-4.jpg", alt: "Flat lay with heating pad and wellness items" },
    ],
    features: [
      "Heats up in under 30 seconds",
      "3 adjustable temperature levels",
      "Up to 6 hours of cordless use per charge",
      "Ultra-slim, discreet fit under clothing",
      "USB-C rechargeable · Auto shut-off safety",
    ],
    isActive: true,
  },
];

export const DEFAULT_BUNDLES: Bundle[] = [
  { id: 1, quantity: 1, freeItems: 0, totalPieces: 1, label: "1 Piece", price: 1999, savings: 0 },
  { id: 2, quantity: 2, freeItems: 0, totalPieces: 2, label: "2 Pieces", price: 3699, savings: 300 },
  { id: 3, quantity: 3, freeItems: 0, totalPieces: 3, label: "3 Pieces", price: 5499, savings: 498, badge: "Popular" },
  { id: 4, quantity: 4, freeItems: 0, totalPieces: 4, label: "4 Pieces", price: 7099, savings: 897 },
  { id: 5, quantity: 5, freeItems: 1, totalPieces: 6, label: "5 Pieces", sublabel: "+ 1 FREE", price: 9995, savings: 1999, popular: true, badge: "Best Deal" },
];

export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "How long does the battery last?",
    answer:
      "A full charge (about 90 minutes) gives you up to 6 hours of continuous warmth on the low setting, or around 3 hours on the highest setting.",
  },
  {
    id: "faq-2",
    question: "Is it safe to use for long periods?",
    answer:
      "Yes. Zeyva Care features an intelligent auto-shutoff system and maintains a body-safe temperature range that's comfortable for extended wear.",
  },
  {
    id: "faq-3",
    question: "Can I wear it under my clothes?",
    answer:
      "Absolutely. The ultra-slim design fits discreetly under most outfits — kurtas, dresses, jeans and more.",
  },
  {
    id: "faq-4",
    question: "Do you deliver outside Lahore?",
    answer:
      "Yes! We ship nationwide across Pakistan. Delivery is free within Lahore and a flat delivery fee applies to other cities.",
  },
  {
    id: "faq-5",
    question: "How is the product checked before delivery?",
    answer:
      "Every Zeyva Care heating pad undergoes strict quality testing and is securely packed with protective cushioning before dispatch to ensure 100% flawless delivery.",
  },
];

export const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    name: "Ayesha Malik",
    location: "Lahore, Punjab",
    rating: 5,
    title: "Parcel received safely in 24 hours! Total game-changer 🌸",
    body: "I was having severe cramps on day 1. Ordered with Free Lahore delivery and received it the very next afternoon! The packaging was so safe with bubble wrap. Tried it immediately — heats up within seconds and gives deep, comforting warmth. I attached a photo of my unboxed parcel!",
    verified: true,
    date: "2 days ago",
    googleReview: true,
    userType: "Local Guide · 14 reviews",
    avatarColor: "#e5927b",
    status: "approved",
    likes: 18,
    media: [
      {
        type: "image",
        url: "/images/review-delivery-1.jpg",
        name: "Delivery parcel unboxing",
      },
    ],
  },
  {
    id: "rev-2",
    name: "Fatima Riaz",
    location: "Karachi, Sindh",
    rating: 5,
    title: "Better than hot water bottles or painkillers",
    body: "Super convenient! No need to boil water or stay in bed. The heating pad is completely cordless and so slim that I even wear it while working at my desk. The blush pink color looks so luxurious. Very satisfied with the quality.",
    verified: true,
    date: "1 week ago",
    googleReview: true,
    userType: "Verified Customer",
    avatarColor: "#c9a875",
    status: "approved",
    likes: 24,
    media: [
      {
        type: "image",
        url: "/images/review-delivery-2.jpg",
        name: "Product on bed with tea",
      },
    ],
  },
  {
    id: "rev-3",
    name: "Zara Khan",
    location: "Lahore, Punjab",
    rating: 5,
    title: "Beautiful presentation & premium build",
    body: "The device feels so soft against the skin and doesn't get dangerously hot — just the perfect therapeutic warmth. Fast cash on delivery in DHA Lahore. Customer support on WhatsApp was also very prompt and polite.",
    verified: true,
    date: "3 weeks ago",
    googleReview: true,
    userType: "Local Guide · 9 reviews",
    avatarColor: "#b28bc2",
    status: "approved",
    likes: 12,
  },
  {
    id: "rev-4",
    name: "Hira Ahmed",
    location: "Islamabad",
    rating: 5,
    title: "Battery easily lasts the entire day",
    body: "Charged it once via Type-C and it kept me cozy throughout my workday. Truly a life-saving device for women. 100% recommended!",
    verified: true,
    date: "1 month ago",
    googleReview: true,
    userType: "Verified Customer",
    avatarColor: "#d67560",
    status: "approved",
    likes: 9,
  },
];
