import { MapboxStyleSwitcherControl } from "https://cdn.skypack.dev/mapbox-gl-style-switcher";

mapboxgl.accessToken = 'pk.eyJ1IjoibXljc2FsIiwiYSI6ImNsc2RtM2tvdzEyNnIybXQwcjI5d2tqcjAifQ.SqGe3A-JLNSkTCYluSpRnA';

function initializeARMap() {
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        projection: 'equirectangular',
        center: [-118.148451, 34.066285],
        zoom: 3.5,
    });
    map.addControl(new MapboxStyleSwitcherControl());
    map.addControl(new mapboxgl.ScaleControl());

    map.on('click', function(e) {
        const { lng, lat } = e.lngLat;
        localStorage.setItem('selectedCoords', JSON.stringify({ lng, lat }));
        window.location.href = 'index.html'
    });

    map.on('style.load', function() {
        addLayers(map);
    });

    map.on('load', function() {
        addLayers(map);
        document.getElementById('noFlyButton').addEventListener('click', function() {
            toggleLayerVisibility(map);
        });
    });
}

function addLayers(map) {
    ['us_military', 'airports', 'us_national_park'].forEach(item => {
        fetch(`../../geojson/${item}.geojson`)
            .then(response => response.json())
            .then(data => {
                if (map.getSource(item)) {
                    map.removeLayer(item);
                    map.removeSource(item);
                }
                map.addSource(item, {
                    type: 'geojson',
                    data: data
                });
                map.addLayer({
                    id: item,
                    type: 'fill',
                    source: item,
                    layout: {},
                    paint: {
                        'fill-color': item === 'us_military' ? '#ff4d4d' : (item === 'us_national_park' ? '#85e085' : '#4da6ff' ),
                        'fill-opacity': 0.5,
                        'fill-outline-color': '#000000',
                    }
                });
            });
    });
}

function toggleLayerVisibility(map) {
    const layers = ['us_military', 'airports', 'us_national_park'];
    layers.forEach(layerId => {
        const visibility = map.getLayoutProperty(layerId, 'visibility');
        if (visibility === 'visible') {
            map.setLayoutProperty(layerId, 'visibility', 'none');
        } else {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeARMap();
});