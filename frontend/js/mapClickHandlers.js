import { rangeKM, rangeMI, droneSelected } from './threejsHandler.js';

const droneCoordPath = [];

let lng;
let lat;
let ruler = false;

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

// Distance experiment
const dtstnceDisplay = document.getElementById('dtstnce');
const dtstnceDisplay_B = document.getElementById('dtstnce-b');
const lngDisplay = document.getElementById('lng');
const latDisplay = document.getElementById('lat');
const eleDisplay = document.getElementById('ele');

// Variables to store km and distance of path to call in remaining drone distance function
let droneMI;
let droneKM;
let remainingDistanceKM;
let remainingDistanceMI;
let numOfPoints = 0;
const droneDistanceKM = document.getElementById('drone-distance-km');
const droneDistanceMI = document.getElementById('drone-distance-mi');

document.querySelector('#btn-ruler-on').addEventListener('click', (e) => {
    // ruler = true;
    let outputDiv = document.getElementById('output');
    // outputDiv.innerHTML = 'Ruler On';

    if(ruler === false){
        ruler = true;
        let outputDiv = document.getElementById('output');
        outputDiv.innerHTML = 'Ruler On';
        // innerHTML = 'Ruler Off';
        return e.target.innerHTML= 'Ruler Off';
    }
    else{
        ruler = false;
        let outputDiv = document.getElementById('output');
        outputDiv.innerHTML = 'Ruler Off';
        // this.innerHTML = 'Ruler On';
        return e.target.innerHTML = 'Ruler On';
    }

});

// document.querySelector('#btn-ruler-off').addEventListener('click', () => {
//     ruler = false;
//     let outputDiv = document.getElementById('output');
//     outputDiv.innerHTML = 'Ruler Off';
// });

async function getElevation() {
    // Construct the API request.
    mapboxgl.accessToken = 'pk.eyJ1IjoibXljc2FsIiwiYSI6ImNsc2RtM2tvdzEyNnIybXQwcjI5d2tqcjAifQ.SqGe3A-JLNSkTCYluSpRnA';
    
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

// Adds points to the map for the drone route when a user clicks 
function measurePoints(e, map, tb, lng, lat) {
    let popup;
    let startPoint;

    if (ruler) {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['measure-points']
        });

        // Remove the linestring from the group
        // so we can redraw it based on the points collection.
        if (geojson.features.length > 1) geojson.features.pop();

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
                    coordinates: [lng, lat]
                },
                properties: {
                    id: String(new Date().getTime())
                }
            };

            geojson.features.push(point);

            // Array storing each points coordinates
            droneCoordPath.push(point.geometry.coordinates);

            // Starting point for the popups 
            startPoint = [point.geometry.coordinates[0],point.geometry.coordinates[1]];
        }

        if (geojson.features.length > 1) {
            linestring.geometry.coordinates = geojson.features.map(
                (point) => point.geometry.coordinates
            );

            geojson.features.push(linestring);
            numOfPoints++;

            // Populate the distanceContainer with total distance
            const value_km = document.createElement('pre');
            const value_mi = document.createElement('pre');
            
            const distance_km = turf.length(linestring);
            const distance_mi = distance_km * 0.62137;

            droneMI = distance_mi;
            droneKM = distance_km;
			
	    dtstnceDisplay.textContent = `${distance_km.toLocaleString()} km`;
	    dtstnceDisplay_B.textContent = `${distance_mi.toLocaleString()} mi`;
        }

        map.getSource('geojson').setData(geojson);

        // Provides the coordinates of each point for the popup to input altitude
        // If there is only one point so far, startPoint is given
        // Otherwise the last element stored in linestring is given
        function popupAltitude (point) {
            if (linestring.geometry.coordinates.length < 1) {
                return startPoint;
            }
            else {
                return linestring.geometry.coordinates[linestring.geometry.coordinates.length-1];
            }
        }

        // Popup on each point that prompts user to each point altitude
        popup = new mapboxgl.Popup({ offset: 0 })
                .setLngLat(popupAltitude(linestring.geometry.coordinates))
                .setHTML(`
                <h2>Enter point's altitude</h2>
                <input id="altitude" style="width:100px" placeholder="meters"> 
                <button id="btn-altitude" style="width:70px">Enter</button>
                `)
                .addTo(map);

        // Gets user input from the popup for altitude and stores it in an array
        let userAltitude;
        document.querySelector("#btn-altitude").addEventListener("click", () => {
            userAltitude = document.querySelector("#altitude").value;
            addAltitude(userAltitude);
            calculateDroneRange(numOfPoints, droneKM, droneMI, userAltitude);
        });
        
        // Adds altitude values to each point's coordinates and draws elevated line
        // Also draws line connecting ground and air paths at each point
        function addAltitude (input) {
            droneCoordPath[droneCoordPath.length-1].push(input);

            // Line is made with altitude 
            let line;
            line = tb.line({
                geometry: droneCoordPath,
                width: 5,
                color: 'gold'
            })
            tb.add(line);

            // Removes altitude from the array so we have the ground path coordinates
            const slicedArray = droneCoordPath => droneCoordPath.slice(0,2),
            groundPath = droneCoordPath.map(slicedArray);
            let lineGeo;
            let line2;

            // lineGeo stores the coord of each matching ground/air point
            // Then a line is connected from the ground to the air paths at each point
            for (let i = 0; i < groundPath.length; i++) {
                lineGeo = [[groundPath[i]], [droneCoordPath[i]]];
                line2 = tb.line({
                    geometry: [lineGeo[0][0], lineGeo[1][0]],
                    width: 5,
                    color: 'steelblue'
                })
                tb.add(line2);
            }
         
        }

        // This function calculates the remaining drone range based on the plotted path
        // Altitude is converted from meters to mi/km
        function calculateDroneRange (numOfPoints, droneKM, droneMI, altitude) {
            let subtractDistanceKM;
            let subtractDistanceMI;
            let altitudeKM = altitude * 0.001;
            let altitudeMI = altitude * 0.000621371;
            remainingDistanceKM = rangeKM;
            remainingDistanceMI = rangeMI;
            
            if ( droneSelected == true && numOfPoints == 0) {
                remainingDistanceKM = rangeKM;
                remainingDistanceMI = rangeMI;
            } else if (droneSelected == true && numOfPoints >= 1) {
                subtractDistanceKM = Math.sqrt(Math.pow(droneKM, 2) + Math.pow(altitudeKM, 2));
                subtractDistanceMI = Math.sqrt(Math.pow(droneMI, 2) + Math.pow(altitudeMI, 2));
                remainingDistanceKM -= subtractDistanceKM;
                remainingDistanceMI -= subtractDistanceMI;
            }

            let roundedKM = Number(remainingDistanceKM).toFixed(3);
            let roundedMI = Number(remainingDistanceMI).toFixed(3);
            
            // After distance is calculated we update the distance values in the application
            droneDistanceKM.textContent = `${roundedKM} km`;
            droneDistanceMI.textContent = `${roundedMI} mi`;
        }

        // If a point is removed, remove the popup as well
        if (features.length) {
            const id = popup;
            geojson.features = geojson.features.filter(
                (point) => point.properties.id !== id
            );
        }

    } else {
        let outputDiv = document.getElementById('output');
        outputDiv.innerHTML = 'None';
    }
}

function handleMapClick(event, map, tb) {
    // When the map is clicked, set the lng and lat
    // equal to the lng and lat properties in the returned lngLat object.
    lng = event.lngLat.lng;
    lat = event.lngLat.lat;
    getElevation();
    measurePoints(event, map, tb, lng, lat);

}

export { handleMapClick, droneCoordPath, lng, lat };