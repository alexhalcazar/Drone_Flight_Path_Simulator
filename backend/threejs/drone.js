export function addDrone(map, tb) {
    map.on('load', function() {
        map.addLayer({
            id: 'drone',
            type: 'custom',
            renderingMode: '3d',
            onAdd: function () {
                // Creative Commons License attribution:  Metlife Building model by https://sketchfab.com/NanoRay
                // https://sketchfab.com/3d-models/metlife-building-32d3a4a1810a4d64abb9547bb661f7f3
                const scale = 3.2;
                const options = {
                    obj: '../../frontend/scene.gltf',
                    type: 'gltf',
                    scale: { x: scale, y: scale, z: 2.7 },
                    units: 'meters',
                    rotation: { x: 90, y: -90, z: 0 }
                };

                tb.loadObj(options, (model) => {
                    model.setCoords([-118.148512, 34.065868, 0]);
                    model.setRotation({ x: 0, y: 0, z: 250 });
                    tb.add(model);
                    // passModel(model);
                });
            },
            render: function(gl, matrix) {
                // updates Threebox scene
                tb.update();
            }
        });
    });
}