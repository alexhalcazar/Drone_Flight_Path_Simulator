mapboxgl.accessToken =
    'pk.eyJ1IjoibG92ZWRvY3RvcjM2OSIsImEiOiJjbHI1eDBhamkwM2NpMnFvczd2ODIyN2QzIn0.IJsSWOjDJyqyv2McyXizag';
// instantiates a new map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    projection: 'globe', // Display the map as a globe, since satellite-v9 defaults to Mercator
    zoom: 20,
    pitch: 65,
    center: [-118.148451, 34.066285], // longitute, latitude
    antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
});

// eslint-disable-next-line no-undef
const tb = (window.tb = new Threebox(map, map.getCanvas().getContext('webgl'), {
    defaultLights: true
}));

// create the popup
const popup = new mapboxgl.Popup({ offset: 25 }).setText('Local 7/11.');

// Create a default Marker and add it to the map.
new mapboxgl.Marker({
    color: '#ff0000'
})
    .setLngLat([-118.149148, 34.068001])
    .setPopup(popup) // sets a popup on this marke
    .addTo(map);

// global variables
let ruler = false;
let drone;
let uas;
let altitude = 0;
let droneX = -118.148512;
let droneY = 34.065868;
let uasX = -118.148746;
let uasY = 34.066381;
let lat;
let lng;

const distanceContainer = document.getElementById('distance');

// GeoJSON object to hold our measurement features
const geojson = {
    type: 'FeatureCollection',
    features: []
};

// Used to draw a line between points
const linestring = {
    type: 'Feature',
    geometry: {
        type: 'LineString',
        coordinates: []
    }
};

map.on('style.load', () => {
    map.setFog({}); // Set the default atmosphere style
    // Insert the layer beneath any symbol layer.
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
    ).id;

    // The 'building' layer in the Mapbox Streets
    // vector tileset contains building height data
    // from OpenStreetMap.
    map.addLayer(
        {
            id: 'add-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
                'fill-extrusion-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'height'],
                    0, '#C0C0C0',
                    100, '#606060',
                    200, '#202020'
                ],

                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'height']
                ],
                'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 1
            }
        },
        labelLayerId
    );

    // add a source and layers for run route
    map.addSource('alhambra', {
        type: 'geojson',
        data: '../data/alhambra.geojson'
    });

    // add a mapbox style layer
    map.addLayer({
        id: 'alhambra-lines',
        type: 'line',
        source: 'alhambra',
        paint: {
            'line-color': [
                'match',
                ['get', 'name'],
                'run-route',
                '#0000ff',
                'church',
                '#00ff00',
                '#ffff00'
            ],
            'line-width': [
                'match',
                ['get', 'name'],
                'run-route',
                4,
                'church',
                4,
                4
            ]
        },
        filter: ['in', 'name', 'run-route', 'church']
    });

    map.addLayer({
        id: 'alhambra-fills',
        type: 'fill',
        source: 'alhambra',
        paint: {
            'fill-color': [
                'match',
                ['get', 'name'],
                'school',
                '#ff00ff',
                'run-route',
                '#ff0000',
                'church',
                '#ff0000',
                '#ffff00'
            ],
            'fill-opacity': [
                'match',
                ['get', 'name'],
                'church',
                0,
                'run-route',
                0,
                0.5
            ]
        }
    });

    // drone
    map.addLayer({
        id: 'drone',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {
            // Creative Commons License attribution:  Metlife Building model by https://sketchfab.com/NanoRay
            // https://sketchfab.com/3d-models/metlife-building-32d3a4a1810a4d64abb9547bb661f7f3
            const scale = 3.2;
            const options = {
                obj: '../drone/scene.gltf',
                type: 'gltf',
                scale: { x: scale, y: scale, z: 2.7 },
                units: 'meters',
                rotation: { x: 90, y: -90, z: 0 }
            };

            tb.loadObj(options, (model) => {
                model.setCoords([droneX, droneY, altitude]);
                model.setRotation({ x: 0, y: 0, z: 250 });
                tb.add(model);

                drone = model;
            });
        },

        render: function () {
            tb.update();
        }
    });

    // counter UAS
    map.addLayer({
        id: 'UAS',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {
            // Creative Commons License attribution:  Metlife Building model by https://sketchfab.com/NanoRay
            // https://sketchfab.com/3d-models/metlife-building-32d3a4a1810a4d64abb9547bb661f7f3
            const scale = 3.2;
            let altitude = 0;
            const options = {
                obj: '../drone/scene.gltf',
                type: 'gltf',
                scale: { x: scale, y: scale, z: 2.7 },
                units: 'meters',
                rotation: { x: 90, y: -90, z: 0 }
            };

            tb.loadObj(options, (model) => {
                model.setCoords([uasX, uasY, altitude]);
                model.setRotation({ x: 0, y: 0, z: 250 });
                tb.add(model);

                uas = model;

                // Raycasting
                // const raycaster = new THREE.Raycaster();
                // const origin = new THREE.Vector3(droneX, droneY, altitude);
                // const destination = new THREE.Vector3(uasX, uasY, altitude);

                // destination.sub(origin).normalize();

                // set the raycaster properties
                // raycaster.set(origin, destination);
                // const intersections = raycaster.intersectObject(uas, true);
            });
        },

        render: function () {
            tb.update();
        }
    });
    map.addSource('geojson', {
        type: 'geojson',
        data: geojson
    });

    // Add styles to the map
    map.addLayer({
        id: 'measure-points',
        type: 'circle',
        source: 'geojson',
        paint: {
            'circle-radius': 5,
            'circle-color': '#000'
        },
        filter: ['in', '$type', 'Point']
    });
    map.addLayer({
        id: 'measure-lines',
        type: 'line',
        source: 'geojson',
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color': '#000',
            'line-width': 2.5
        },
        filter: ['in', '$type', 'LineString']
    });

    map.on('click', (e) => {
        if (ruler) {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['measure-points']
            });

            // Remove the linestring from the group
            // so we can redraw it based on the points collection.
            if (geojson.features.length > 1) geojson.features.pop();

            // Clear the distance container to populate it with a new value.
            distanceContainer.innerHTML = '';

            // If a feature was clicked, remove it from the map.
            if (features.length) {
                const id = features[0].properties.id;
                geojson.features = geojson.features.filter(
                    (point) => point.properties.id !== id
                );
            } else {
                const point = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [e.lngLat.lng, e.lngLat.lat]
                    },
                    properties: {
                        id: String(new Date().getTime())
                    }
                };

                geojson.features.push(point);
            }

            if (geojson.features.length > 1) {
                linestring.geometry.coordinates = geojson.features.map(
                    (point) => point.geometry.coordinates
                );

                geojson.features.push(linestring);

                // Populate the distanceContainer with total distance
                const value = document.createElement('pre');
                const distance = turf.length(linestring);
                value.textContent = `Total distance: ${distance.toLocaleString()}km`;
                distanceContainer.appendChild(value);
            }

            map.getSource('geojson').setData(geojson);
        } else {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['alhambra-fills', 'alhambra-lines']
            });

            if (features.length > 0) {
                let outputDiv = document.getElementById('output');
                const selectedPolygon = features[0];
                const name = selectedPolygon.properties.name;
                outputDiv.innerHTML = name;
            } else {
                let outputDiv = document.getElementById('output');
                outputDiv.innerHTML = 'None';
            }
        }
    });

    // test
    // Create a raycaster
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    // Assuming you have a Mapbox GL JS map instance
    map.on('click', function (event) {
        // Convert mouse coordinates to normalized device coordinates
        mouse.x = (event.point.x / map.getCanvas().width) * 2 - 1;
        mouse.y = -(event.point.y / map.getCanvas().height) * 2 + 1;

        console.log(mouse.x, mouse.y)
        // Set up the raycaster
        raycaster.setFromCamera(mouse, tb.camera, 0, 50);

        // Check for intersections
        var intersects = raycaster.intersectObject(uas, true); // Assuming 'uas' is your 3D model
        //var intersects = raycaster.intersectObject(uas);

        if (intersects.length > 0) {
            // Intersection detected, perform actions
            console.log('Intersection with 3D model:', intersects[0]);
        }
    });

    map.on('click', (event) => {
        // When the map is clicked, set the lng and lat constants
        // equal to the lng and lat properties in the returned lngLat object.
        lng = event.lngLat.lng;
        lat = event.lngLat.lat;
        
        getElevation();
      });
});

const lngDisplay = document.getElementById('lng');
const latDisplay = document.getElementById('lat');
const eleDisplay = document.getElementById('ele');

async function getElevation() {
    // Construct the API request.
    const query = await fetch(
      `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${lng},${lat}.json?layers=contour&limit=50&access_token=${mapboxgl.accessToken}`,
      { method: 'GET' }
    );
    if (query.status !== 200) return;
    const data = await query.json();
    // Display the longitude and latitude values.
    lngDisplay.textContent = lng.toFixed(2);
    latDisplay.textContent = lat.toFixed(2);
    // Get all the returned features.
    const allFeatures = data.features;
    // For each returned feature, add elevation data to the elevations array.
    const elevations = allFeatures.map((feature) => feature.properties.ele);
    // In the elevations array, find the largest value.
    const highestElevation = Math.max(...elevations);
    // Display the largest elevation value.
    eleDisplay.textContent = `${highestElevation} meters`;
  }
  
  

// custom function
function moveDrone(point) {
    drone.setCoords(linestring.geometry.coordinates[point]);
}

map.on('mousemove', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['measure-points']
    });
    // Change the cursor to a pointer when hovering over a point on the map.
    // Otherwise cursor is a crosshair.
    map.getCanvas().style.cursor = features.length ? 'pointer' : 'crosshair';
});

document.querySelector('#btn-church').addEventListener('click', () => {
    map.flyTo({
        center: [-118.146332, 34.063521],
        zoom: 17
    });
});

document.querySelector('#btn-run').addEventListener('click', () => {
    map.flyTo({
        center: [-118.146125, 34.066507],
        zoom: 17
    });
});

document.querySelector('#btn-school').addEventListener('click', () => {
    map.flyTo({
        center: [-118.151082, 34.070773],
        zoom: 17
    });
});

document.querySelector('#btn-ruler-on').addEventListener('click', () => {
    ruler = true;
    let outputDiv = document.getElementById('output');
    outputDiv.innerHTML = 'Ruler On';
});

document.querySelector('#btn-ruler-off').addEventListener('click', () => {
    ruler = false;
    let outputDiv = document.getElementById('output');
    outputDiv.innerHTML = 'Ruler Off';
});

document.querySelector('#btn-move-drone').addEventListener('click', () => {
    // move drone object
    numOfPoints = linestring.geometry.coordinates.length;
    for (let i = 0; i < numOfPoints; i++) {
        setTimeout(() => {
            moveDrone(i);
        }, 2000 * i);
    }
});

document.querySelector('#btn-reset-drone').addEventListener('click', () => {
    drone.setCoords([-118.148512, 34.065868]);
});

// The following values can be changed to control rotation speed:

// At low zooms, complete a revolution every two minutes.
const secondsPerRevolution = 120;
// Above zoom level 5, do not rotate.
const maxSpinZoom = 5;
// Rotate at intermediate speeds between zoom levels 3 and 5.
const slowSpinZoom = 3;

let userInteracting = false;
let spinEnabled = true;

function spinGlobe() {
    const zoom = map.getZoom();
    if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
            // Slow spinning at higher zooms
            const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
            distancePerSecond *= zoomDif;
        }
        const center = map.getCenter();
        center.lng -= distancePerSecond;
        // Smoothly animate the map over one second.
        // When this animation is complete, it calls a 'moveend' event.
        map.easeTo({ center, duration: 1000, easing: (n) => n });
    }
}

// Pause spinning on interaction
map.on('mousedown', () => {
    userInteracting = true;
});

// Restart spinning the globe when interaction is complete
map.on('mouseup', () => {
    userInteracting = false;
    spinGlobe();
});

// These events account for cases where the mouse has moved
// off the map, so 'mouseup' will not be fired.
map.on('dragend', () => {
    userInteracting = false;
    spinGlobe();
});
map.on('pitchend', () => {
    userInteracting = false;
    spinGlobe();
});
map.on('rotateend', () => {
    userInteracting = false;
    spinGlobe();
});

// When animation is complete, start spinning if there is no ongoing interaction
map.on('moveend', () => {
    spinGlobe();
});

document.getElementById('btn-spin').addEventListener('click', (e) => {
    spinEnabled = !spinEnabled;
    if (spinEnabled) {
        spinGlobe();
        e.target.innerHTML = 'Pause rotation';
    } else {
        map.stop(); // Immediately end ongoing animation
        e.target.innerHTML = 'Start rotation';
    }
});

spinGlobe();
