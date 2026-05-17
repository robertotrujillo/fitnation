import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

const MuscleHeatmap = ({ heatmapData = {} }) => {
    const { theme } = useTheme();

    const getColor = (intensidad) => {
        const val = Math.min(Math.max(intensidad || 0, 0), 1);
        if (val === 0) return theme === 'dark' ? '#2a2a2a' : '#e9ecef';

        if (val <= 0.25) return '#ffb703'; // Amarillo (1 entreno)
        if (val <= 0.50) return '#fb8500'; // Naranja (2 entrenos)
        if (val <= 0.75) return '#e63946'; // Rojo claro (3 entrenos)
        return '#d90429'; // Rojo ardiente (4+ entrenos)
    };

    const colores = useMemo(() => ({
        hombros: getColor(heatmapData.hombros),
        pecho: getColor(heatmapData.pecho),
        espalda: getColor(heatmapData.espalda),
        brazos: getColor(heatmapData.brazos),
        core: getColor(heatmapData.core),
        piernas: getColor(heatmapData.piernas),
    }), [heatmapData, theme]);

    const strokeColor = theme === 'dark' ? '#121212' : '#ffffff';

    return (
        <div className="d-flex flex-column align-items-center w-100 py-2">
            
            <svg 
                viewBox="0 0 200 280" 
                width="100%" 
                style={{ 
                    maxHeight: '260px',
                    filter: theme === 'dark' ? 'drop-shadow(0px 8px 16px rgba(0,0,0,0.6))' : 'drop-shadow(0px 8px 16px rgba(0,0,0,0.05))'
                }}
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* 
                  DISEÑO GEOMÉTRICO SIMÉTRICO 
                  Basado en bloques redondeados para un look moderno de "App Tracker"
                */}
                <g stroke={strokeColor} strokeWidth="3" strokeLinejoin="round">
                    
                    {/* CABEZA Y CUELLO */}
                    <rect x="85" y="15" width="30" height="30" rx="15" fill={theme === 'dark' ? '#444' : '#d5d5d5'} />
                    <rect x="92" y="40" width="16" height="15" rx="4" fill={theme === 'dark' ? '#444' : '#d5d5d5'} />

                    {/* ESPALDA (Se asoma por los dorsales detrás del pecho) */}
                    <path d="M 68 65 Q 45 105 72 110 Z" fill={colores.espalda} style={{transition: 'fill 0.4s ease'}} />
                    <path d="M 132 65 Q 155 105 128 110 Z" fill={colores.espalda} style={{transition: 'fill 0.4s ease'}} />

                    {/* PECHO */}
                    <rect x="71" y="55" width="28" height="26" rx="8" fill={colores.pecho} style={{transition: 'fill 0.4s ease'}} />
                    <rect x="101" y="55" width="28" height="26" rx="8" fill={colores.pecho} style={{transition: 'fill 0.4s ease'}} />

                    {/* CORE / ABS */}
                    <rect x="74" y="85" width="52" height="42" rx="10" fill={colores.core} style={{transition: 'fill 0.4s ease'}} />

                    {/* HOMBROS */}
                    <rect x="46" y="55" width="22" height="26" rx="10" transform="rotate(15 57 68)" fill={colores.hombros} style={{transition: 'fill 0.4s ease'}} />
                    <rect x="132" y="55" width="22" height="26" rx="10" transform="rotate(-15 143 68)" fill={colores.hombros} style={{transition: 'fill 0.4s ease'}} />

                    {/* BÍCEPS / TRÍCEPS */}
                    <rect x="38" y="85" width="18" height="42" rx="9" transform="rotate(12 47 106)" fill={colores.brazos} style={{transition: 'fill 0.4s ease'}} />
                    <rect x="144" y="85" width="18" height="42" rx="9" transform="rotate(-12 153 106)" fill={colores.brazos} style={{transition: 'fill 0.4s ease'}} />

                    {/* ANTEBRAZOS */}
                    <rect x="29" y="130" width="16" height="40" rx="8" transform="rotate(8 37 150)" fill={colores.brazos} style={{transition: 'fill 0.4s ease'}} />
                    <rect x="155" y="130" width="16" height="40" rx="8" transform="rotate(-8 163 150)" fill={colores.brazos} style={{transition: 'fill 0.4s ease'}} />

                    {/* CUÁDRICEPS */}
                    <rect x="73" y="130" width="25" height="65" rx="12" fill={colores.piernas} style={{transition: 'fill 0.4s ease'}} />
                    <rect x="102" y="130" width="25" height="65" rx="12" fill={colores.piernas} style={{transition: 'fill 0.4s ease'}} />

                    {/* GEMELOS */}
                    <rect x="76" y="200" width="20" height="55" rx="10" fill={colores.piernas} style={{transition: 'fill 0.4s ease'}} />
                    <rect x="104" y="200" width="20" height="55" rx="10" fill={colores.piernas} style={{transition: 'fill 0.4s ease'}} />

                </g>
            </svg>
            
        </div>
    );
};

export default MuscleHeatmap;
