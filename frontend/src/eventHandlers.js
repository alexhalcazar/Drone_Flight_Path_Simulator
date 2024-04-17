import {drone} from "../../backend/threejs/drone.js"
import { cube2 } from "../../backend/threejs/threejsSetup.js";
import { droneCoordPath } from "../../backend/threejs/measurePoints.js";
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

    cube2.followPath(
        options
    );
});

document.querySelector('#btn-reset-drone').addEventListener('click', () => {
    drone.setCoords([-118.148512, 34.065868]);
});

document.querySelector('#drones-drop-down').addEventListener('change', () => {
    const name = document.querySelector(".quantityDropdown select")
        [document.querySelector(".quantityDropdown select").selectedIndex].innerHTML;

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
        console.log(noiseLevel, range, endurance, maxAltitude);
    }
    document.getElementById("meters").innerHTML = noiseLevel;
    document.getElementById("dB").innerHTML = range;
    document.getElementById("km").innerHTML = endurance;
    document.getElementById("min").innerHTML = maxAltitude;
})