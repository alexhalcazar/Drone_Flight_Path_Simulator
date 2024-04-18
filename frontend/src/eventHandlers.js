import {drone, startLongitude, startLatitude, startAltitude } from "../../backend/threejs/drone.js"
import { cube2 } from "../../backend/threejs/threejsSetup.js";
import { sphere } from "../../backend/threejs/threejsSetup.js";
import { droneCoordPath } from "../../backend/threejs/measurePoints.js";
import { getWindSpeed } from "../../backend/api/weather.js";
import { lng, lat } from "./mapClickHandlers.js";
import { drones } from "../../backend/droneData/droneData.js";
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
    sphere.followPath(
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

document.querySelector('#drones-drop-down').addEventListener('change', () => {
    const dropdown = document.getElementById("drones-drop-down");
    const name = dropdown.value;

    let noiseLevel;
    let range;
    let endurance;
    let maxAltitude;

    for (let i = 0; i < drones.length; i++) {
        if (name === drones[i].name) {
             noiseLevel = drones[i].noiseLevel;
             range = drones[i].range;
             endurance = drones[i].endurance;
             maxAltitude = drones[i].maxAltitude;
        }
    }

    document.getElementById("meters").innerHTML = maxAltitude + "  meters";
    document.getElementById("dB").innerHTML = noiseLevel + "  dB";
    document.getElementById("km").innerHTML = range + "  km";
    document.getElementById("min").innerHTML = endurance + "  min";
})
