'use client';

import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api';

type Props = {
  lat: number;
  lng: number;
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

export default function JobLocationMap({ lat, lng }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not defined',
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat, lng }}
        zoom={15}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </LoadScript>
  );
}
