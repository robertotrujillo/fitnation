import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Usamos el token de .env.local
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const GymMap = () => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const [lng, setLng] = useState(-3.7038); // Madrid por defecto
    const [lat, setLat] = useState(40.4168);
    const [zoom, setZoom] = useState(13);
    const [errorMsg, setErrorMsg] = useState('');
    const [cargando, setCargando] = useState(true);
    const markersRef = useRef([]); // Referencia para guardar y limpiar marcadores

    useEffect(() => {
        // Inicializar el mapa
        if (!mapRef.current) {
            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/dark-v11', // Estilo oscuro FitNation
                center: [lng, lat],
                zoom: zoom
            });

            // Añadir control de navegación (zoom, rotación)
            mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Refrescar los gimnasios al mover el mapa
            mapRef.current.on('moveend', () => {
                if (!mapRef.current) return;
                const center = mapRef.current.getCenter();
                fetchGyms(center.lng, center.lat);
            });

            // Envolver la obtención de ubicación y marcadores iniciales en 'load'
            mapRef.current.on('load', () => {
                if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const userLng = position.coords.longitude;
                            const userLat = position.coords.latitude;
                            setLng(userLng);
                            setLat(userLat);

                            if (mapRef.current) {
                                mapRef.current.setCenter([userLng, userLat]);

                                // Añadir marcador del usuario (punto azul brillante)
                                const el = document.createElement('div');
                                el.style.width = '20px';
                                el.style.height = '20px';
                                el.style.borderRadius = '50%';
                                el.style.backgroundColor = '#0d6efd'; // Primary blue
                                el.style.border = '3px solid white';
                                el.style.boxShadow = '0 0 10px rgba(13, 110, 253, 0.8)';

                                if (mapRef.current && mapContainerRef.current) {
                                    new mapboxgl.Marker({ element: el })
                                        .setLngLat([userLng, userLat])
                                        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h6>Tu ubicación</h6>'))
                                        .addTo(mapRef.current);
                                }

                                // Buscar gimnasios
                                fetchGyms(userLng, userLat);
                            }
                            setCargando(false);
                        },
                        (error) => {
                            console.warn("No se pudo obtener la geolocalización. Usando Madrid por defecto.", error);
                            setErrorMsg('No pudimos acceder a tu ubicación. Mostrando mapa por defecto.');
                            if (mapRef.current) fetchGyms(lng, lat);
                            setCargando(false);
                        },
                        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                    );
                } else {
                    setErrorMsg('La geolocalización no está soportada por tu navegador.');
                    if (mapRef.current) fetchGyms(lng, lat);
                    setCargando(false);
                }
            });
        }

        return () => {
            // Limpiar marcadores
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchGyms = async (longitud, latitud) => {
        if (!mapRef.current) return;

        try {
            // Mapbox Geocoding v5 ha dejado de soportar POIs. Usamos Search Box API v1
            const url = `https://api.mapbox.com/search/searchbox/v1/category/gym?proximity=${longitud},${latitud}&limit=15&access_token=${mapboxgl.accessToken}`;

            const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (!response.ok) throw new Error("Error en la respuesta de Mapbox API: " + response.status);

            const data = await response.json();

            // Limpiar los marcadores antiguos 
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            if (data.features && data.features.length > 0 && mapRef.current) {
                data.features.forEach((feature) => {
                    // Extraemos propiedades asegurando compatibilidad con Search Box API v1 y antigua Geocoding v5
                    const coords = feature.geometry ? feature.geometry.coordinates : feature.center;
                    const properties = feature.properties || {};
                    const placeName = properties.name || properties.name_preferred || feature.text || 'Gimnasio';
                    const address = properties.full_address || properties.address || feature.place_name || '';

                    // Marcador de gimnasio con dimensiones fijas y fallback de emoji
                    const gymIcon = document.createElement('div');
                    gymIcon.innerHTML = '🏋️';
                    gymIcon.style.display = 'flex';
                    gymIcon.style.alignItems = 'center';
                    gymIcon.style.justifyContent = 'center';
                    gymIcon.style.width = '32px';
                    gymIcon.style.height = '32px';
                    gymIcon.style.backgroundColor = '#dc3545';
                    gymIcon.style.borderRadius = '50%';
                    gymIcon.style.border = '2px solid white';
                    gymIcon.style.boxShadow = '0 0 10px rgba(220, 53, 69, 0.6)';
                    gymIcon.style.color = 'white';
                    gymIcon.style.fontSize = '1.2rem';
                    gymIcon.style.cursor = 'pointer';

                    const popupHTML = `
                        <div style="color: #333; padding: 5px;">
                            <h6 style="margin: 0; font-weight: bold; color: #dc3545;">${placeName}</h6>
                            <p style="margin: 5px 0 0; font-size: 0.85rem;">${address}</p>
                        </div>
                    `;

                    if (!mapRef.current) return;

                    if (mapRef.current && mapContainerRef.current) {
                        const nuevoMarcador = new mapboxgl.Marker({ element: gymIcon })
                            .setLngLat(coords)
                            .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupHTML))
                            .addTo(mapRef.current);

                        markersRef.current.push(nuevoMarcador);
                    }
                });
            }
        } catch (error) {
            console.error("Error buscando gimnasios:", error);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            {cargando && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            )}

            {errorMsg && (
                <div className="alert alert-warning m-2 p-2 small position-absolute" style={{ top: 10, left: '10%', right: '10%', zIndex: 5, opacity: 0.9 }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {errorMsg}
                </div>
            )}

            <div
                ref={mapContainerRef}
                className="map-container flex-grow-1 border rounded"
                style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}
            />
        </div>
    );
};

export default GymMap;
