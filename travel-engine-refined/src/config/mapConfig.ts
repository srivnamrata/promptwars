export const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#020617" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#020617" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#020617" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
];

export const defaultCenter = { lat: 35.6762, lng: 139.6503 }; // Default to Tokyo

export const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
};
