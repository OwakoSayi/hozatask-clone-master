export const CATEGORIES = [
  // Home Services
  { name: "Handyman Services", icon: "🔧", slug: "handyman" },
  { name: "Plumbing", icon: "🚰", slug: "plumbing" },
  { name: "Electrical Work", icon: "⚡", slug: "electrical" },
  { name: "HVAC Services", icon: "❄️", slug: "hvac" },
  { name: "Carpentry", icon: "🪚", slug: "carpentry" },
  { name: "Painting & Decorating", icon: "🎨", slug: "painting" },
  { name: "Roofing", icon: "🏠", slug: "roofing" },
  { name: "Flooring", icon: "📐", slug: "flooring" },
  
  // Cleaning Services
  { name: "House Cleaning", icon: "🧹", slug: "house-cleaning" },
  { name: "Deep Cleaning", icon: "✨", slug: "deep-cleaning" },
  { name: "Carpet Cleaning", icon: "🧽", slug: "carpet-cleaning" },
  { name: "Window Cleaning", icon: "🪟", slug: "window-cleaning" },
  { name: "Pressure Washing", icon: "💦", slug: "pressure-washing" },
  
  // Moving & Assembly
  { name: "Moving & Delivery", icon: "🚚", slug: "moving" },
  { name: "Furniture Assembly", icon: "🪑", slug: "furniture-assembly" },
  { name: "Packing Services", icon: "📦", slug: "packing" },
  { name: "Junk Removal", icon: "🗑️", slug: "junk-removal" },
  
  // Installation & Mounting
  { name: "TV Mounting", icon: "📺", slug: "tv-mounting" },
  { name: "Home Theater Setup", icon: "🎬", slug: "home-theater" },
  { name: "Smart Home Installation", icon: "🏡", slug: "smart-home" },
  { name: "Appliance Installation", icon: "🔌", slug: "appliance-install" },
  
  // Outdoor Services
  { name: "Gardening & Landscaping", icon: "🌿", slug: "gardening-landscaping" },
  { name: "Lawn Care & Mowing", icon: "🌱", slug: "lawn-care" },
  { name: "Tree Services", icon: "🌳", slug: "tree-services" },
  { name: "Pool Maintenance", icon: "🏊", slug: "pool-maintenance" },
  { name: "Pest Control", icon: "🐛", slug: "pest-control" },
  { name: "Fence Installation", icon: "🚧", slug: "fence-install" },
  
  // Event Services
  { name: "Event Planning", icon: "🎉", slug: "event-planning" },
  { name: "Catering", icon: "🍽️", slug: "catering" },
  { name: "Photography", icon: "📸", slug: "photography" },
  { name: "Videography", icon: "🎥", slug: "videography" },
  { name: "DJ Services", icon: "🎵", slug: "dj" },
  { name: "Event Décor", icon: "🎈", slug: "event-decor" },
  { name: "Jumping Castles", icon: "🏰", slug: "jumping-castles" },
  { name: "Tents & Gazebos", icon: "⛺", slug: "tents-gazebos" },
  { name: "Sound & Lighting", icon: "🔊", slug: "sound-lighting" },
  
  // Beauty & Personal Care
  { name: "Makeup Artists", icon: "💄", slug: "makeup" },
  { name: "Hair Styling", icon: "💇", slug: "hair-styling" },
  { name: "Nail Services", icon: "💅", slug: "nail-services" },
  { name: "Massage Therapy", icon: "💆", slug: "massage" },
  { name: "Personal Training", icon: "💪", slug: "personal-training" },
  { name: "Yoga Instruction", icon: "🧘", slug: "yoga" },
  
  // Automotive
  { name: "Auto Repair", icon: "🔧", slug: "auto-repair" },
  { name: "Car Washing & Detailing", icon: "🚗", slug: "car-wash" },
  { name: "Mobile Mechanic", icon: "🛠️", slug: "mobile-mechanic" },
  
  // Technology & Computing
  { name: "Computer Repair", icon: "💻", slug: "computer-repair" },
  { name: "Phone & Tablet Repair", icon: "📱", slug: "phone-repair" },
  { name: "IT Support", icon: "🖥️", slug: "it-support" },
  { name: "Website Development", icon: "🌐", slug: "web-dev" },
  { name: "Graphic Design", icon: "🎨", slug: "graphic-design" },
  
  // Education & Tutoring
  { name: "Academic Tutoring", icon: "📚", slug: "tutoring" },
  { name: "Music Lessons", icon: "🎹", slug: "music-lessons" },
  { name: "Language Lessons", icon: "🗣️", slug: "language-lessons" },
  { name: "Art Classes", icon: "🖌️", slug: "art-classes" },
  { name: "Dance Lessons", icon: "💃", slug: "dance-lessons" },
  
  // Pet Services
  { name: "Pet Sitting", icon: "🐕", slug: "pet-sitting" },
  { name: "Dog Walking", icon: "🦮", slug: "dog-walking" },
  { name: "Pet Grooming", icon: "✂️", slug: "pet-grooming" },
  { name: "Pet Training", icon: "🐾", slug: "pet-training" },
  
  // Child Care
  { name: "Babysitting", icon: "👶", slug: "babysitting" },
  { name: "Nanny Services", icon: "👪", slug: "nanny" },
  
  // Professional Services
  { name: "Legal Services", icon: "⚖️", slug: "legal" },
  { name: "Accounting & Bookkeeping", icon: "📊", slug: "accounting" },
  { name: "Business Consulting", icon: "💼", slug: "consulting" },
  { name: "Virtual Assistant", icon: "📋", slug: "virtual-assistant" },
  { name: "Translation Services", icon: "🌍", slug: "translation" },
  { name: "Writing & Editing", icon: "✍️", slug: "writing" },
  
  // Specialized Services
  { name: "Locksmith", icon: "🔑", slug: "locksmith" },
  { name: "Security Systems", icon: "🔒", slug: "security" },
  { name: "Upholstery", icon: "🛋️", slug: "upholstery" },
  { name: "Tailoring & Alterations", icon: "🧵", slug: "tailoring" },
  { name: "Welding", icon: "⚙️", slug: "welding" },
  { name: "Restoration Services", icon: "🔄", slug: "restoration" },
] as const;

// For supplier submission form dropdown
export const CATEGORY_NAMES = CATEGORIES.map(c => c.name);
