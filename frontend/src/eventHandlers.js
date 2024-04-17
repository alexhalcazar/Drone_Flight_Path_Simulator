import {drone} from "../../backend/threejs/drone.js"
import { cube2 } from "../../backend/threejs/threejsSetup.js";
import { sphere } from "../../backend/threejs/threejsSetup.js";
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

    //let sphereCoordPath=[];
    
    //console.log(droneCoordPath[0][0]+20000);
    // for(let i=0;i<droneCoordPath.length;i++){
        
       

    //     //droneCoordPath[i][0]+=200;
    //     //droneCoordPath[i][1]+=200;
        
    //     let point= droneCoordPath[i][0];
    //     let point2= droneCoordPath[i][1];

    //     point-=0.0001;
    //     point2-=0.0001;
    //     let innerarr=[point,point2,droneCoordPath[i][2]];
    //     sphereCoordPath.push(innerarr);

    // }
    // const options2 = {
    //     path: sphereCoordPath,
    //     duration: 10000
    // }


    // start the drone animation with above options, and remove the line when animation ends
    drone.followPath(
        options
    );

    cube2.followPath(
        options
    );
    sphere.followPath(
        options
    );
});

document.querySelector('#btn-reset-drone').addEventListener('click', () => {
    drone.setCoords([-118.148512, 34.065868]);
});
