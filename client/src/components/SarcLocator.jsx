/**
 * SarcLocator.jsx
 * Interactive global map of verified Sexual Assault Referral Centres (SARCs)
 */
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's broken default icon path when bundled with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (color) => L.divIcon({
  html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.15);box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  className: '',
  iconSize:  [12, 12],
  iconAnchor:[6, 6],
  popupAnchor:[0, -10],
});

const ICONS = {
  UK: makeIcon('#a078ff'),
  NG: makeIcon('#6fcfad'),
  ZA: makeIcon('#ffb74d'),
  US: makeIcon('#c084fc'),
  AU: makeIcon('#60a5fa'),
  KE: makeIcon('#f87171'),
};

export const SARC_CENTERS = [
  // UNITED KINGDOM
  { id: 'uk-01', country: 'UK', region: 'UK', name: "The Havens — St Mary's", city: 'London', address: "St Mary's Hospital, Praed St, London W2 1NY", phone: '+44 203 299 1599', lat: 51.5172, lng: -0.1736, hours: '24/7' },
  { id: 'uk-02', country: 'UK', region: 'UK', name: 'The Havens — Camberwell', city: 'London', address: "King's College Hospital, Denmark Hill, London SE5 9RS", phone: '+44 203 299 3592', lat: 51.4679, lng: -0.0923, hours: '24/7' },
  { id: 'uk-03', country: 'UK', region: 'UK', name: 'The Havens — Whitechapel', city: 'London', address: 'Royal London Hospital, Whitechapel Rd, London E1 1BB', phone: '+44 203 594 2264', lat: 51.5185, lng: -0.0600, hours: '24/7' },
  { id: 'uk-04', country: 'UK', region: 'UK', name: 'The Bridge SARC', city: 'Bristol', address: '2nd Floor, Central Health Clinic, Tower Hill, Bristol BS2 0JD', phone: '+44 117 342 6999', lat: 51.4572, lng: -2.5900, hours: '24/7' },
  // NIGERIA
  { id: 'ng-00', country: 'Nigeria', region: 'NG', name: 'EKSUTH SARC Centre', city: 'Ado-Ekiti', address: 'Ekiti State University Teaching Hospital (EKSUTH), Ado-Ekiti', phone: '+234 814 043 2362', lat: 7.6333, lng: 5.2333, hours: '24/7' },
  { id: 'ng-01', country: 'Nigeria', region: 'NG', name: 'Hope Centre 1 — Adamawa', city: 'Yola', address: 'ADSACA Building, State Specialist Hospital Jimeta, Yola', phone: '+234 803 704 0646', lat: 9.2035, lng: 12.4954, hours: '24/7' },
  { id: 'ng-02', country: 'Nigeria', region: 'NG', name: 'Hope Centre 2 — Numan', city: 'Numan', address: 'General Hospital, Numan, Adamawa State', phone: '+234 803 704 0646', lat: 9.4630, lng: 12.0370, hours: '24/7' },
  { id: 'ng-03', country: 'Nigeria', region: 'NG', name: 'Agape Centre — Akwa Ibom', city: 'Eket', address: 'Immanuel General Hospital, Eket, Akwa Ibom', phone: '+234 809 211 2629', lat: 4.6497, lng: 7.9258, hours: '24/7' },
  // SOUTH AFRICA
  { id: 'za-01', country: 'South Africa', region: 'ZA', name: 'Thuthuzela Care Centre — Khayelitsha', city: 'Cape Town', address: 'Site B Day Hospital, Khayelitsha', phone: '+27 21 360 4455', lat: -34.0394, lng: 18.6739, hours: '24/7' },
  { id: 'za-02', country: 'South Africa', region: 'ZA', name: 'Thuthuzela Care Centre — Tygerberg', city: 'Cape Town', address: 'Tygerberg Hospital, Bellville', phone: '+27 21 938 5053', lat: -33.9131, lng: 18.6103, hours: '24/7' },
  { id: 'za-03', country: 'South Africa', region: 'ZA', name: 'Thuthuzela Care Centre — Sebokeng', city: 'Sebokeng', address: 'Sebokeng Hospital, Zone 19', phone: '+27 16 930 3000', lat: -26.5894, lng: 27.8228, hours: '24/7' },
  // USA
  { id: 'us-01', country: 'USA', region: 'US', name: 'SANE @ NYU Langone', city: 'New York', address: '445 E 69th St, New York, NY 10021', phone: '212-844-8888', lat: 40.7684, lng: -73.9591, hours: '24/7' },
  { id: 'us-02', country: 'USA', region: 'US', name: 'Boston Area Rape Crisis Center', city: 'Boston', address: '99 Bishop Richard Allen Dr, Cambridge, MA 02139', phone: '800-841-8371', lat: 42.3674, lng: -71.1052, hours: '24/7 Hotline' },
  { id: 'us-03', country: 'USA', region: 'US', name: 'LACAAW — Los Angeles', city: 'Los Angeles', address: '7060 Hollywood Blvd #220, Los Angeles, CA 90028', phone: '800-585-6231', lat: 34.1016, lng: -118.3383, hours: '24/7 Hotline' },
  // AUSTRALIA
  { id: 'au-01', country: 'Australia', region: 'AU', name: 'REACH — Royal Prince Alfred', city: 'Sydney', address: 'Royal Prince Alfred Hospital, Missenden Rd, Camperdown NSW 2050', phone: '+61 2 9515 7930', lat: -33.8901, lng: 151.1873, hours: '24/7' },
  { id: 'au-02', country: 'Australia', region: 'AU', name: 'Forensic Medical Centre', city: 'Melbourne', address: "St Vincent's Hospital, 41 Victoria Parade, Fitzroy VIC 3065", phone: '+61 3 9231 2300', lat: -37.8058, lng: 144.9785, hours: '24/7' },
  // KENYA
  { id: 'ke-01', country: 'Kenya', region: 'KE', name: 'Gender Violence Recovery Centre — Nairobi', city: 'Nairobi', address: 'Nairobi Hospital, Argwings Kodhek Road', phone: '+254 719 638 006', lat: -1.2954, lng: 36.8147, hours: '24/7' },
];

const REGION_COLORS = { UK: '#a078ff', NG: '#6fcfad', ZA: '#ffb74d', US: '#c084fc', AU: '#60a5fa', KE: '#f87171' };
const REGION_LABELS = { ALL: '🌍 All', UK: '🇬🇧 UK', NG: '🇳🇬 Nigeria', ZA: '🇿🇦 S. Africa', US: '🇺🇸 USA', AU: '🇦🇺 Australia', KE: '🇰🇪 Kenya' };

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

  const filtered = SARC_CENTERS.filter(c => {
    const matchRegion = activeRegion === 'ALL' || c.region === activeRegion;
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase());
    return matchRegion && matchSearch;
  });

  const handleSelect = (center) => {
    setSelected(center);
    setFlyTo([center.lat, center.lng]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-base">search</span>
        <input
          type="text"
          placeholder="Search by name, city or country…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl pl-11 pr-5 py-3 font-body text-sm text-on-surface outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Region filter pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(REGION_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveRegion(key)}
            className={`px-3 py-1.5 rounded-full font-label text-[11px] uppercase tracking-wider transition-all ${
              activeRegion === key
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high border border-outline-variant/10 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Map + list layout */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ height: '500px' }}>
        {/* List panel */}
        <div className="lg:w-72 shrink-0 overflow-y-auto space-y-2 pr-1 no-scrollbar">
          {filtered.length === 0 && (
            <div className="text-center text-on-surface-variant font-label text-xs py-10 opacity-50">No centres match your search.</div>
          )}
          {filtered.map(center => (
            <button
              key={center.id}
              onClick={() => handleSelect(center)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.id === center.id
                  ? 'border-primary bg-primary/10'
                  : 'bg-surface-container-low border-outline-variant/10 hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: REGION_COLORS[center.region] || '#aaa' }} />
                <span className="font-label text-[10px] text-outline uppercase tracking-wider">{center.country}</span>
              </div>
              <p className="font-headline text-sm font-semibold text-on-surface leading-snug mb-0.5">{center.name}</p>
              <p className="font-body text-xs text-on-surface-variant opacity-70">{center.city}</p>
            </button>
          ))}
        </div>

        {/* Leaflet map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-outline-variant/10">
          <MapContainer center={[20, 5]} zoom={2} style={{ height: '100%', width: '100%', zIndex: 1 }} zoomControl>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {flyTo && <FlyToMarker center={flyTo} key={`${flyTo[0]}-${flyTo[1]}`} />}
            {filtered.map(center => (
              <Marker
                key={center.id}
                position={[center.lat, center.lng]}
                icon={ICONS[center.region] || ICONS.UK}
                eventHandlers={{ click: () => setSelected(center) }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{center.name}</p>
                    <p style={{ fontSize: 11, color: '#888', marginBottom: 8, lineHeight: 1.5 }}>{center.address}</p>
                    <a href={`tel:${center.phone}`} style={{ fontSize: 12, fontWeight: 700, color: '#a078ff' }}>
                      📞 {center.phone}
                    </a>
                    <p style={{ fontSize: 10, color: '#aaa', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                      ⏰ {center.hours}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Selected centre detail */}
      {selected && (
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: REGION_COLORS[selected.region] || '#aaa' }} />
              <span className="font-label text-[10px] text-outline uppercase tracking-wider">{selected.country}</span>
            </div>
            <h3 className="font-headline text-base font-bold text-on-surface">{selected.name}</h3>
            <p className="font-body text-sm text-on-surface-variant mt-1 opacity-70">{selected.address}</p>
            <p className="font-label text-[10px] text-outline uppercase tracking-widest mt-1.5">⏰ {selected.hours}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-high border border-outline-variant/10 text-on-surface font-label text-xs uppercase tracking-widest hover:bg-surface-container-highest transition-all"
            >
              <span className="material-symbols-outlined text-base">map</span>
              Maps
            </a>
            <a
              href={`tel:${selected.phone}`}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-label text-xs uppercase tracking-widest hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-base">call</span>
              Call Now
            </a>
          </div>
        </div>
      )}

      {/* Global helpline banner */}
      <div className="p-4 rounded-xl bg-tertiary/5 border border-tertiary/15 text-center">
        <p className="font-body text-sm text-on-surface-variant opacity-80">
          <strong className="font-semibold text-tertiary">Global Helpline:</strong> If your country isn't listed,{' '}
          <a href="https://www.rainn.org/get-help" target="_blank" rel="noopener noreferrer" className="underline text-primary">
            visit RAINN
          </a>{' '}
          or call your national emergency number. You are not alone.
        </p>
      </div>
    </div>
  );
}
