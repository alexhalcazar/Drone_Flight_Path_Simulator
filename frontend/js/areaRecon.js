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
    map.on('load', function() {
        fetch('../../geojson/us_military.geojson')
            .then(response => response.json())
            .then(data => {
                map.addSource('us_military', {
                    type: 'geojson',
                    data: data
                });
                map.addLayer({
                    id: 'us_military',
                    type: 'fill',
                    source: 'us_military',
                    layout: {},
                    paint: {
                        'fill-color': '#ff0000', // Red color fill for airports
                        'fill-opacity': 0.5
                    }
                });
            });
    });

    map.on('load', function() {
        fetch('../../geojson/airports.geojson')
            .then(response => response.json())
            .then(data => {
                map.addSource('airports', {
                    type: 'geojson',
                    data: data
                });
                map.addLayer({
                    id: 'airports',
                    type: 'fill',
                    source: 'airports',
                    layout: {},
                    paint: {
                        'fill-color': '#00ff00', // Red color fill for airports
                        'fill-opacity': 0.5
                    }
                });
            });
    });

    map.on('load', function() {
        fetch('../../geojson/us_national_park.geojson')
            .then(response => response.json())
            .then(data => {
                map.addSource('us_national_park', {
                    type: 'geojson',
                    data: data
                });
                map.addLayer({
                    id: 'us_national_park',
                    type: 'fill',
                    source: 'us_national_park',
                    layout: {},
                    paint: {
                        'fill-color': '#0000ff',
                        'fill-opacity': 0.5
                    }
                });
            });
    });
    map.on('click', function(e) {
        const { lng, lat } = e.lngLat;
        localStorage.setItem('selectedCoords', JSON.stringify({ lng, lat }));
        window.location.href = 'index.html'
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeARMap();
});