import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ItineraryItem } from '../types';
import { extractCoordinates } from '../utils/geo';
import { Utensils, BedDouble, Car, Camera, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default marker icons in Vite/Webpack
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Okinawa Center
const DEFAULT_CENTER: [number, number] = [26.3, 127.8];
const DEFAULT_ZOOM = 9;

// Custom Icons based on activity type
const createCustomIcon = (type: ItineraryItem['type']) => {
    let color = '#3b82f6'; // blue
    let icon = <MapPin size={24} color="white" />;

    switch (type) {
        case 'food':
            color = '#f97316'; // orange
            icon = <Utensils size={24} color="white" />;
            break;
        case 'stay':
            color = '#6366f1'; // indigo
            icon = <BedDouble size={24} color="white" />;
            break;
        case 'move':
            color = '#3b82f6'; // blue
            icon = <Car size={24} color="white" />;
            break;
        case 'play':
            color = '#ec4899'; // pink
            icon = <Camera size={24} color="white" />;
            break;
    }

    const html = renderToStaticMarkup(
        <div style={{
            backgroundColor: color,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid white',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        }}>
            {icon}
        </div>
    );

    return L.divIcon({
        className: 'custom-div-icon',
        html: html,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
};

interface Props {
    items: ItineraryItem[];
    highlightedItemId?: string | null;
}

const MapEffect = ({ center }: { center: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13);
        }
    }, [center, map]);
    return null;
};

export const OkinawaMap: React.FC<Props> = ({ items, highlightedItemId }) => {
    // Process items to get valid coordinates
    const mapItems = useMemo(() => {
        return items.map(item => {
            const coords = item.lat && item.lng
                ? [item.lat, item.lng] as [number, number]
                : extractCoordinates(item.location);
            return {
                ...item,
                coords
            };
        }).filter(item => item.coords !== null);
    }, [items]);

    const highlightedItem = useMemo(() => {
        if (!highlightedItemId) return null;
        return mapItems.find(i => i.id === highlightedItemId);
    }, [highlightedItemId, mapItems]);

    return (
        <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%', borderRadius: '1rem', zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapItems.map(item => item.coords && (
                <Marker
                    key={item.id}
                    position={item.coords}
                    icon={createCustomIcon(item.type)}
                >
                    <Popup>
                        <div className="font-sans">
                            <h3 className="font-bold text-base">{item.title}</h3>
                            <p className="text-sm text-slate-500 m-0">{item.time}</p>
                            <p className="text-sm mt-1">{item.description}</p>
                            {item.location && (
                                <a href={item.location} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-2 block">
                                    Google Maps &rarr;
                                </a>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Fly to highlighted item if present */}
            <MapEffect center={highlightedItem ? highlightedItem.coords : null} />
        </MapContainer>
    );
};
