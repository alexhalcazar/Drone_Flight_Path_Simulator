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

let ruler = false;
let drone;
let altitude = 0;
let droneX = -118.148512;
let droneY = 34.065868;
let lat;
let lng;

function addBuildingToThreeJS(feature) {
    // Extracting geometry and properties
    const coordinates = feature.geometry.coordinates[0];
    const properties = feature.properties;
    const height = properties.height || 5; // Default height if not specified

    //console.log(coordinates);
    //console.log(properties);
    //console.log(height);

    // Create Three.js mesh with this data
    // need to write function to createBuildingMesh.
    const mesh = createBuildingMesh(coordinates, height);
    // console.log(mesh);
    // scene.add(mesh);
}
// Will come back to this
function createBuildingMesh(coordinates, height) {
    const vertices = [];
    coordinates.forEach((coordinate) => {
        vertices.push(coordinate[0], coordinate[1], height);
    });
    //console.log('vertices', vertices);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
    );
    const material = new THREE.MeshBasicMaterial({ color: 0x9900cc });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

function convertLonLat(lon, lat) {
    const radius = 6371; // Earth's radius in kilometers
    //const x = lon * (radius * Math.cos(lat));
    //const y = lat * radius;

    const x = radius * Math.cos(lat) * Math.cos(lon)

    const y = radius * Math.cos(lat) * Math.sin(lon)

    const z = radius * Math.sin(lat)

    return {x, y, z};
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

        const geometry = new THREE.BoxGeometry(5, 5, 5);
        geometry.translate(-65, 0, 0);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000
        });
        const cube = new THREE.Mesh(geometry, material);

        const enemyCube = new THREE.BoxGeometry(5, 5, 5);
        enemyCube.translate(15, 0, 0);
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

        const height = 10;
        // const polygon = [
        //     -118.14836874604225,
        //     34.066348626305114,
        //     height,
        //     -118.14836338162422,
        //     34.06633751673586,
        //     height,
        //     -118.1483781337738,
        //     34.06633196195068,
        //     height,
        //     -118.14836204051971,
        //     34.06629752227448,
        //     height,
        //     -118.14834997057915,
        //     34.06630196610445,
        //     height,
        //     -118.14833387732506,
        //     34.06626641545813,
        //     height,
        //     -118.14846128225327,
        //     34.06622419904626,
        //     height,
        //     -118.14847335219383,
        //     34.066249751087554,
        //     height,
        //     -118.14849078655243,
        //     34.06624308533837,
        //     height,
        //     -118.14853236079216,
        //     34.066330850993594,
        //     height,
        //     -118.14847871661186,
        //     34.066348626305114,
        //     height,
        //     -118.14836874604225,
        //     34.066348626305114,
        //     height
        // ];

        const polygon = [
            { lon: -118.14836874604225, lat: 34.066348626305114 },
            { lon: -118.14836338162422, lat: 34.06633751673586 },
            { lon: -118.1483781337738, lat: 34.06633196195068 },
            { lon: -118.14836204051971, lat: 34.06629752227448 },
            { lon: -118.14834997057915, lat: 34.06630196610445 },
            { lon: -118.14833387732506, lat: 34.06626641545813 },
            { lon: -118.14846128225327, lat: 34.06622419904626 },
            { lon: -118.14847335219383, lat: 34.066249751087554 },
            { lon: -118.14849078655243, lat: 34.06624308533837 },
            { lon: -118.14853236079216, lat: 34.066330850993594 },
            { lon: -118.14847871661186, lat: 34.066348626305114 },
            { lon: -118.14836874604225, lat: 34.066348626305114 }
        ];

        const cartesianVertices = polygon.map(({lon, lat}) => {
            const {x, y, z} = convertLonLat(lon, lat);
            return [x,y,z];
        });

        

        

        const materialLine = new THREE.LineBasicMaterial({
            color: 0xff0000
        });

        const points = [];
        points.push(new THREE.Vector3(-65, 0, 0));
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(15, 0, 0));

        const geometryLine = new THREE.BufferGeometry().setFromPoints(points);

        const line = new THREE.Line(geometryLine, materialLine);
        line.name='line';
        // I use a line to visibly see what the direction of the vector will be on the map
        // You must comment the following line out if you wish to determine if cube can see cube2
        

        const a=118.14;
        const b=34.06;
        const mill=100000;

        const c= 1;

        const d= 2;
        const e=-2;


        //coordinates of buildings
        const coordx=845;

        const coordy= 628;
        const coordz= 0;
        const shape = new THREE.Shape();

        
        
        shape.moveTo( mill*(a-118.14836874604225),mill*( b- 34.066348626305114));
        shape.lineTo(mill*(a-118.14836874604225),mill*( b- 34.066348626305114));

        
        shape.lineTo(mill*(a-118.14836338162422),mill*( b-34.06633751673586));
        shape.lineTo(mill*(a-118.1483781337738),mill*( b-34.06633196195068));
        shape.lineTo(mill*(a-118.14836204051971),mill*(b- 34.06629752227448));
        shape.lineTo(mill*(a-118.14834997057915),mill*(b- 34.06630196610445));
        shape.lineTo(mill*(a-118.14833387732506),mill*(b- 34.06626641545813));
        shape.lineTo(mill*(a-118.14846128225327),mill*(b-34.06622419904626));
        shape.lineTo(mill*(a-118.14847335219383),mill*(b-34.066249751087554));
        shape.lineTo(mill*(a-118.14849078655243),mill*(b- 34.06624308533837));
        shape.lineTo(mill*(a-118.14853236079216),mill*(b- 34.066330850993594));
        shape.lineTo(mill*(a-118.14847871661186),mill*(b- 34.066348626305114));
        shape.lineTo(mill*(a-118.14836874604225),mill*(b- 34.066348626305114));
        



        //shape.lineTo(mill*(a-118.14836874604225),mill*( b- 34.066348626305114));
        
        
        
        const extrudeSettings = { 
            depth: 2, 
            bevelEnabled: false, 
            bevelSegments: 2, 
            steps: 2, 
            bevelSize: 1, 
            bevelThickness: 1 
        };
        
        const geome = new THREE.ExtrudeGeometry( shape, extrudeSettings );
        
        var mater = new THREE.MeshPhongMaterial ({ color: 0x00ff00});

        geome.translate(coordx,coordy, coordz);
        const mash = new THREE.Mesh( geome, mater);
        //mash.rotation.z = Math.PI / d;
        mash.rotation.y = Math.PI / c;
        mash.rotation.x = Math.PI / e;
        scene.add(mash);




        const shape2 = new THREE.Shape();

        
        
        shape2.moveTo( mill*(a-118.14849346876144),mill*( b- 34.06647749720203));
        shape2.lineTo(mill*(a-118.14849346876144),mill*( b- 34.06647749720203));

        shape2.lineTo(mill*(a-118.1484854221344),mill*( b-34.0664619438283));
        shape2.lineTo(mill*(a-118.1484505534172),mill*( b- 34.066473053381245));
        shape2.lineTo(mill*(a-118.14843580126762),mill*( b-34.06644416854057));
        shape2.lineTo(mill*(a-118.14838483929634),mill*( b-34.066460832872934));
        shape2.lineTo(mill*(a-118.14838081598282),mill*( b-34.0664530561849));
        shape2.lineTo(mill*(a-118.14834460616112),mill*( b-34.066465276694345));
        shape2.lineTo(mill*(a-118.14832583069801),mill*( b-34.06642528229327));
        shape2.lineTo(mill*(a-118.14836204051971),mill*( b-34.066413061778064));
        shape2.lineTo(mill*(a-118.14835801720619),mill*( b-34.066404174129545));
        shape2.lineTo(mill*(a-118.1485404074192),mill*( b-34.06634418247759));
        shape2.lineTo(mill*(a-118.14856722950935),mill*( b-34.0664008412611));
        shape2.lineTo(mill*(a-118.14854308962822),mill*( b-34.066408617953925));


        shape2.lineTo(mill*(a-118.14856454730034),mill*( b-34.06645416714038));
        shape2.lineTo(mill*(a-118.14849346876144),mill*( b-34.06647749720203));
        shape2.lineTo(mill*(a-118.14849346876144),mill*( b- 34.06647749720203));
        
        
        
        const geome2 = new THREE.ExtrudeGeometry( shape2, extrudeSettings );
        
        var mater = new THREE.MeshPhongMaterial ({ color: 0x00ff00});

        geome2.translate(coordx,coordy, coordz);
        const mash2 = new THREE.Mesh( geome2, mater);
        //mash2.rotation.z = Math.PI / d;
        mash2.rotation.y = Math.PI / c;
        mash2.rotation.x = Math.PI / e;
        scene.add(mash2);

        

        
        
        const shape3 = new THREE.Shape();

        shape3.moveTo( mill*(a-118.14826413989067),mill*( b-34.06642417133742));


        shape3.lineTo(mill*(a-118.14826413989067),mill*( b- 34.06642417133742));
        shape3.lineTo(mill*(a-118.14823731780052),mill*( b-34.0663675125695));
        shape3.lineTo(mill*(a-118.14831241965294),mill*( b- 34.06634196056372));
        shape3.lineTo(mill*(a-118.1483405828476),mill*( b-34.06639861934873));
  
        shape3.lineTo(mill*(a-118.14826413989067),mill*( b-34.06642417133742));
        

        const geome3 = new THREE.ExtrudeGeometry( shape3, extrudeSettings );
        
        var mater = new THREE.MeshPhongMaterial ({ color: 0x00ff00});

        geome3.translate(coordx,coordy, coordz);
        const mash3 = new THREE.Mesh( geome3, mater);
        //mash3.rotation.z = Math.PI / d;
        mash3.rotation.y = Math.PI / c;
        mash3.rotation.x = Math.PI / e;
        scene.add(mash3);
       


        const shape4 = new THREE.Shape();

        shape4.moveTo( mill*(a-118.1481796503067),mill*( b-34.0664519452294));
        shape4.lineTo(mill*(a-118.1481796503067),mill*( b- 34.0664519452294));
        
        
        shape4.lineTo(mill*(a-118.14810454845428),mill*( b-34.066450834273894));
        shape4.lineTo(mill*(a-118.14810454845428),mill*( b-34.06639639743631));
        shape4.lineTo(mill*(a-118.1481796503067),mill*( b-34.06639639743631));
  
        shape4.lineTo(mill*(a-118.1481796503067),mill*( b-34.0664519452294));
        

        const geome4 = new THREE.ExtrudeGeometry( shape4, extrudeSettings );
        
        var mater = new THREE.MeshPhongMaterial ({ color: 0x00ff00});

        geome4.translate(coordx,coordy, coordz);
        const mash4 = new THREE.Mesh( geome4, mater);
        //mash3.rotation.z = Math.PI / d;
        mash4.rotation.y = Math.PI / c;
        mash4.rotation.x = Math.PI / e;
        scene.add(mash4);


        const shape5 = new THREE.Shape();

        shape5.moveTo( mill*(a-118.1479261815548),mill*( b-34.06643750280672));


        shape5.lineTo(mill*(a-118.1479261815548),mill*( b-34.06643750280672));

        shape5.lineTo(mill*(a-118.1479261815548),mill*( b-34.066380844047714));
        shape5.lineTo(mill*(a-118.1479087471962),mill*( b-34.066380844047714 ));
        shape5.lineTo(mill*(a-118.1479087471962),mill*( b- 34.06632751812228));
        shape5.lineTo(mill*(a-118.14803883433342),mill*( b-34.06632751812228 ));
        shape5.lineTo(mill*(a-118.14803883433342),mill*( b- 34.066376400221884));
        shape5.lineTo(mill*(a-118.14802139997482),mill*( b- 34.066376400221884));
        shape5.lineTo(mill*(a-118.14802139997482),mill*( b- 34.06639306456755));
        shape5.lineTo(mill*(a-118.14802944660187),mill*( b- 34.06639306456755));
        shape5.lineTo(mill*(a-118.14802944660187),mill*( b- 34.066418616557925));
        shape5.lineTo(mill*(a-118.14802274107933),mill*( b-  34.066418616557925));
        shape5.lineTo(mill*(a-118.14802274107933),mill*( b- 34.06643750280672));
        shape5.lineTo(mill*(a-118.1479261815548),mill*( b- 34.06643750280672));
        
        

        const geome5 = new THREE.ExtrudeGeometry( shape5, extrudeSettings );
        
        var mater = new THREE.MeshPhongMaterial ({ color: 0x00ff00});

        geome5.translate(coordx,coordy, coordz);
        const mash5 = new THREE.Mesh( geome5, mater);
        //mash3.rotation.z = Math.PI / d;
        mash5.rotation.y = Math.PI / c;
        mash5.rotation.x = Math.PI / e;
        scene.add(mash5);




        const shape6 = new THREE.Shape();

        shape6.moveTo( mill*(a-118.14800798892975),mill*( b-34.066313075678366));
        shape6.lineTo(mill*(a-118.14800798892975),mill*( b- 34.066313075678366));
        
        
        shape6.lineTo(mill*(a-118.14800798892975),mill*( b-34.066295300359414));
        shape6.lineTo(mill*(a-118.14792349934578),mill*( b-34.06629641131694));
        shape6.lineTo(mill*(a-118.14792349934578),mill*( b-34.06626308258427));
        shape6.lineTo(mill*(a-118.14782962203026),mill*( b-34.066265304500206));
        shape6.lineTo(mill*(a-118.14782828092575),mill*( b-34.06619198124412));
        shape6.lineTo(mill*(a-118.14800798892975),mill*( b-34.06619198124412));
        shape6.lineTo(mill*(a-118.14800798892975),mill*( b-34.06618975932628));
        shape6.lineTo(mill*(a-118.14802542328835),mill*( b-34.06618975932628));
        shape6.lineTo(mill*(a-118.14802542328835),mill*( b-34.06618309357239));
        shape6.lineTo(mill*(a-118.14809113740921),mill*( b-34.06618309357239));
        shape6.lineTo(mill*(a-118.14809113740921),mill*( b-34.066210867543404));
        shape6.lineTo(mill*(a-118.14806699752808),mill*( b-34.066210867543404));
        shape6.lineTo(mill*(a-118.14806699752808),mill*( b-34.06623864150531));
        shape6.lineTo(mill*(a-118.14806029200554),mill*( b-34.06623864150531));
        shape6.lineTo(mill*(a-118.14806029200554),mill*( b-34.06624864012939));
        shape6.lineTo(mill*(a-118.14808309078217),mill*( b-34.06624864012939));
        shape6.lineTo(mill*(a-118.1481085717678),mill*( b-34.066274192163306));
        shape6.lineTo(mill*(a-118.1481085717678),mill*( b-34.06631196472105));
        shape6.lineTo(mill*(a-118.14800798892975),mill*( b-34.066313075678366));
        
        

        const geome6 = new THREE.ExtrudeGeometry( shape6, extrudeSettings );
        
        var mater = new THREE.MeshPhongMaterial ({ color: 0x00ff00});

        geome6.translate(coordx,coordy, coordz);
        const mash6 = new THREE.Mesh( geome6, mater);
        //mash3.rotation.z = Math.PI / d;
        mash6.rotation.y = Math.PI / c;
        mash6.rotation.x = Math.PI / e;
        scene.add(mash6);

















        const raycaster = new THREE.Raycaster();
        // Using the actual position of the cubes did not work for some reason so I had to hard code the origin of both cubes
        raycaster.set(points[0], points[1].clone().sub(points[0]).normalize());
        let intersections = raycaster.intersectObjects(scene.children, true);
        // A raycaster goes through all objects so there is no way to block line of sight
        // Therefore we added a name attribute to cube2's object and check if the first intersection is the cube2's name
        if (intersections[0].object.name === 'cube2') {
            console.log('entered');
            console.log(intersections[0].object);
            //console.log(intersections[1].object);
            
        } else {
            console.log('not entered');
            console.log(intersections[0].object);
        }
        scene.add(line);
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
                'fill-extrusion-color': '#aaa',

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
        console.log('Building Geometry:', e.features[0].geometry);
        if (e.features.length > 0) {
            const feature = e.features[0];
            addBuildingToThreeJS(feature);
            console.log(feature);
            //console.log('clicked');
        }
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
        { method: 'GET' }
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
