import { drone, drones, addDrone, droneCoordinates, startLongitude, startLatitude, startAltitude, droneCurrentLocation } from './drone.js';
import { handleMapClick, droneCoordPath, lng, lat, distanceArray, droneKM, detectionInfo } from './mapClickHandlers.js';
export let cube2;
export let sphere;
export let rangeKM;
export let rangeMI;
export let droneSelected;
let copytb;

let ObjectPointBB, ObjectPoint, spherebound,cubeBB;
const enemyObjects = [];

let intersects;
let enemies = false;
let buildingGenerationEnabled = true;

// Default values set for the drone list
let noiseLevel = drones[0].noiseLevel;
let endurance = drones[0].endurance;
let maxAltitude = drones[0].maxAltitude;
rangeKM = drones[0].range;
rangeMI = rangeKM * 0.62137;
droneSelected = true;

document.getElementById("meters").innerHTML = maxAltitude + "  meters";
document.getElementById("dB").innerHTML = noiseLevel + "  dB";
document.getElementById("km").innerHTML = rangeKM + "  km";
document.getElementById("min").innerHTML = endurance + "  min";

// Variables used for drone pausing
let newPath;
let totalDistance;
let wasPaused;
let animationFinished;

// Variables for detectionInfo popup
export let timesHeard = 0;
export let timesSeen = 0;
export let missionSuccess = 100;

let visualBoolean=false;
let audioBoolean=false;

document.querySelector('#drones-drop-down').addEventListener('change', () => {
    const dropdown = document.getElementById("drones-drop-down");
    const name = dropdown.value;

    let noiseLevel;
    let endurance;
    let maxAltitude;

    for (let i = 0; i < drones.length; i++) {
        if (name === drones[i].name) {
             noiseLevel = drones[i].noiseLevel;
             rangeKM = drones[i].range;
             endurance = drones[i].endurance;
             maxAltitude = drones[i].maxAltitude;
             rangeMI = rangeKM * 0.62137;
             droneSelected = true;
        } 
    }

    document.getElementById("meters").innerHTML = maxAltitude + "  meters";
    document.getElementById("dB").innerHTML = noiseLevel + "  dB";
    document.getElementById("km").innerHTML = rangeKM + "  km";
    document.getElementById("min").innerHTML = endurance + "  min";
});

document.querySelector('#btn-move-drone').addEventListener('click', () => {
    // animationFinished set to false and function called to remove popup if the animation is being replayed
    animationFinished = false;
    detectionInfo(droneCoordPath[droneCoordPath.length-1], animationFinished);

    // Data for the path that the drone will follow as well as the duration of the animation
    const options = {
        path: droneCoordPath,
        duration: 3000,
    }

    if (wasPaused == true) {
        options.path = newPath;
        // if the remaining distance to fly is small shorten the duration of the animation
        if (droneKM - totalDistance < 0.1)
            options.duration = 2000;
        wasPaused = false;
        detectionInfo([droneCurrentLocation[0], droneCurrentLocation[1]], wasPaused);
    }

    // start the drone animation with above options
    drone.followPath(
        options, 
        function() {
            animationFinished = true;
            detectionInfo(droneCoordPath[droneCoordPath.length-1], animationFinished);
        }
    );
    cube2.followPath(options);
    sphere.followPath(options);
});

document.querySelector('#pause').addEventListener('click', (e) => {
    wasPaused = true;
    totalDistance = distanceTraveled(droneCoordPath[0][0], droneCoordPath[0][1],
         droneCurrentLocation[0], droneCurrentLocation[1]);

    for ( let i = 1; i <= distanceArray.length-1; i++) {
        if(totalDistance > distanceArray[i-1] && totalDistance < distanceArray[i]) {
            newPath = [droneCurrentLocation, ...droneCoordPath.slice(i)];
            break;
        }
    }
    
    if (wasPaused == true) {
        detectionInfo([droneCurrentLocation[0], droneCurrentLocation[1]], wasPaused);
    }

    drone.stop();
    cube2.stop();
    sphere.stop();
});

document.querySelector('#btn-reset-drone').addEventListener('click', () => {
    drone.setCoords([startLongitude, startLatitude, startAltitude]);
    cube2.setCoords([startLongitude, startLatitude, startAltitude-2])
    sphere.setCoords([startLongitude, startLatitude, startAltitude-2])
    timesHeard = 0;
    timesSeen = 0;
    missionSuccess = 100;

});

// Gets distance traveled by the drone so far so we know where to have it continue after being paused
function distanceTraveled(lat1, lon1, lat2, lon2) {
    // Array of coordinates representing the object's path
    const pathCoordinates = [[lat1, lon1], [lat2, lon2]];
    
    // Create a LineString geometry from the path coordinates
    const pathLineString = turf.lineString(pathCoordinates);

    // Calculate the length of the LineString, which represents the distance traveled
    const distance = turf.length(pathLineString, {units: 'kilometers'});
    return distance;
}

// create a group to hold all building objects
const buildingsGroup = new THREE.Group();
const generatedBuildings = new Set();

// function to keep re-invoking itself to create a continous animation loop
function animate() {
    requestAnimationFrame(animate);
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
        if(buildingGenerationEnabled)
        {map.addLayer({
            id: 'buildings',
            type: 'custom',
            renderingMode: '3d',
            onAdd: function (map, gl) {
                const renderedBuildings = map.queryRenderedFeatures({
                    layers: ['building']
                });
                addRenderedBuildings(renderedBuildings, tb);
            },
            render: function (gl, matrix) {
                animate();
            }
        });
        }
    });
    // requery features when the map is moved and adding buildings to the map
    map.on('moveend', function () {
        if (buildingGenerationEnabled) {
            const newRenderedBuildings = map.queryRenderedFeatures({layers: ['building']});
            // Filter out buildings already processed
            const filteredBuildings = newRenderedBuildings.filter(feature => {
                let center = calculatePolygonCenter(feature.geometry.coordinates);
                const id = `${center.longitude},${center.latitude}`;
                return !generatedBuildings.has(id);
            });

            if (filteredBuildings.length > 0) {
                addRenderedBuildings(filteredBuildings, tb);
            }
        }
    });
}

document.getElementById('toggle-building-generation').addEventListener('click', () => {
    buildingGenerationEnabled = !buildingGenerationEnabled;
    const statusText = buildingGenerationEnabled ? 'enabled' : 'disabled';
    console.log(`Building generation is now ${statusText}.`);
});

// add rendered buildings to the Threebox scene
function addRenderedBuildings(renderedBuildings) {
    if (!buildingGenerationEnabled) return; 
    renderedBuildings.forEach((feature) => {
        // calculate the geographical center of the building
        let center = calculatePolygonCenter(feature.geometry.coordinates);
        const id = `${center.longitude},${center.latitude}`;
        // avoid duplidating buildings by checking if they have been generated already
        if (!generatedBuildings.has(id)) {
            generatedBuildings.add(id);
            // scale factor for the building extrusions based on latitude
            // sourced from https://github.com/jscastro76/threebox/blob/master/examples/18-extrusions.html
            let s = tb.projectedUnitsPerMeter(center.latitude);
            // define the material for buildings
            let buildingMaterial = new THREE.MeshPhongMaterial({
                color: 0x808080,
                side: THREE.DoubleSide,
                flatShading: true
            });
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
        }
    });
    // add the group of buildings to the Threebox Scene
    tb.add(buildingsGroup);
    animate();
}

function generateDroneCube(tb){
    copytb=tb;
    // define the origin point for the enemy cube object setting altitude to 0
    // change the altitude to see if buildings are detected by cube
    const origin = [-118.14884916, 34.0664985, 10];
    // obtain a shallow copy of the droneCoordinates
    let droneOrigin = droneCoordinates.slice();
    // adjust for setting the center of the cube on the drone
    droneOrigin[2] -= 2;
    
    // create a 10x10x10 cube
    const geometry = new THREE.BoxGeometry(7, 7, 5);
    // define material with green color
    const material = new THREE.MeshPhongMaterial({
        color: 0x007700,
        side: THREE.DoubleSide,
        transparent: true, opacity: 0.5 
    });
    cube2 = new THREE.Mesh(geometry, material);
    // convert the cube to a Threebox object and set its coordinates
    cube2 = tb
        .Object3D({ obj: cube2, units: 'meters', bbox: false })
        .setCoords(droneOrigin);
    // add the cube to the Threebox scene.

    cubeBB=new THREE.Box3(new THREE.Vector3(),new THREE.Vector3());
    cubeBB.setFromObject(cube2);

    tb.add(cube2);

    //sphere coordinates
    let sphereOrigin = droneCoordinates.slice();
    sphereOrigin[2]-=2;
    
    const geometrySphere =  new THREE.SphereGeometry( 10 ); 
    const materialSphere = new THREE.MeshPhongMaterial({
        color: 0xFFFF00,
        side: THREE.DoubleSide,
        transparent: true, opacity: 0.25 
    });

    //sphere obj created
    const loader = new THREE.TextureLoader();
    const texture = loader.load( './textures/texture.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    opacity: 0.25 
    });
    sphere = new THREE.Mesh(geometrySphere, m);
    sphere.geometry.computeBoundingSphere();
    sphere = tb
        .Object3D({ obj: sphere, units: 'meters', bbox: false })
        .setCoords(sphereOrigin);
    // add the cube to the Threebox scene.
    // allows the sphere to raycast
    spherebound=new THREE.Sphere(sphere.position.clone(),10);
    tb.add(sphere);
    createObjectPoint(tb);
}

function createObjectPoint(tb){
    
    const geometryObjectPoint = new THREE.BoxGeometry(150, 350, 50);
    const materialObjectPoint = new THREE.MeshPhongMaterial({
        color: 0x8B0000,
        side: THREE.DoubleSide,
        transparent: true, opacity: 0.25 
    });
    const ObjectPointOrigin = [-118.14657293,34.06664031, 0];
    ObjectPoint = new THREE.Mesh(geometryObjectPoint, materialObjectPoint);
    // convert the cube to a Threebox object and set its coordinates
    ObjectPoint = tb
        .Object3D({ obj:ObjectPoint, units: 'meters', bbox: false })
        .setCoords(ObjectPointOrigin);
    ObjectPointBB=new THREE.Box3(new THREE.Vector3(),new THREE.Vector3());
    ObjectPointBB.setFromObject(ObjectPoint);
    tb.add(ObjectPoint);
    animateEndPoint()
}

function animateEndPoint(){

    ObjectPointBB.copy(ObjectPoint.userData.obj.geometry.boundingBox).applyMatrix4(ObjectPoint.userData.obj.matrixWorld);
    
    spherebound.copy(sphere.userData.obj.geometry.boundingSphere).applyMatrix4(sphere.userData.obj.matrixWorld);


    if(spherebound.intersectsBox(ObjectPointBB)){
        ObjectPoint.userData.obj.material.color.set(0x000000);
    } else {
        ObjectPoint.userData.obj.material.color.set(0x00FF00);
    }
    
    enemyObjects.forEach((object) => {
        
        object.Espherebound.copy(object.Esphere.userData.obj.geometry.boundingSphere).applyMatrix4(object.Esphere.userData.obj.matrixWorld);
        
        if(spherebound.intersectsSphere(object.Espherebound)){
            object.Esphere.userData.obj.material.color.set(0xFF0000 );
            object.Esphere.userData.obj.material.opacity=1.0;
            timesHeard++;
            missionSuccess -= .5;
        } else {
            object.Esphere.userData.obj.material.color.set(0xFFFF00);
            object.Esphere.userData.obj.material.opacity=.15;
            audioBoolean=false;
            
        }
        //visual intersection
        object.enemyBoxBB.copy(object.enemyBox.userData.obj.geometry.boundingBox).applyMatrix4(object.enemyBox.userData.obj.matrixWorld);
        cubeBB.copy(cube2.userData.obj.geometry.boundingBox).applyMatrix4(cube2.userData.obj.matrixWorld);

        if(cubeBB.intersectsBox(object.enemyBoxBB)){
            object.enemyBox.userData.obj.material.color.set(0xFF0000 );
            object.enemyBox.userData.obj.material.opacity=.15;
            
            timesSeen++;
            missionSuccess -= 1.0;
        } else {
            object.enemyBox.userData.obj.material.color.set(0xFFFF00);
            object.enemyBox.userData.obj.material.opacity=.50;

        }
    });
    
    requestAnimationFrame(animateEndPoint);
    
}

document.querySelector('#add-detector').addEventListener('click', () => {
    generateCubeAndRaycast(copytb);
});

// function to generate a cube and perform raycast to detect interesctions with buildings
function generateCubeAndRaycast(tb) {

    let enemyData={};

    const geometry2 = new THREE.BoxGeometry(1, 1, 3);
    // create  a mesh with the geometry and material

    let material = new THREE.MeshPhongMaterial({
        color: 0xFF0000,
        side: THREE.DoubleSide,
        transparent: true, opacity: 1,depthTest: false
    });

    let cube = new THREE.Mesh(geometry2, material);

    // convert the cube to a Threebox object and set its coordinates
    let longitude;
    let latitude;
    if(!lng && !lat){
        longitude=startLongitude;
        latitude=startLatitude;

    }else{
        longitude=lng;
        latitude=lat;

    }
    const height=17;
    let cubeOrigin = [longitude ,latitude, height];
    
    cube = tb
        .Object3D({ obj: cube, units: 'meters', bbox: false })
        .setCoords(cubeOrigin);
    
    // add the cube to the Threebox scene.
    tb.add(cube);
    
    
    const geometrySphere =  new THREE.SphereGeometry( 10 ); 
    geometrySphere.computeBoundingSphere();
    const materialSphere = new THREE.MeshPhongMaterial({
        color: 0xFFFF00,
        side: THREE.DoubleSide,
        transparent: true, opacity: 0.05 
    });

    //sphere obj created
    let Esphere = new THREE.Mesh(geometrySphere, materialSphere);
    
    let EsphereOrigin = [longitude-.0001 ,latitude-.0001, 10];
    Esphere = tb
        .Object3D({ obj: Esphere, units: 'meters', bbox: false })
        .setCoords(EsphereOrigin);
    // add the cube to the Threebox scene.
    //allows the sphere to raycast
    
    let Espherebound=new THREE.Sphere(Esphere.position.clone(),height-7);

    tb.add(Esphere);

    enemyData['Esphere']=Esphere;
    enemyData['Espherebound']=Espherebound;

    const geometryEnemyBox = new THREE.BoxGeometry(1, 150, 1);
    const materialEnemyBox = new THREE.MeshPhongMaterial({
        color: 0xFFFF00,
        side: THREE.DoubleSide,
        transparent: true, opacity: 1 ,depthTest: false
    });

    let enemyBox = new THREE.Mesh(geometryEnemyBox, materialEnemyBox);
    let EBoxOrigin = [longitude ,latitude+.00001, height+2];
    enemyBox = tb
        .Object3D({ obj:enemyBox, units: 'meters', bbox: false })
        .setCoords(EBoxOrigin);
    let enemyBoxBB=new THREE.Box3(new THREE.Vector3(),new THREE.Vector3());
    enemyBoxBB.setFromObject(enemyBox);
    tb.add(enemyBox);

    enemyData['enemyBoxBB']=enemyBoxBB;
    enemyData['enemyBox']=enemyBox;

    enemyObjects.push(enemyData);

    //animateing and constantly checking if obj intersectss
    buildingsGroup.add(cube);

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
        .setCoords(cubeOrigin);
    //tb.add(line);

    // use raycaster to detect intersections with children of the buildingsGroup object
    // true parameter indicates the method should check all descendants, not just direct children.

    intersects = raycaster.intersectObjects(
        buildingsGroup.children,
        true
    );
    console.log(intersects);
    enemies= true;

    // log the intersections to the console for debugging
    // console.log('intersects', intersects);
    
}

function pointsLayer(map) {
    map.on('load', () => {
        map.addSource('geojson', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
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
}

// iniialize threebox with the Mapbox GL JS map instance
function initializeThreeJS(map) {
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
    generateDroneCube(tb);
    map.on('click', (e) => {
        handleMapClick(e, map, tb);
    });
}

export { initializeThreeJS };
