'use client';

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useState } from 'react';

type Props = {
  onSelect: (lat: number, lng: number) => void;
};

const defaultCenter = {
  lat: 47.9184,
  lng: 106.9177,
};

export default function NearbySearchMap({ onSelect }: Props) {
  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  if (!isLoaded) return null;

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '400px' }}
      center={marker || defaultCenter}
      zoom={14}
      onClick={(e) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarker({ lat, lng });
        onSelect(lat, lng);
      }}
    >
      {marker && <Marker position={marker} />}
    </GoogleMap>
  );
}
