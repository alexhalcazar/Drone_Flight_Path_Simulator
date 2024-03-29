export let drone;
export let droneCoordinates = [-118.14889916, 34.0681985, 9];

export function addDrone(map, tb) {
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
                    obj: '../../frontend/scene.gltf',
                    type: 'gltf',
                    scale: { x: scale, y: scale, z: 10 },
                    units: 'meters',
                    rotation: { x: 90, y: 0, z: 0 }
                };

                tb.loadObj(options, (model) => {
                    model.setCoords(droneCoordinates);
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