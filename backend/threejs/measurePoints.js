import {ruler} from "../../frontend/src/eventHandlers.js"
import { lng, lat } from "../../frontend/src/mapClickHandlers.js";
export const droneCoordPath = [];

// Distance experiment
const dtstnceDisplay = document.getElementById('dtstnce');
const dtstnceDisplay_B = document.getElementById('dtstnce-b');

// GeoJSON object to hold our measurement features
const geojson = {
    type: 'FeatureCollection',
    features: []
};

export const pointsLayer = (map) => {
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
}

// Used to draw a line between points
const linestring = {
    type: 'Feature',
    geometry: {
        type: 'LineString',
        coordinates: []
    }
};

let popup;
let startPoint;

// Adds points to the map for the drone route when a user clicks 
export const measurePoints = (e, map, tb) => {
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

            // Populate the distanceContainer with total distance
            const value_km = document.createElement('pre');
            const value_mi = document.createElement('pre');
            
            const distance_km = turf.length(linestring);
            const distance_mi = distance_km * 0.62137;
			
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

    
};


