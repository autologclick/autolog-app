declare module 'geoip-lite' {
  interface GeoipLookup {
    range: [number, number];
    country: string;
    region: string;
    eu: string;
    timezone: string;
    city: string;
    ll: [number, number]; // [latitude, longitude]
    metro: number;
    area: number;
  }
  export function lookup(ip: string): GeoipLookup | null;
  const _default: { lookup: typeof lookup };
  export default _default;
}
