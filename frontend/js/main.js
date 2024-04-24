import { initializeThreeJS } from './threejsHandler.js';

document.addEventListener('DOMContentLoaded', () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoibXljc2FsIiwiYSI6ImNsc2RtM2tvdzEyNnIybXQwcjI5d2tqcjAifQ.SqGe3A-JLNSkTCYluSpRnA';
    const storedCoords = JSON.parse(localStorage.getItem('selectedCoords'));
    const defaultCoords = [-118.148451, 34.066285];  
    const centerCoords = storedCoords ? [storedCoords.lng, storedCoords.lat] : defaultCoords;

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        projection: 'globe',
        center: centerCoords,
        zoom: 19,
        pitch: 40,
        bearing: 20,
        antialias: true
    });
    const nav = new mapboxgl.NavigationControl();
    map.addControl(nav, 'top-right');
    map.addControl(new mapboxgl.ScaleControl());
    initializeThreeJS(map);
    localStorage.removeItem('selectedCoords');
});
