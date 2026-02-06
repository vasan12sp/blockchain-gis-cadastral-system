export const initializeMap = (containerId, geoJsonData) => {
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) return;

    try {
        const map = L.map(containerId).setView([0, 0], 2);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        if (geoJsonData && geoJsonData.features) {
            const geoJsonLayer = L.geoJSON(geoJsonData, {
                style: {
                    color: '#2563eb',
                    weight: 3,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        let popup = '<div style="font-size: 0.9rem;">';
                        Object.entries(feature.properties).forEach(([key, value]) => {
                            popup += `<strong>${key}:</strong> ${value}<br>`;
                        });
                        popup += '</div>';
                        layer.bindPopup(popup);
                    }
                }
            }).addTo(map);
            
            map.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] });
        } else {
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f9fafb;">
                    <p style="color: #6b7280;">Map data not available</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Map initialization failed:', error);
        mapContainer.innerHTML = `<p style="color: red;">Failed to load map</p>`;
    }
};

export const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        background: ${type === 'success' ? '#dcfce7' : type === 'error' ? '#fef2f2' : '#f0f9ff'};
        color: ${type === 'success' ? '#166534' : type === 'error' ? '#991b1b' : '#075985'};
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
        return true;
    } catch (error) {
        console.error('Copy failed:', error);
        showToast('Failed to copy', 'error');
        return false;
    }
};

export default {
    initializeMap,
    showToast,
    copyToClipboard
};