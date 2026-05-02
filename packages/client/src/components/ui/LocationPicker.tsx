import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 서울 중심 기본 좌표
const SEOUL_CENTER: [number, number] = [37.5665, 126.978];

interface Props {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(parseFloat(e.latlng.lat.toFixed(7)), parseFloat(e.latlng.lng.toFixed(7)));
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ lat, lng, onChange, height = '240px' }: Props) {
  const center: [number, number] = lat && lng ? [lat, lng] : SEOUL_CENTER;

  return (
    <div>
      <p className="upload-hint" style={{ marginBottom: '0.4rem' }}>지도를 클릭해 위치를 선택하세요</p>
      <div style={{ height, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          {lat && lng && (
            <>
              <RecenterMap lat={lat} lng={lng} />
              <Marker position={[lat, lng]} />
            </>
          )}
        </MapContainer>
      </div>
      {lat && lng && (
        <p className="upload-hint" style={{ marginTop: '0.35rem' }}>
          선택됨: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
