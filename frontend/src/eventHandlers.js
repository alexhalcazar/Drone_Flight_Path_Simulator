import {drone} from "../../backend/threejs/drone.js"
import { droneCoordPath } from "../../backend/threejs/measurePoints.js";
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
});

document.querySelector('#btn-reset-drone').addEventListener('click', () => {
    drone.setCoords([-118.148512, 34.065868]);
});
