export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export const SA_CITIES = [
  // Gauteng
  { name: "Johannesburg", province: "Gauteng" },
  { name: "Pretoria", province: "Gauteng" },
  { name: "Soweto", province: "Gauteng" },
  { name: "Sandton", province: "Gauteng" },
  { name: "Midrand", province: "Gauteng" },
  { name: "Centurion", province: "Gauteng" },
  { name: "Randburg", province: "Gauteng" },
  { name: "Roodepoort", province: "Gauteng" },
  { name: "Boksburg", province: "Gauteng" },
  { name: "Benoni", province: "Gauteng" },
  { name: "Alberton", province: "Gauteng" },
  { name: "Kempton Park", province: "Gauteng" },
  { name: "Germiston", province: "Gauteng" },
  { name: "Edenvale", province: "Gauteng" },
  { name: "Fourways", province: "Gauteng" },
  
  // Western Cape
  { name: "Cape Town", province: "Western Cape" },
  { name: "Stellenbosch", province: "Western Cape" },
  { name: "Paarl", province: "Western Cape" },
  { name: "George", province: "Western Cape" },
  { name: "Knysna", province: "Western Cape" },
  { name: "Mossel Bay", province: "Western Cape" },
  { name: "Worcester", province: "Western Cape" },
  { name: "Hermanus", province: "Western Cape" },
  { name: "Somerset West", province: "Western Cape" },
  { name: "Bellville", province: "Western Cape" },
  
  // KwaZulu-Natal
  { name: "Durban", province: "KwaZulu-Natal" },
  { name: "Pietermaritzburg", province: "KwaZulu-Natal" },
  { name: "Newcastle", province: "KwaZulu-Natal" },
  { name: "Richards Bay", province: "KwaZulu-Natal" },
  { name: "Ballito", province: "KwaZulu-Natal" },
  { name: "Umhlanga", province: "KwaZulu-Natal" },
  { name: "Pinetown", province: "KwaZulu-Natal" },
  { name: "Ladysmith", province: "KwaZulu-Natal" },
  
  // Eastern Cape
  { name: "Port Elizabeth", province: "Eastern Cape" },
  { name: "East London", province: "Eastern Cape" },
  { name: "Mthatha", province: "Eastern Cape" },
  { name: "Uitenhage", province: "Eastern Cape" },
  { name: "Grahamstown", province: "Eastern Cape" },
  { name: "King William's Town", province: "Eastern Cape" },
  
  // Free State
  { name: "Bloemfontein", province: "Free State" },
  { name: "Welkom", province: "Free State" },
  { name: "Kroonstad", province: "Free State" },
  { name: "Bethlehem", province: "Free State" },
  { name: "Sasolburg", province: "Free State" },
  
  // Limpopo
  { name: "Polokwane", province: "Limpopo" },
  { name: "Tzaneen", province: "Limpopo" },
  { name: "Louis Trichardt", province: "Limpopo" },
  { name: "Phalaborwa", province: "Limpopo" },
  { name: "Mokopane", province: "Limpopo" },
  
  // Mpumalanga
  { name: "Nelspruit", province: "Mpumalanga" },
  { name: "Witbank", province: "Mpumalanga" },
  { name: "Middelburg", province: "Mpumalanga" },
  { name: "Secunda", province: "Mpumalanga" },
  { name: "White River", province: "Mpumalanga" },
  
  // North West
  { name: "Rustenburg", province: "North West" },
  { name: "Potchefstroom", province: "North West" },
  { name: "Klerksdorp", province: "North West" },
  { name: "Mahikeng", province: "North West" },
  { name: "Brits", province: "North West" },
  
  // Northern Cape
  { name: "Kimberley", province: "Northern Cape" },
  { name: "Upington", province: "Northern Cape" },
  { name: "Springbok", province: "Northern Cape" },
  { name: "Kuruman", province: "Northern Cape" },
] as const;

export const getAllLocations = () => {
  const locations: { name: string; type: "city" | "province"; province?: string }[] = [];
  
  // Add provinces
  SA_PROVINCES.forEach(province => {
    locations.push({ name: province, type: "province" });
  });
  
  // Add cities
  SA_CITIES.forEach(city => {
    locations.push({ name: city.name, type: "city", province: city.province });
  });
  
  return locations;
};

export const searchLocations = (query: string, limit = 8) => {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  const allLocations = getAllLocations();
  
  return allLocations
    .filter(loc => loc.name.toLowerCase().includes(lowerQuery))
    .sort((a, b) => {
      // Prioritize matches at the start
      const aStartsWith = a.name.toLowerCase().startsWith(lowerQuery);
      const bStartsWith = b.name.toLowerCase().startsWith(lowerQuery);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      // Then prioritize provinces over cities
      if (a.type === "province" && b.type === "city") return -1;
      if (a.type === "city" && b.type === "province") return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
};
