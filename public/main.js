import * as THREE from 'https://unpkg.com/three@0.109.0/build/three.module.js';

mapboxgl.accessToken =
    'pk.eyJ1IjoibG92ZWRvY3RvcjM2OSIsImEiOiJjbHI1eDBhamkwM2NpMnFvczd2ODIyN2QzIn0.IJsSWOjDJyqyv2McyXizag';
// instantiates a new map

const { MercatorCoordinate } = mapboxgl;

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    projection: 'globe',
    zoom: 18,
    center: [-118.148451, 34.066285],
    pitch: 65,
    bearing: 120,
    antialias: true
});

const tb = (window.tb = new Threebox(map, map.getCanvas().getContext('webgl'), {
    defaultLights: true
}));

const distanceContainer = document.getElementById('distance');

//GeoJSON object to hold our measurement features
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


const navControl = new mapboxgl.NavigationControl({
    showZoom: false
});

map.addControl(navControl, 'top-right');

let ruler = false;
let drone;
let altitude = 0;
let droneX = -118.148512;
let droneY = 34.065868;
let lat;
let lng;
let numOfPoints;

function addBuildingToThreeJS(feature) {
    // Extracting geometry and properties
    const coordinates = feature.geometry.coordinates[0];
    const properties = feature.properties;
    const height = properties.height || 5; // Default height if not specified

    console.log(coordinates);
    console.log(properties);
    console.log(height);

    // Create Three.js mesh with this data
    // need to write function to createBuildingMesh.
    // const mesh = createBuildingMesh(coordinates, height);
    // scene.add(mesh);
}

class BoxCustomLayer {
    type = 'custom';
    renderingMode = '3d';

    constructor(id) {
        this.id = id;
    }

    async onAdd(map, gl) {
        this.camera = new THREE.PerspectiveCamera(
            28,
            window.innerWidth / window.innerHeight,
            0.1,
            1e6
        );

        const centerLngLat = map.getCenter();
        this.center = MercatorCoordinate.fromLngLat(centerLngLat, 0);
        const { x, y, z } = this.center;
        const s = this.center.meterInMercatorCoordinateUnits();
        const scale = new THREE.Matrix4().makeScale(s, s, -s);
        const rotation = new THREE.Matrix4().multiplyMatrices(
            new THREE.Matrix4().makeRotationX(-0.5 * Math.PI),
            new THREE.Matrix4().makeRotationY(Math.PI)
        );

        this.cameraTransform = new THREE.Matrix4()
            .multiplyMatrices(scale, rotation)
            .setPosition(x, y, z);

        this.map = map;
        this.scene = this.makeScene();

        // use the Mapbox GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });

        this.renderer.autoClear = false;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.near = -1;
        this.raycaster.far = 1e6;
    }

    makeScene() {
        const scene = new THREE.Scene();
        const skyColor = 0xb1e1ff; // light blue
        const groundColor = 0xb97a20; // brownish orange

        scene.add(new THREE.AmbientLight(0xffffff, 0.25));
        scene.add(new THREE.HemisphereLight(skyColor, groundColor, 0.25));

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(-70, -70, 100).normalize();
        // Directional lights implicitly point at (0, 0, 0).
        scene.add(directionalLight);

        const group = new THREE.Group();

        group.name = '$group';

        const geometry = new THREE.BoxGeometry(10, 10, 10);
        geometry.translate(-50, 10, 0);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000
        });
        const cube = new THREE.Mesh(geometry, material);

        const enemyCube = new THREE.BoxGeometry(10, 10, 10);
        enemyCube.translate(15, 10, 0);
        const material2 = new THREE.MeshPhongMaterial({
            color: 0x0000ff
        });
        const cube2 = new THREE.Mesh(enemyCube, material2);

        const blockerGeometry = new THREE.BoxGeometry(40, 40, 40);
        blockerGeometry.translate(-20, 10, 0);
        const blockerMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00
        });
        const blockerCube = new THREE.Mesh(blockerGeometry, blockerMaterial);

        group.add(cube);
        group.add(cube2);
        // I comment and uncomment the following line to determine if cube can see cube2
        // group.add(blockerCube);
        scene.add(group);

        // adding name attributes
        cube.name = 'cube';
        cube2.name = 'cube2';
        blockerCube.name = 'blocker';

        const materialLine = new THREE.LineBasicMaterial({
            color: 0xff0000
        });

        const points = [];
        points.push(new THREE.Vector3(-50, 10, 0));
        points.push(new THREE.Vector3(0, 10, 0));
        points.push(new THREE.Vector3(15, 10, 0));

        const geometryLine = new THREE.BufferGeometry().setFromPoints(points);

        const line = new THREE.Line(geometryLine, materialLine);
        // I use a line to visibly see what the direction of the vector will be on the map
        // You must comment the following line out if you wish to determine if cube can see cube2
        scene.add(line);

        const raycaster = new THREE.Raycaster();
        // Using the actual position of the cubes did not work for some reason so I had to hard code the origin of both cubes
        raycaster.set(points[0], points[1].clone().sub(points[0]).normalize());
        let intersections = raycaster.intersectObjects(scene.children, true);
        // A raycaster goes through all objects so there is no way to block line of sight
        // Therefore we added a name attribute to cube2's object and check if the first intersection is the cube2's name
        if (intersections[0].object.name === 'cube2') {
            console.log('entered');
            console.log(intersections[0].object);
            // console.log(intersections[1].object);
        } else {
            console.log('not entered');
        }
        return scene;
    }

    render(gl, matrix) {
        this.camera.projectionMatrix = new THREE.Matrix4()
            .fromArray(matrix)
            .multiply(this.cameraTransform);
        this.renderer.state.reset();
        this.renderer.render(this.scene, this.camera);
    }

    raycast(point, isClick) {
        let mouse = new THREE.Vector2();
        // // scale mouse pixel position to a percentage of the screen's width and height
        mouse.x = (point.x / this.map.transform.width) * 2 - 1;
        mouse.y = 1 - (point.y / this.map.transform.height) * 2;

        const camInverseProjection = new THREE.Matrix4().getInverse(
            this.camera.projectionMatrix
        );
        const cameraPosition = new THREE.Vector3().applyMatrix4(
            camInverseProjection
        );
        const mousePosition = new THREE.Vector3(
            mouse.x,
            mouse.y,
            1
        ).applyMatrix4(camInverseProjection);
        const viewDirection = mousePosition
            .clone()
            .sub(cameraPosition)
            .normalize();

        this.raycaster.set(cameraPosition, viewDirection);

        // calculate objects intersecting the picking ray
        let intersects = this.raycaster.intersectObjects(
            this.scene.children,
            true
        );
        $('#info').empty();
        if (intersects.length) {
            for (let i = 0; i < intersects.length; ++i) {
                $('#info').append(' ' + JSON.stringify(intersects[i].distance));
                isClick && console.log(intersects[i]);
            }

            isClick && $('#info').append(';');
        }
    }
}

let boxLayer = new BoxCustomLayer('box');

map.on('load', () => {
    map.addLayer(boxLayer);
});
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
                    "interpolate",
                    ["linear"],
                    ["get", "height"],
                    7.5,
                    "rgba(242, 243, 243, 0.21)",
                    50,
                    "#cad3d8",
                    100,
                    "#6c91ac",
                    200,
                    "#002952"
                  ],

                // Use an 'interpolate' expression to
                // add a smooth transition effect to
                // the buildings as the user zooms in.
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
    
    map.on('click', (event) => {
        // When the map is clicked, set the lng and lat constants
        // equal to the lng and lat properties in the returned lngLat object.
        lng = event.lngLat.lng;
        lat = event.lngLat.lat;
        
        getElevation();
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

    if (!map.getLayer('building')) {
        console.error('Building layer not found in this style');
        return;
    }

    // Filter for buildings with a height property
    map.setFilter('building', ['has', 'height']);

    // Access and log building data (example)
    map.on('click', 'building', function (e) {
        console.log("Building Properties:", e.features[0].properties);
        console.log("Building Geometry:", e.features[0].geometry);
        if (e.features.length >0 ){
            const feature = e.features[0];
            addBuildingToThreeJS(feature);
            console.log(feature)
        }
    });

    map.on('load', () => {
        map.addSource('geojson', {
            'type': 'geojson',
            'data': geojson
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
            let outputDiv = document.getElementById('output');
                outputDiv.innerHTML = 'None';
        }
    });
});
map.on('mousemove', (e) => {
    boxLayer.raycast(e.point, false);
});

map.on('click', (e) => {
    boxLayer.raycast(e.point, true);
});

const lngDisplay = document.getElementById('lng');
const latDisplay = document.getElementById('lat');
const eleDisplay = document.getElementById('ele');

async function getElevation() {
    // Construct the API request.
    const query = await fetch(
      `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${lng},${lat}.json?layers=contour&limit=50&access_token=${mapboxgl.accessToken}`,
      { method: 'GET'
    }
    );
    if (query.status !== 200) return;
    const data = await query.json();
    // Display the longitude and latitude values.
    lngDisplay.textContent = lng.toFixed(8);
    latDisplay.textContent = lat.toFixed(8);
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
    const dronePath = {
        geometry: {
          type: "LineString",
          coordinates: [
            [-118.14848769, 34.06582944],
            [-118.14513433, 34.06006182]
          ]
        }
    };
    const options = {
        path: dronePath.geometry.coordinates,
        duration: 10000
    }

    // start the drone animation with above options, and remove the line when animation ends
    drone.followPath(
        options,
        function() {
            tb.remove(line);
        }
    );

    //------ Old Method: keeping here in case needed for reference -------//
    // numOfPoints = linestring.geometry.coordinates.length;
    // for (let i = 0; i < numOfPoints; i++) {
    //     setTimeout(() => {
    //         moveDrone(i);
    //     }, 2000 * i);
    // }
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

//------------ TESTING CODE -----------------//


// Smooth animation for a line going across the map

const currentDate = new Date();
const currentTime = currentDate.getTime();
map.on("style.load", () => {
    const animatedLine = {
    type: "Feature",
    properties: {
      stroke: "#555555",
      "stroke-width": 2,
      "stroke-opacity": 1
    },
    geometry: {
      type: "LineString",
      coordinates: [
        [-118.14848769, 34.06582944],
        [-118.14513433, 34.06006182]
      ]
    }
};

  map.addSource("animated-line", {
    type: "geojson",
    data: animatedLine,
    // Line metrics is required to use the 'line-progress' property
    lineMetrics: true
  });

  map.addLayer({
    id: "animated-line-line",
    type: "line",
    source: "animated-line",
    paint: {
      "line-color": "rgba(0,0,0,0)",
      "line-width": 8,
      "line-opacity": 0.7
    }
  });

//-------- Moved into click funtion -----------//

//   let startTime;
//   const duration = 10000;

//   const frame = (time) => {
//     if (!startTime) startTime = time;
//     const animationPhase = (time - startTime) / duration;
    

//     // Reduce the visible length of the line by using a line-gradient to cutoff the line
//     // animationPhase is a value between 0 and 1 that reprents the progress of the animation
//     map.setPaintProperty("animated-line-line", "line-gradient", [
//       "step",
//       ["line-progress"],
//       "yellow",
//       animationPhase,
//       "rgba(0, 0, 0, 0)"
//     ]);

//     if (animationPhase > 1) {
//       return;
//     }
//     window.requestAnimationFrame(frame);
//   };
  
//   window.requestAnimationFrame(frame);

//   // repeat
//   setInterval(() => {
//     startTime = undefined;
//     window.requestAnimationFrame(frame);
//   }, duration + 1500);
});


//--------- Plays the animation when the button "Play" is clicked ---------//
let running = false;
document.querySelector('#btn-animate').addEventListener('click', () => {
    let animateButton = document.querySelector('#btn-animate');
    if (animateButton.textContent == "Play") { // check if text inside is "Play"
        animateButton.textContent = "Pause";    // If so, change to "Pause"
        running = true;
    } else {
        animateButton.textContent = "Play";
        running = false;
    }
    console.log("clicked");

    if (running == true) {
        let startTime;
    const duration = 10000;
    const frame = (time) => {
        if (!startTime) startTime = time;
        const animationPhase = (time - startTime) / duration;
        // Reduce the visible length of the line by using a line-gradient to cutoff the line
        // animationPhase is a value between 0 and 1 that reprents the progress of the animation
        map.setPaintProperty("animated-line-line", "line-gradient", [
            "step",
            ["line-progress"],
            "yellow",
            animationPhase,
            "rgba(0, 0, 0, 0)"
        ]);
        if (animationPhase > 1) {
            return;
        }
        window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
    
    // repeat the animation
    setInterval(() => {
        startTime = undefined;
        window.requestAnimationFrame(frame);
    }, 
    duration + 1500);
    }
 
    //-------------- TEST 2 ------------------//
    map.on('click', function(e){
        const pt = [e.lngLat.lng, e.lngLat.lat];
        travelPath(pt);
    })

    function travelPath(destination){

        // request directions. See https://docs.mapbox.com/api/navigation/#directions for details

        var url = "https://api.mapbox.com/directions/v5/mapbox/driving/"+[origin, destination].join(';')+"?geometries=geojson&access_token=" + config.accessToken


        fetchFunction(url, function(data){

            // extract path geometry from callback geojson, and set duration of travel
            const options = {
                path: data.routes[0].geometry.coordinates,
                duration: 10000
            }

            // start the truck animation with above options, and remove the line when animation ends
            drone.followPath(
                geojson,
                function() {
                    tb.remove(line);
                }
            );

            // set up geometry for a line to be added to map, lofting it up a bit for *style*
            var lineGeometry = options.path
                .map(function(coordinate){
                    return coordinate.concat([15])
                })

            // create and add line object
            line = tb.line({
                geometry: lineGeometry,
                width: 5,
                color: 'steelblue'
            })

            tb.add(line);

            // set destination as the new origin, for the next trip
            origin = destination;

        })
    }
  
});
