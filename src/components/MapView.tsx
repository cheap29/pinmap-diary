"use client";

import { useState } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import { Box, Image, Text, VStack } from "@chakra-ui/react";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapPhoto = {
  id: string;
  lat: number;
  lng: number;
  imageUrl: string;
  diaryText: string | null;
};

type MapViewProps = {
  photos: MapPhoto[];
  focusLat?: number | null;
  focusLng?: number | null;
  focusZoom?: number | null;
};

type PopupInfo = {
  photo: MapPhoto;
  x: number;
  y: number;
};

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      minzoom: 0,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

export function MapView({ photos, focusLat, focusLng, focusZoom }: MapViewProps) {
  const [popup, setPopup] = useState<PopupInfo | null>(null);

  const center =
    focusLat != null && focusLng != null
      ? { longitude: focusLng, latitude: focusLat, zoom: focusZoom ?? 17 }
      : photos.length > 0
      ? { longitude: photos[0].lng, latitude: photos[0].lat, zoom: 14 }
      : { longitude: 139.6917, latitude: 35.6895, zoom: 5 };

  return (
    <Box position="relative" w="full" h="full">
      <Map
        initialViewState={center}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        onClick={() => setPopup(null)}
      >
        {photos.map((photo) => (
          <Marker
            key={photo.id}
            longitude={photo.lng}
            latitude={photo.lat}
            anchor="bottom"
          >
            <Box
              w="28px"
              h="28px"
              bg="brand.500"
              border="2px solid white"
              borderRadius="50% 50% 50% 0"
              transform="rotate(-45deg)"
              cursor="pointer"
              boxShadow="0 2px 8px rgba(0,0,0,0.2)"
              onClick={(e) => {
                e.stopPropagation();
                const rect = (
                  e.currentTarget.closest(".maplibregl-canvas-container") ??
                  e.currentTarget
                ).getBoundingClientRect();
                setPopup({
                  photo,
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
              }}
            />
          </Marker>
        ))}
      </Map>

      {popup && (
        <Box
          position="absolute"
          left={`${Math.max(8, Math.min(popup.x, 260))}px`}
          top={`${Math.max(8, popup.y - 210)}px`}
          bg="white"
          rounded="xl"
          shadow="lg"
          p={3}
          w="200px"
          zIndex={10}
          border="1px solid"
          borderColor="gray.100"
        >
          <VStack gap={2} align="stretch">
            <Image
              src={popup.photo.imageUrl}
              alt="photo"
              rounded="lg"
              h="120px"
              objectFit="contain"
              w="full"
            />
            {popup.photo.diaryText && (
              <Text
                fontSize="xs"
                color="gray.600"
                lineHeight="tall"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {popup.photo.diaryText}
              </Text>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
