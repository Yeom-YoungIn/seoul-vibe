/**
 * 목적 - 저장된 위치를 지도 위에 표시하는 읽기 전용 지도 컴포넌트를 제공하기 위해 수정됨
 * 설명 - Leaflet 마커 아이콘 경로를 보정하고, 전달된 좌표와 라벨을 기준으로 지도를 다시 중심 이동시킨다.
 */
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet 기본 마커 아이콘 경로 수정 (번들러 이슈)
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  lat: number;
  lng: number;
  label?: string;
  zoom?: number;
  height?: string;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function MapView({ lat, lng, label, zoom = 15, height = '280px' }: Props) {
  return (
    <div style={{ height, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <MapContainer center={[lat, lng]} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap lat={lat} lng={lng} />
        <Marker position={[lat, lng]}>
          {label && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}
