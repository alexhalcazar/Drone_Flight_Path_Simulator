let startLongitude = -118.14889916;
let startLatitude = 34.0681985;
let startAltitude = 9;
let drone;
let droneCoordinates = [startLongitude, startLatitude, startAltitude];
const drones = [];
let droneCurrentLocation;

function addDrone(map, tb) {
    map.on('load', function() {
        map.addLayer({
            id: 'drone',
            type: 'custom',
            renderingMode: '3d',
            onAdd: function () {
                // Creative Commons License attribution:  Metlife Building model by https://sketchfab.com/NanoRay
                // https://sketchfab.com/3d-models/metlife-building-32d3a4a1810a4d64abb9547bb661f7f3
                const scale = 6;
                const options = {
                    obj: '../scene.gltf',
                    type: 'gltf',
                    scale: { x: scale, y: scale, z: 10 },
                    units: 'meters',
                    rotation: { x: 90, y: 0, z: 0 }
                };

                tb.loadObj(options, (model) => {
                    model.setCoords(droneCoordinates);
                    model.addEventListener('ObjectChanged', wasPaused, false);
                    model.setRotation({ x: 0, y: 0, z: -20 });
                    tb.add(model);
                    drone = model;
                });
            },
            render: function(gl, matrix) {
                // updates Threebox scene
                tb.update();
            }
        });
    });
}

// Function gets drone current location while it moves along the flight path
// Refer to https://github.com/jscastro76/threebox/blob/HEAD/docs/Threebox.md#objectchanged
function wasPaused(e) {
    droneCurrentLocation = e.detail.action.position; 
}

function droneData(name, noiseLevel, range, endurance, maxAltitude) {
    // Name of drone model
    this.name = name,
    // Measured in decibles
    this.noiseLevel = noiseLevel,
    // Measured in kilometers
    this.range = range,
    // Measured in minutes
    this.endurance = endurance,
    // Measured in meters
    this.maxAltitude = maxAltitude
};

const raven = new droneData("RQ-11 Raven", 70, 10, 90, 152);
const shadow = new droneData("RQ-7 Shadow", 70, 109.5, 360, 3200);
const puma = new droneData("RQ-20 Puma", 70, 15, 120, 152);
const wasp = new droneData("RQ-12A Wasp III", 70, 5, 45, 300);

drones.push(raven, shadow, puma, wasp);

export { drone, drones, droneCoordinates, addDrone, startLongitude, startLatitude, startAltitude, droneCurrentLocation };