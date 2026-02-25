'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

type Props = {
  onSelectLocation: (lat: number, lng: number, address: string) => void;
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

const defaultCenter: google.maps.LatLngLiteral = {
  lat: 47.9184,
  lng: 106.9177,
};

export default function GoogleMapComponent({ onSelectLocation }: Props) {
  const [markerPosition, setMarkerPosition] =
    useState<google.maps.LatLngLiteral | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      setMarkerPosition({ lat, lng });

      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const address = results[0].formatted_address;
          onSelectLocation(lat, lng, address);
        } else {
          onSelectLocation(lat, lng, '');
        }
      });
    },
    [onSelectLocation],
  );

  if (!isLoaded) return null;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPosition || defaultCenter}
      zoom={13}
      onClick={handleMapClick}
    >
      {markerPosition && <Marker position={markerPosition} />}
    </GoogleMap>
  );
}
