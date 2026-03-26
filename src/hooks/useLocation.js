// src/hooks/useLocation.js
// Custom hook for GPS location using expo-location

import * as Location from "expo-location";
import { useEffect, useState } from "react";

const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [place, setPlace] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied.");
          // Fallback to default location
          setLocation({ latitude: 14.5547, longitude: 121.0244 });
          setPlace({ city: "Metro Manila", region: "Philippines" });
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setLocation(coords);

        try {
          const results = await Location.reverseGeocodeAsync(coords);
          const first = results?.[0] ?? null;
          if (first) {
            setPlace({
              city: first.city || first.subregion || first.district || "",
              region: first.region || "",
            });
          }
        } catch {
          // ignore reverse geocode failures
        }

        setLoading(false);
      } catch (e) {
        setErrorMsg(
          e?.message ??
            "Current location is unavailable. Make sure that location services are enabled",
        );
        setLocation({ latitude: 14.5547, longitude: 121.0244 });
        setPlace({ city: "Metro Manila", region: "Philippines" });
        setLoading(false);
      }
    })();
  }, []);

  return { location, place, errorMsg, loading };
};

export default useLocation;
