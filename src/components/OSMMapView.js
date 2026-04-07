import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * OpenStreetMap MapView using Leaflet — 100% free, no API key.
 *
 * Props:
 *  - initialRegion: { latitude, longitude, latitudeDelta, longitudeDelta }
 *  - markers: [{ id, latitude, longitude, color?, title? }]
 *  - polyline: [{ latitude, longitude }]  (drawn as a line)
 *  - polylineColor: string
 *  - showsUserLocation: bool
 *  - userLocation: { latitude, longitude } | null
 *  - style: ViewStyle
 *  - onMapReady: () => void
 *
 * Ref methods:
 *  - animateToRegion({ latitude, longitude, latitudeDelta?, longitudeDelta? }, durationMs)
 *  - fitToCoordinates([{latitude,longitude}], { edgePadding })
 */
const OSMMapView = forwardRef(({
    initialRegion,
    markers = [],
    polyline = [],
    polylineColor = '#0a1628',
    showsUserLocation = false,
    userLocation,
    style,
    onMapReady,
}, ref) => {
    const webRef = useRef(null);
    const [ready, setReady] = useState(false);
    const readyRef = useRef(false);

    const run = (js) => {
        if (webRef.current && readyRef.current) {
            webRef.current.injectJavaScript(`(function(){${js}})();true;`);
        }
    };

    useImperativeHandle(ref, () => ({
        animateToRegion: (region, duration = 800) => {
            const zoom = region.latitudeDelta ? Math.round(14 - Math.log2(region.latitudeDelta)) : 14;
            run(`map.flyTo([${region.latitude},${region.longitude}], ${zoom}, {duration:${duration / 1000}});`);
        },
        fitToCoordinates: (coords) => {
            if (!coords?.length) return;
            const bounds = coords.map(c => `[${c.latitude},${c.longitude}]`).join(',');
            run(`map.fitBounds([${bounds}],{padding:[40,40]});`);
        },
    }));

    // Update markers
    useEffect(() => {
        if (!ready) return;
        const mkrs = markers.map(m => ({
            lat: m.latitude,
            lng: m.longitude,
            color: m.color || '#3b82f6',
            title: m.title || '',
            id: m.id || `${m.latitude}_${m.longitude}`,
        }));
        run(`updateMarkers(${JSON.stringify(mkrs)});`);
    }, [markers, ready]);

    // Update polyline
    useEffect(() => {
        if (!ready) return;
        const pts = polyline.map(p => `[${p.latitude},${p.longitude}]`).join(',');
        run(`updatePolyline([${pts}],"${polylineColor}");`);
    }, [polyline, polylineColor, ready]);

    // Update user location dot
    useEffect(() => {
        if (!ready || !showsUserLocation || !userLocation) return;
        run(`updateUserDot(${userLocation.latitude},${userLocation.longitude});`);
    }, [userLocation, showsUserLocation, ready]);

    const lat = initialRegion?.latitude ?? 17.385;
    const lng = initialRegion?.longitude ?? 78.487;
    const zoom = initialRegion?.latitudeDelta ? Math.round(14 - Math.log2(initialRegion.latitudeDelta)) : 14;

    const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%}</style>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat},${lng}],${zoom});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
var markers={};var polylineLayer=null;var userDot=null;

function makeIcon(color){
  return L.divIcon({className:'',html:'<svg width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="'+color+'"/><circle cx="14" cy="14" r="6" fill="white"/></svg>',iconSize:[28,36],iconAnchor:[14,36]});
}

function updateMarkers(list){
  Object.keys(markers).forEach(function(k){map.removeLayer(markers[k]);});
  markers={};
  list.forEach(function(m){
    markers[m.id]=L.marker([m.lat,m.lng],{icon:makeIcon(m.color)}).addTo(map);
    if(m.title)markers[m.id].bindTooltip(m.title,{permanent:false});
  });
}

function updatePolyline(coords,color){
  if(polylineLayer)map.removeLayer(polylineLayer);
  if(coords.length>1)polylineLayer=L.polyline(coords,{color:color,weight:4,opacity:0.8}).addTo(map);
}

function updateUserDot(lat,lng){
  if(userDot){userDot.setLatLng([lat,lng]);}
  else{userDot=L.circleMarker([lat,lng],{radius:8,fillColor:'#0EA5E9',fillOpacity:1,color:'white',weight:3}).addTo(map);}
}

window.ReactNativeWebView.postMessage('ready');
</script>
</body></html>`;

    return (
        <View style={ [styles.container, style] }>
            <WebView
                ref={ webRef }
                source={ { html } }
                style={ StyleSheet.absoluteFill }
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={ ['*'] }
                scrollEnabled={ false }
                bounces={ false }
                overScrollMode="never"
                showsHorizontalScrollIndicator={ false }
                showsVerticalScrollIndicator={ false }
                onMessage={ (e) => {
                    if (e.nativeEvent.data === 'ready') {
                        readyRef.current = true;
                        setReady(true);
                        onMapReady?.();
                    }
                } }
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1, overflow: 'hidden' },
});

export default OSMMapView;
