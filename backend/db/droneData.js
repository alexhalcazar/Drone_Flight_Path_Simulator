// This file contains the drone object that will be created to display
// each drone's information and then stored into our database

function droneData(model, noiseLevel, range, endurance, maxAltitude) {
    this.model = model,
    this.noiseLevel = noiseLevel,
    this.range = range,
    this.endurance = endurance,
    this.maxAltitude = maxAltitude
};