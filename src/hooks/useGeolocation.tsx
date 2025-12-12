import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  cityName: string | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    cityName: null,
  });

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "Geolocation is not supported by your browser" }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get city name from coordinates using reverse geocoding
        let cityName = null;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await response.json();
          cityName = data.address?.city || data.address?.town || data.address?.municipality || data.address?.county || null;
        } catch (error) {
          console.error("Error getting city name:", error);
        }

        setState({
          latitude,
          longitude,
          error: null,
          loading: false,
          cityName,
        });
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
  };

  return {
    ...state,
    requestLocation,
    calculateDistance,
  };
};

// South African city coordinates for matching
export const SA_CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  // Major Cities
  "Johannesburg": { lat: -26.2041, lon: 28.0473 },
  "Cape Town": { lat: -33.9249, lon: 18.4241 },
  "Durban": { lat: -29.8587, lon: 31.0218 },
  "Pretoria": { lat: -25.7479, lon: 28.2293 },
  "Port Elizabeth": { lat: -33.9608, lon: 25.6022 },
  "Bloemfontein": { lat: -29.0852, lon: 26.1596 },
  "East London": { lat: -33.0153, lon: 27.9116 },
  "Polokwane": { lat: -23.9045, lon: 29.4688 },
  "Nelspruit": { lat: -25.4753, lon: 30.9694 },
  "Kimberley": { lat: -28.7323, lon: 24.7623 },
  // Gauteng
  "Sandton": { lat: -26.1076, lon: 28.0567 },
  "Soweto": { lat: -26.2485, lon: 27.8546 },
  "Randburg": { lat: -26.0936, lon: 28.0064 },
  "Centurion": { lat: -25.8603, lon: 28.1894 },
  "Midrand": { lat: -25.9893, lon: 28.1267 },
  "Benoni": { lat: -26.1882, lon: 28.3209 },
  "Germiston": { lat: -26.2248, lon: 28.1709 },
  "Boksburg": { lat: -26.2128, lon: 28.2593 },
  "Roodepoort": { lat: -26.1625, lon: 27.8725 },
  // Western Cape
  "Stellenbosch": { lat: -33.9346, lon: 18.8666 },
  "Paarl": { lat: -33.7346, lon: 18.9587 },
  "Somerset West": { lat: -34.0818, lon: 18.8509 },
  "Bellville": { lat: -33.9017, lon: 18.6280 },
  "Mitchells Plain": { lat: -34.0485, lon: 18.6178 },
  // KwaZulu-Natal
  "Pietermaritzburg": { lat: -29.6006, lon: 30.3794 },
  "Umhlanga": { lat: -29.7213, lon: 31.0851 },
  "Ballito": { lat: -29.5391, lon: 31.2144 },
  "Richards Bay": { lat: -28.7830, lon: 32.0377 },
  "Newcastle": { lat: -27.7590, lon: 29.9318 },
};

// Get coordinates for a location string
export const getLocationCoords = (location: string): { lat: number; lon: number } | null => {
  if (!location) return null;
  
  // Check for exact match first
  if (SA_CITY_COORDS[location]) {
    return SA_CITY_COORDS[location];
  }
  
  // Check if location contains any known city
  const locationLower = location.toLowerCase();
  for (const [city, coords] of Object.entries(SA_CITY_COORDS)) {
    if (locationLower.includes(city.toLowerCase())) {
      return coords;
    }
  }
  
  return null;
};
