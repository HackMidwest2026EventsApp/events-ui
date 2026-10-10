import React, { StrictMode } from "react";
import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import "./MiniMap.css";


const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;


export default function MiniMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [status, setStatus] = useState("Loading map...");

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!API_KEY) {
        setStatus("Missing API key. Check your .env.local file.");
        return;
      }

      try {
        setOptions({ key: API_KEY });

        const { Map } = (await importLibrary("maps")) as
          google.maps.MapsLibrary;

        if (cancelled || !containerRef.current) return;

        const map = new Map(containerRef.current, {
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        });

        mapRef.current = map;

        const marker = new google.maps.Marker({
          map,
          
          title: "Your location",
        });

        markerRef.current = marker;
        setStatus("Map loaded. Finding your location...");

        if (!navigator.geolocation) {
          setStatus("Location unavailable. Showing default location.");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (cancelled) return;

            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            map.setCenter(location);
            map.setZoom(15);
            marker.setPosition(location);

            setStatus("Showing your current location");
          },
          () => {
            if (!cancelled) {
              setStatus(
                "Location denied or unavailable. Showing default location."
              );
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      } catch (error) {
        console.error("Google Maps loading error:", error);

        if (!cancelled) {
          setStatus(
            error instanceof Error
              ? `Map error: ${error.message}`
              : "Unable to load Google Maps."
          );
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;

      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }

      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    function updateFullscreen() {
      setIsFullscreen(
        document.fullscreenElement ===
          containerRef.current?.parentElement
      );
    }

    document.addEventListener("fullscreenchange", updateFullscreen);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        updateFullscreen
      );
    };
  }, []);

  async function toggleFullscreen() {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else if (!document.fullscreenElement) {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      setStatus("Fullscreen is not available in this browser.");
    }
  }

  function recenterLocation() {
    if (!navigator.geolocation || !mapRef.current) {
      setStatus("Map is not ready or location is unavailable.");
      return;
    }

    setStatus("Finding your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        mapRef.current?.setCenter(location);
        mapRef.current?.setZoom(15);
        markerRef.current?.setPosition(location);

        setStatus("Showing your current location");
      },
      () => {
        setStatus("Could not access your current location.");
      }
    );
  }

  return (
    <section className="mini-map">
      <div className="mini-map-header">
        <div>
          <h3>Explore nearby</h3>
          <p>{status}</p>
        </div>

        <div className="mini-map-actions">
          <button
            type="button"
            onClick={recenterLocation}
            aria-label="Find my location"
            title="Find my location"
          >
            ◎
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
          >
            {isFullscreen ? "⊙" : "⛶"}
          </button>
        </div>
      </div>

      <div className="mini-map-canvas" ref={containerRef} />

      {isFullscreen && (
        <button
          className="mini-map-exit"
          type="button"
          onClick={toggleFullscreen}
        >
          Exit fullscreen ✕
        </button>
      )}
    </section>
  );
}
