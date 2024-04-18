import { addDrone } from './drone.js';
import { handleMapClick } from '../../frontend/src/mapClickHandlers.js';
import { pointsLayer } from './measurePoints.js';
import { droneCoordinates } from './drone.js';
export let cube2;
// create a group to hold all building objects
const buildingsGroup = new THREE.Group();
// initalize a set to track generated buildings by their center coordinates to avoid duplication
const generatedBuildings = new Set();

// define the material for buildings
let buildingMaterial = new THREE.MeshPhongMaterial({
    //dark red color
    color: 0x660000,
    //render both sides of the polygon
    side: THREE.DoubleSide,
    // flat shading for a geometric look
    flatShading: true
});

// function to keep re-invoking itself to create a continous animation loop
function animate() {
    requestAnimationFrame(animate);
}

// iniialize threebox with the Mapbox GL JS map instance
export function initializeThreeJS(map) {
    const tb = new Threebox(map, map.getCanvas().getContext('webgl'), {
        // simulate sunlight based on time and location.
        // not implemented fully
        // use https://github.com/jscastro76/threebox/blob/master/examples/14-buildingshadow.html to implement
        realSunlight: true,
        // include default lighting
        defaultLights: true,
        // allow objects to be selectable
        enableSelectingObjects: true,
        // turining off tooltips, turn on for debugging
        enableTooltips: false,
        // allow objects to be dragable
        // once selected hold
        // ctrl: z-plane
        // shift: x,y-plane
        enableDraggingObjects: true
    });
    // expose the Threebox instance to the window so it can be accessed by the 3D objects
    window.tb = tb;
    // query building features and add to the map
    queryBuildingFeatures(map, tb);
    // add drone to map
    addDrone(map, tb);
    pointsLayer(map);
    map.on('click', (e) => {
        handleMapClick(e, map, tb);
    });
}

// calculate the geographical center of a polygon (building)
function calculatePolygonCenter(coordinates) {
    // initialize the sum of x and y coordinates and # of points to 0
    let xSum = 0,
        ySum = 0,
        pointCount = 0;

    // handle nested coordinate arrays
    const points = coordinates[0] ? coordinates[0] : coordinates;

    // sum up all x & y coordinates and count the # of points
    points.forEach((point) => {
        xSum += point[0];
        ySum += point[1];
        pointCount++;
    });

    // calculate the average x and y coordinates to find center
    const centerX = xSum / pointCount;
    const centerY = ySum / pointCount;

    // return the geographical center as longitude and latitude
    return { longitude: centerX, latitude: centerY };
}

// add buildings as 3D objects to the map when it is loaded or moved
function queryBuildingFeatures(map, tb) {
    map.on('load', function () {
        map.addLayer({
            // unique identifier for the layer
            id: 'buildings',
            // custom layer using Threebox
            type: 'custom',
            // render in 3D mode
            renderingMode: '3d',
            onAdd: function (map, gl) {
                // query map features that are buildings
                const renderedBuildings = map.queryRenderedFeatures({
                    layers: ['building']
                });
                // add buildings to Threebox
                addRenderedBuildings(renderedBuildings, tb);
                // generate a cube for raycasting demo
                generateCubeAndRaycast(tb, map);
            },
            render: function (gl, matrix) {
                // updates Threebox scene
                tb.update();
            }
        });
    });
    // requery features when the map is moved and adding buildings to the map
    map.on('moveend', function () {
        const newRenderedBuildings = map.queryRenderedFeatures({
            layers: ['building']
        });
        addRenderedBuildings(newRenderedBuildings, tb);
    });
}

// add rendered buildings to the Threebox scene
function addRenderedBuildings(renderedBuildings) {
    renderedBuildings.forEach((feature) => {
        // calculate the geographical center of the building
        let center = calculatePolygonCenter(feature.geometry.coordinates);
        const id = `${center.longitude},${center.latitude}`;
        // avoid duplidating buildings by checking if they have been generated already
        if (generatedBuildings.has(id)) {
            return;
        }
        // marks this building as generated to avoid duplication
        generatedBuildings.add(id);
        // scale factor for the building extrusions based on latitude
        // sourced from https://github.com/jscastro76/threebox/blob/master/examples/18-extrusions.html
        let s = tb.projectedUnitsPerMeter(center.latitude);
        // create extrusions for the building polygons
        let extrusions = tb.extrusion({
            // use coordinates from the features exisiting geometry
            coordinates: feature.geometry.coordinates,
            geometryOptions: {
                // define the number of curve segments
                curveSegments: 1,
                // disable beveling for a flat appearance
                bevelEnabled: false,
                // set the depth based on feature height or default to 5m then scale
                depth: (feature.properties.height || 5) * s
            },
            // assign the prefedined material to the extrusion
            materials: buildingMaterial
        });
        // position the extrusion at the features center
        extrusions.setCoords([center.longitude, center.latitude, 0]);
        // add the extrusion to the group of THREE buildings
        buildingsGroup.add(extrusions);
    });
    // add the group of buildings to the Threebox Scene
    tb.add(buildingsGroup);
    // log the group of buildings for debugging
    // console.log(buildingsGroup);
    // call the animate function to render the scene
    animate();
}

// function to generate a cube and perform raycast to detect interesctions with buildings
function generateCubeAndRaycast(tb, map) {
    // define the origin point for the enemy cube object setting altitude to 0
    // change the altitude to see if buildings are detected by cube
    const origin = [-118.14884916, 34.0664985, 10];
    // obtain a shallow copy of the droneCoordinates
    let droneOrigin = droneCoordinates.slice();
    // adjust for setting the center of the cube on the drone
    droneOrigin[2] -= 2;
    
    // create a 10x10x10 cube
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const geometry2 = new THREE.BoxGeometry(7, 7, 5);
    // define material with green color
    const material = new THREE.MeshPhongMaterial({
        color: 0x007700,
        side: THREE.DoubleSide,
        transparent: true, opacity: 0.5 
    });
    // create a mesh with the geometry and material
    let cube = new THREE.Mesh(geometry, material);
    // convert the cube to a Threebox object and set its coordinates
    cube = tb
        .Object3D({ obj: cube, units: 'meters', bbox: false })
        .setCoords(origin);
    // add the cube to the Threebox scene.
    tb.add(cube);

    // create a mesh with the geometry and material
    cube2 = new THREE.Mesh(geometry2, material);
    // convert the cube to a Threebox object and set its coordinates
    cube2 = tb
        .Object3D({ obj: cube2, units: 'meters', bbox: false })
        .setCoords(droneOrigin);
    
    // add the cube to the Threebox scene.
    tb.add(cube2);
    buildingsGroup.add(cube2);
    
    // instantiate a raycaster for detecting intersections
    const raycaster = new THREE.Raycaster();
    // set the direction of the raycast to the
    const direction = new THREE.Vector3(0, -1, 0);
    // set raycster origin and direction using cubes current position
    // direction is normalized (turned into a unit vector) to ensure consistent raycasting
    raycaster.set(cube.position, direction.normalize());

    // adding line to visualize raycaster
    const materialLine = new THREE.LineBasicMaterial({
        color: 0xff0000
    });

    const endPoint = new THREE.Vector3();
    endPoint.copy(cube.position).add(direction.multiplyScalar(500));

    const geometryLine = new THREE.BufferGeometry().setFromPoints([
        cube.position,
        endPoint
    ]);
    let line = new THREE.Line(geometryLine, materialLine);
    line = tb
        .Object3D({ obj: line, units: 'meters', bbox: false })
        .setCoords(origin);
    tb.add(line);
    // use raycaster to detect intersections with children of the buildingsGroup object
    // true parameter indicates the method should check all descendants, not just direct children.
    const intersects = raycaster.intersectObjects(
        buildingsGroup.children,
        true
    );

    // log the intersections to the console for debugging
    // console.log('intersects', intersects);
    
    if (intersects.length > 0) {
        // if intersect is detected, chnge the color of the intersected objects to blue
        intersects[0].object.material.color.set(0x000099);    
    }
}
