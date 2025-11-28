export const CATEGORIES = [
  { name: "Jumping Castles", icon: "🏰", slug: "jumping-castles" },
  { name: "Makeup & Beauty", icon: "💄", slug: "makeup-beauty" },
  { name: "Event Décor", icon: "🎨", slug: "event-decor" },
  { name: "Gardening", icon: "🌿", slug: "gardening" },
  { name: "Cleaning", icon: "🧹", slug: "cleaning" },
  { name: "Tents & Gazebos", icon: "⛺", slug: "tents-gazebos" },
  { name: "DJ & Entertainment", icon: "🎵", slug: "dj-entertainment" },
  { name: "Catering", icon: "🍽️", slug: "catering" },
  { name: "Photography", icon: "📸", slug: "photography" },
  { name: "Handyman", icon: "🔧", slug: "handyman" },
] as const;

// For supplier submission form dropdown
export const CATEGORY_NAMES = CATEGORIES.map(c => c.name);
