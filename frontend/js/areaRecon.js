import { MapboxStyleSwitcherControl } from "https://cdn.skypack.dev/mapbox-gl-style-switcher";

mapboxgl.accessToken = 'pk.eyJ1IjoibXljc2FsIiwiYSI6ImNsc2RtM2tvdzEyNnIybXQwcjI5d2tqcjAifQ.SqGe3A-JLNSkTCYluSpRnA';

function initializeARMap() {
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        projection: 'equirectangular',
        center: [-118.148451, 34.066285],
        zoom: 3,
    });
    map.addControl(new MapboxStyleSwitcherControl());
    map.addControl(new mapboxgl.ScaleControl());

    map.on('click', function(e) {
        const { lng, lat } = e.lngLat;
        localStorage.setItem('selectedCoords', JSON.stringify({ lng, lat }));
        window.location.href = 'index.html'
    });

    map.on('load', function() {
        addLayers(map);
    });

    map.on('style.load', function() {
        addLayers(map);
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
                        'fill-color': item === 'airports' ? '#ffff66' : (item === 'us_national_park' ? '#ffb266' : '#ff6666'),
                        'fill-opacity': 0.5,
                        'fill-outline-color': '#000000',
                    }
                });
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeARMap();
});