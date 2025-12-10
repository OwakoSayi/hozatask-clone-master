export interface Category {
  name: string;
  icon: string;
  slug: string;
  group: string;
}

export const CATEGORY_GROUPS = [
  "Home Services",
  "Cleaning",
  "Moving & Assembly",
  "Installation & Mounting",
  "Outdoor Services",
  "Event Services",
  "Beauty & Personal Care",
  "Automotive",
  "Technology & Computing",
  "Education & Tutoring",
  "Pet Services",
  "Child Care",
  "Professional Services",
  "Specialized Services",
] as const;

export const CATEGORIES: Category[] = [
  // Home Services
  { name: "Handyman Services", icon: "🔧", slug: "handyman", group: "Home Services" },
  { name: "Plumbing", icon: "🚰", slug: "plumbing", group: "Home Services" },
  { name: "Electrical Work", icon: "⚡", slug: "electrical", group: "Home Services" },
  { name: "HVAC Services", icon: "❄️", slug: "hvac", group: "Home Services" },
  { name: "Carpentry", icon: "🪚", slug: "carpentry", group: "Home Services" },
  { name: "Painting & Decorating", icon: "🎨", slug: "painting", group: "Home Services" },
  { name: "Roofing", icon: "🏠", slug: "roofing", group: "Home Services" },
  { name: "Flooring", icon: "📐", slug: "flooring", group: "Home Services" },
  
  // Cleaning Services
  { name: "House Cleaning", icon: "🧹", slug: "house-cleaning", group: "Cleaning" },
  { name: "Deep Cleaning", icon: "✨", slug: "deep-cleaning", group: "Cleaning" },
  { name: "Carpet Cleaning", icon: "🧽", slug: "carpet-cleaning", group: "Cleaning" },
  { name: "Window Cleaning", icon: "🪟", slug: "window-cleaning", group: "Cleaning" },
  { name: "Pressure Washing", icon: "💦", slug: "pressure-washing", group: "Cleaning" },
  { name: "Laundry Services", icon: "🧺", slug: "laundry-services", group: "Cleaning" },
  
  // Moving & Assembly
  { name: "Moving & Delivery", icon: "🚚", slug: "moving", group: "Moving & Assembly" },
  { name: "Furniture Assembly", icon: "🪑", slug: "furniture-assembly", group: "Moving & Assembly" },
  { name: "Packing Services", icon: "📦", slug: "packing", group: "Moving & Assembly" },
  { name: "Junk Removal", icon: "🗑️", slug: "junk-removal", group: "Moving & Assembly" },
  
  // Installation & Mounting
  { name: "TV Mounting", icon: "📺", slug: "tv-mounting", group: "Installation & Mounting" },
  { name: "Home Theater Setup", icon: "🎬", slug: "home-theater", group: "Installation & Mounting" },
  { name: "Smart Home Installation", icon: "🏡", slug: "smart-home", group: "Installation & Mounting" },
  { name: "Appliance Installation", icon: "🔌", slug: "appliance-install", group: "Installation & Mounting" },
  
  // Outdoor Services
  { name: "Gardening & Landscaping", icon: "🌿", slug: "gardening-landscaping", group: "Outdoor Services" },
  { name: "Lawn Care & Mowing", icon: "🌱", slug: "lawn-care", group: "Outdoor Services" },
  { name: "Tree Services", icon: "🌳", slug: "tree-services", group: "Outdoor Services" },
  { name: "Pool Maintenance", icon: "🏊", slug: "pool-maintenance", group: "Outdoor Services" },
  { name: "Pest Control", icon: "🐛", slug: "pest-control", group: "Outdoor Services" },
  { name: "Fence Installation", icon: "🚧", slug: "fence-install", group: "Outdoor Services" },
  
  // Event Services
  { name: "Event Planning", icon: "🎉", slug: "event-planning", group: "Event Services" },
  { name: "Catering", icon: "🍽️", slug: "catering", group: "Event Services" },
  { name: "Photography", icon: "📸", slug: "photography", group: "Event Services" },
  { name: "Videography", icon: "🎥", slug: "videography", group: "Event Services" },
  { name: "DJ Services", icon: "🎵", slug: "dj", group: "Event Services" },
  { name: "Event Décor", icon: "🎈", slug: "event-decor", group: "Event Services" },
  { name: "Jumping Castles", icon: "🏰", slug: "jumping-castles", group: "Event Services" },
  { name: "Tents & Gazebos", icon: "⛺", slug: "tents-gazebos", group: "Event Services" },
  { name: "Sound & Lighting", icon: "🔊", slug: "sound-lighting", group: "Event Services" },
  
  // Beauty & Personal Care
  { name: "Makeup Artists", icon: "💄", slug: "makeup", group: "Beauty & Personal Care" },
  { name: "Hair Styling", icon: "💇", slug: "hair-styling", group: "Beauty & Personal Care" },
  { name: "Nail Services", icon: "💅", slug: "nail-services", group: "Beauty & Personal Care" },
  { name: "Massage Therapy", icon: "💆", slug: "massage", group: "Beauty & Personal Care" },
  { name: "Personal Training", icon: "💪", slug: "personal-training", group: "Beauty & Personal Care" },
  { name: "Yoga Instruction", icon: "🧘", slug: "yoga", group: "Beauty & Personal Care" },
  
  // Automotive
  { name: "Auto Repair", icon: "🔧", slug: "auto-repair", group: "Automotive" },
  { name: "Car Washing & Detailing", icon: "🚗", slug: "car-wash", group: "Automotive" },
  { name: "Mobile Mechanic", icon: "🛠️", slug: "mobile-mechanic", group: "Automotive" },
  
  // Technology & Computing
  { name: "Computer Repair", icon: "💻", slug: "computer-repair", group: "Technology & Computing" },
  { name: "Phone & Tablet Repair", icon: "📱", slug: "phone-repair", group: "Technology & Computing" },
  { name: "IT Support", icon: "🖥️", slug: "it-support", group: "Technology & Computing" },
  { name: "Website Development", icon: "🌐", slug: "web-dev", group: "Technology & Computing" },
  { name: "Graphic Design", icon: "🎨", slug: "graphic-design", group: "Technology & Computing" },
  
  // Education & Tutoring
  { name: "Academic Tutoring", icon: "📚", slug: "tutoring", group: "Education & Tutoring" },
  { name: "Music Lessons", icon: "🎹", slug: "music-lessons", group: "Education & Tutoring" },
  { name: "Language Lessons", icon: "🗣️", slug: "language-lessons", group: "Education & Tutoring" },
  { name: "Art Classes", icon: "🖌️", slug: "art-classes", group: "Education & Tutoring" },
  { name: "Dance Lessons", icon: "💃", slug: "dance-lessons", group: "Education & Tutoring" },
  
  // Pet Services
  { name: "Pet Sitting", icon: "🐕", slug: "pet-sitting", group: "Pet Services" },
  { name: "Dog Walking", icon: "🦮", slug: "dog-walking", group: "Pet Services" },
  { name: "Pet Grooming", icon: "✂️", slug: "pet-grooming", group: "Pet Services" },
  { name: "Pet Training", icon: "🐾", slug: "pet-training", group: "Pet Services" },
  
  // Child Care
  { name: "Babysitting", icon: "👶", slug: "babysitting", group: "Child Care" },
  { name: "Nanny Services", icon: "👪", slug: "nanny", group: "Child Care" },
  
  // Professional Services
  { name: "Legal Services", icon: "⚖️", slug: "legal", group: "Professional Services" },
  { name: "Accounting & Bookkeeping", icon: "📊", slug: "accounting", group: "Professional Services" },
  { name: "Business Consulting", icon: "💼", slug: "consulting", group: "Professional Services" },
  { name: "Virtual Assistant", icon: "📋", slug: "virtual-assistant", group: "Professional Services" },
  { name: "Translation Services", icon: "🌍", slug: "translation", group: "Professional Services" },
  { name: "Writing & Editing", icon: "✍️", slug: "writing", group: "Professional Services" },
  
  // Specialized Services
  { name: "Locksmith", icon: "🔑", slug: "locksmith", group: "Specialized Services" },
  { name: "Security Systems", icon: "🔒", slug: "security", group: "Specialized Services" },
  { name: "Upholstery", icon: "🛋️", slug: "upholstery", group: "Specialized Services" },
  { name: "Tailoring & Alterations", icon: "🧵", slug: "tailoring", group: "Specialized Services" },
  { name: "Welding", icon: "⚙️", slug: "welding", group: "Specialized Services" },
  { name: "Restoration Services", icon: "🔄", slug: "restoration", group: "Specialized Services" },
];

// For supplier submission form dropdown
export const CATEGORY_NAMES = CATEGORIES.map(c => c.name);

// Helper function to get categories by group
export const getCategoriesByGroup = (group: string) => {
  return CATEGORIES.filter(cat => cat.group === group);
};

// Helper function to get all groups with their categories
export const getGroupedCategories = () => {
  return CATEGORY_GROUPS.map(group => ({
    group,
    categories: getCategoriesByGroup(group),
  }));
};
