// This file contains the drone object that will be created to display
// each drone's information

export const drones = [];

function droneData(name, noiseLevel, range, endurance, maxAltitude) {
    // Name of drone model
    this.name = name,
    // Measured in decibles
    this.noiseLevel = noiseLevel,
    // Measured in kilometers
    this.range = range,
    // Measured in minutes
    this.endurance = endurance,
    // Measured in meters
    this.maxAltitude = maxAltitude
};

const raven = new droneData("RQ-11 Raven", 70, 10, 90, 152);
const shadow = new droneData("RQ-7 Shadow", 70, 109.5, 360, 3200);
const puma = new droneData("RQ-20 Puma Raven", 70, 15, 120, 152);
const wasp = new droneData("RQ-12A Wasp III", 70, 5, 45, 300);

drones.push(raven, shadow, puma, wasp);
