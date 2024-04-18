import {drone, startLongitude, startLatitude, startAltitude } from "../../backend/threejs/drone.js"
import { cube2 } from "../../backend/threejs/threejsSetup.js";
import { droneCoordPath } from "../../backend/threejs/measurePoints.js";
import { getWindSpeed } from "../../backend/api/weather.js";
import { lng, lat } from "./mapClickHandlers.js";
export let ruler;

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
    // Data for the path that the drone will follow as well as the duration of the animation
    const options = {
        path: droneCoordPath,
        duration: 10000
    }

    // start the drone animation with above options, and remove the line when animation ends
    drone.followPath(
        options
    );

    droneCube.followPath(
        options
    );
});

document.querySelector('#btn-reset-drone').addEventListener('click', () => {
    drone.setCoords([startLongitude, startLatitude, startAltitude]);
    cube2.setCoords([startLongitude, startLatitude, startAltitude-2])

});

document.querySelector('#weather').addEventListener('click', async () => {

    let windSpeed;
    if(lng && lat){
        windSpeed = await getWindSpeed(lng, lat);
    } else {
        windSpeed = await getWindSpeed(startLongitude, startLatitude);
    }
    
    const windDisplay = document.getElementById('wind');
    windDisplay.textContent = windSpeed;
});