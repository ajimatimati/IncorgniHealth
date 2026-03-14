/**
 * SarcLocator.jsx
 *
 * Interactive global map of verified Sexual Assault Referral Centres (SARCs)
 * Uses Leaflet.js (OpenStreetMap tiles)
 */
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Fix Leaflet's broken default icon path when bundled with Vite ────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Custom coloured icons per region ────────────────────────────────────────
const makeIcon = (color) => L.divIcon({
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:${color};border:2px solid #FFFFFF;
    box-shadow:0 2px 4px rgba(0,0,0,0.15);
  "></div>`,
  className: '',
  iconSize:  [14, 14],
  iconAnchor:[7, 7],
  popupAnchor:[0, -10],
});

const ICONS = {
  UK:  makeIcon('#1B5EFF'),
  NG:  makeIcon('#059669'),
  ZA:  makeIcon('#D97706'),
  US:  makeIcon('#6D28D9'),
  AU:  makeIcon('#4F83FF'),
  KE:  makeIcon('#DC2626'),
};

// ─── Verified SARC center data ────────────────────────────
export const SARC_CENTERS = [
  // ── UNITED KINGDOM ─────────
  { id: 'uk-01', country: 'UK', region: 'UK', name: "The Havens — St Mary's", city: 'London', address: "St Mary's Hospital, Praed St, London W2 1NY", phone: '+44 203 299 1599', lat: 51.5172, lng: -0.1736, hours: '24/7' },
  { id: 'uk-02', country: 'UK', region: 'UK', name: 'The Havens — Camberwell', city: 'London', address: "King's College Hospital, Denmark Hill, London SE5 9RS", phone: '+44 203 299 3592', lat: 51.4679, lng: -0.0923, hours: '24/7' },
  { id: 'uk-03', country: 'UK', region: 'UK', name: 'The Havens — Whitechapel', city: 'London', address: 'Royal London Hospital, Whitechapel Rd, London E1 1BB', phone: '+44 203 594 2264', lat: 51.5185, lng: -0.0600, hours: '24/7' },
  { id: 'uk-04', country: 'UK', region: 'UK', name: 'The Bridge SARC', city: 'Bristol', address: '2nd Floor, Central Health Clinic, Tower Hill, Bristol BS2 0JD', phone: '+44 117 342 6999', lat: 51.4572, lng: -2.5900, hours: '24/7' },
  // ── NIGERIA ─────────
  { id: 'ng-00', country: 'Nigeria', region: 'NG', name: 'EKSUTH SARC Centre', city: 'Ado-Ekiti', address: 'Ekiti State University Teaching Hospital (EKSUTH), Ado-Ekiti, Ekiti State', phone: '+234 814 043 2362', lat: 7.6333, lng: 5.2333, hours: '24/7' },
  { id: 'ng-01', country: 'Nigeria', region: 'NG', name: 'Hope Centre 1 — Adamawa', city: 'Yola', address: 'ADSACA Building, State Specialist Hospital Jimeta, Yola', phone: '+234 803 704 0646', lat: 9.2035, lng: 12.4954, hours: '24/7' },
  { id: 'ng-02', country: 'Nigeria', region: 'NG', name: 'Hope Centre 2 — Numan', city: 'Numan', address: 'General Hospital, Numan, Adamawa State', phone: '+234 803 704 0646', lat: 9.4630, lng: 12.0370, hours: '24/7' },
  { id: 'ng-03', country: 'Nigeria', region: 'NG', name: 'Agape Centre — Akwa Ibom', city: 'Eket', address: 'Immanuel General Hospital, Eket, Akwa Ibom', phone: '+234 809 211 2629', lat: 4.6497, lng: 7.9258, hours: '24/7' },
  // ── SOUTH AFRICA ─────────
  { id: 'za-01', country: 'South Africa', region: 'ZA', name: 'Thuthuzela Care Centre — Khayelitsha', city: 'Cape Town', address: 'Site B Day Hospital, Khayelitsha, Cape Town', phone: '+27 21 360 4455', lat: -34.0394, lng: 18.6739, hours: '24/7' },
  { id: 'za-02', country: 'South Africa', region: 'ZA', name: 'Thuthuzela Care Centre — Tygerberg', city: 'Cape Town', address: 'Tygerberg Hospital, Bellville, Cape Town', phone: '+27 21 938 5053', lat: -33.9131, lng: 18.6103, hours: '24/7' },
  { id: 'za-03', country: 'South Africa', region: 'ZA', name: 'Thuthuzela Care Centre — Sebokeng', city: 'Sebokeng', address: 'Sebokeng Hospital, Zone 19, Sebokeng', phone: '+27 16 930 3000', lat: -26.5894, lng: 27.8228, hours: '24/7' },
  // ── USA ─────────
  { id: 'us-01', country: 'USA', region: 'US', name: 'SANE @ NYU Langone', city: 'New York', address: '445 E 69th St, New York, NY 10021', phone: '212-844-8888', lat: 40.7684, lng: -73.9591, hours: '24/7' },
  { id: 'us-02', country: 'USA', region: 'US', name: 'Boston Area Rape Crisis Center', city: 'Boston', address: '99 Bishop Richard Allen Dr, Cambridge, MA 02139', phone: '800-841-8371', lat: 42.3674, lng: -71.1052, hours: '24/7 Hotline' },
  { id: 'us-03', country: 'USA', region: 'US', name: 'LACAAW — Los Angeles', city: 'Los Angeles', address: '7060 Hollywood Blvd #220, Los Angeles, CA 90028', phone: '800-585-6231', lat: 34.1016, lng: -118.3383, hours: '24/7 Hotline' },
  // ── AUSTRALIA ─────────
  { id: 'au-01', country: 'Australia', region: 'AU', name: 'REACH — Royal Prince Alfred', city: 'Sydney', address: 'Royal Prince Alfred Hospital, Missenden Rd, Camperdown NSW 2050', phone: '+61 2 9515 7930', lat: -33.8901, lng: 151.1873, hours: '24/7' },
  { id: 'au-02', country: 'Australia', region: 'AU', name: 'Forensic Medical Centre', city: 'Melbourne', address: 'St Vincent\'s Hospital, 41 Victoria Parade, Fitzroy VIC 3065', phone: '+61 3 9231 2300', lat: -37.8058, lng: 144.9785, hours: '24/7' },
  // ── KENYA ─────────
  { id: 'ke-01', country: 'Kenya', region: 'KE', name: 'Gender Violence Recovery Centre — Nairobi', city: 'Nairobi', address: 'Nairobi Hospital, Argwings Kodhek Road, Nairobi', phone: '+254 719 638 006', lat: -1.2954, lng: 36.8147, hours: '24/7' },
];

const FilterPill = ({ label, active, color, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
      active
        ? `bg-[#18181B] text-white border border-[#18181B]`
        : 'bg-white border border-[#E8E6E3] text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
    }`}
  >
    {label}
  </button>
);

function FlyToMarker({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 12, { duration: 1.2 });
  }, [center]);
  return null;
}

export default function SarcLocator() {
  const [activeRegion, setActiveRegion] = useState('ALL');
  const [selected, setSelected]         = useState(null);
  const [search, setSearch]             = useState('');
  const [flyTo, setFlyTo]               = useState(null);

  const REGION_COLORS = { UK: '#1B5EFF', NG: '#059669', ZA: '#D97706', US: '#6D28D9', AU: '#4F83FF', KE: '#DC2626' };
  const REGION_LABELS = { ALL: '🌍 All', UK: '🇬🇧 UK', NG: '🇳🇬 Nigeria', ZA: '🇿🇦 S. Africa', US: '🇺🇸 USA', AU: '🇦🇺 Australia', KE: '🇰🇪 Kenya' };

  const filtered = SARC_CENTERS.filter(c => {
    const matchRegion = activeRegion === 'ALL' || c.region === activeRegion;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
      || c.city.toLowerCase().includes(search.toLowerCase())
      || c.country.toLowerCase().includes(search.toLowerCase());
    return matchRegion && matchSearch;
  });

  const handleSelect = (center) => {
    setSelected(center);
    setFlyTo([center.lat, center.lng]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-black text-[#18181B]">Global SARC Locator</h2>
        <p className="text-[13px] text-[#71717A]">
          {SARC_CENTERS.length} verified centres across {Object.keys(REGION_LABELS).length - 1} countries.
          Click any pin to see contact details.
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, city or country..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-[#F9F9FB] border border-[#E8E6E3] rounded-xl px-4 py-3 text-[14px] text-[#18181B] focus:border-[#6D28D9] focus:bg-white focus:outline-none transition-colors"
      />

      {/* Region filters */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(REGION_LABELS).map(([key, label]) => (
          <FilterPill key={key} label={label} active={activeRegion === key} color={key === 'ALL' ? '#18181B' : REGION_COLORS[key]} onClick={() => setActiveRegion(key)} />
        ))}
      </div>

      {/* Map + list layout */}
      <div className="flex flex-col lg:flex-row gap-5" style={{ height: '520px' }}>
        
        {/* Sidebar list */}
        <div className="lg:w-80 shrink-0 overflow-y-auto space-y-2 pr-1 pb-2">
          {filtered.length === 0 && (
            <div className="text-center text-[#A1A1AA] text-[13px] font-bold py-10">No centres match your search.</div>
          )}
          {filtered.map(center => (
            <button
              key={center.id}
              onClick={() => handleSelect(center)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.id === center.id
                  ? 'border-[#6D28D9] bg-[#F5F3FF] shadow-sm'
                  : 'bg-white border-[#E8E6E3] hover:border-[#D4D4D8] hover:shadow-card-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: REGION_COLORS[center.region] || '#A1A1AA' }} />
                <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-bold">
                  {center.country}
                </span>
              </div>
              <p className="text-[14px] font-bold text-[#18181B] leading-snug mb-0.5">{center.name}</p>
              <p className="text-[12px] text-[#71717A]">{center.city}</p>
            </button>
          ))}
        </div>

        {/* Leaflet map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-[#E8E6E3] relative shadow-card-sm">
          <MapContainer center={[20, 5]} zoom={2} style={{ height: '100%', width: '100%', zIndex: 10 }} zoomControl={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" // Clean light map tiles
            />
            {flyTo && <FlyToMarker center={flyTo} key={`${flyTo[0]}-${flyTo[1]}`} />}
            {filtered.map(center => (
              <Marker key={center.id} position={[center.lat, center.lng]} icon={ICONS[center.region] || ICONS.UK} eventHandlers={{ click: () => setSelected(center) }}>
                <Popup className="sarc-popup">
                  <div className="p-1 min-w-[220px]">
                    <p className="font-bold text-[#18181B] text-[14px] leading-tight mb-1">{center.name}</p>
                    <p className="text-[11px] text-[#71717A] mb-3 leading-relaxed">{center.address}</p>
                    <div className="flex flex-col gap-1.5">
                      <a href={`tel:${center.phone}`} className="inline-flex items-center gap-1.5 text-[#6D28D9] font-bold text-xs hover:underline">
                        📞 {center.phone}
                      </a>
                      <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">⏰ {center.hours}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Selected centre detail card */}
      {selected && (
        <div className="p-5 rounded-2xl border border-[#E8E6E3] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-card-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#18181B] animate-pulse" />
              <span className="text-[11px] text-[#71717A] font-bold uppercase tracking-wider">{selected.country}</span>
            </div>
            <h3 className="text-[#18181B] font-black text-lg">{selected.name}</h3>
            <p className="text-[13px] text-[#71717A] mt-1">{selected.address}</p>
            <p className="text-[11px] text-[#A1A1AA] font-bold uppercase tracking-wider mt-1.5">⏰ {selected.hours}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 bg-white border border-[#E8E6E3] hover:bg-[#F4F4F5] text-[#18181B] rounded-full text-[12px] font-bold transition flex justify-center items-center"
            >
              🗺️ Maps
            </a>
            <a href={`tel:${selected.phone}`} className="px-5 py-2.5 bg-[#18181B] hover:bg-[#27272A] text-white rounded-full text-[12px] font-bold transition flex justify-center items-center">
              📞 Call Now
            </a>
          </div>
        </div>
      )}

      {/* RAINN global helpline banner */}
      <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-center mt-2">
        <p className="text-[13px] text-[#059669]">
          <strong className="font-bold">Global Helpline:</strong> If your country isn't shown,{' '}
          <a href="https://www.rainn.org/get-help" target="_blank" rel="noopener noreferrer" className="underline font-bold">
            visit RAINN
          </a>{' '}
          or call your national emergency number. You are not alone.
        </p>
      </div>
    </div>
  );
}
