const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'frontend')));

app.use('/frontend', express.static(path.resolve(__dirname, 'frontend'), { extensions: ['gltf'] }));

app.get('/backend/src/main.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'backend', 'src', 'main.js'));
});
app.get('/backend/map/mapSetup.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'backend', 'map', 'mapSetup.js'));
});
app.get('/backend/threejs/threejsSetup.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'backend', 'threejs', 'threejsSetup.js'));
});
app.get('/backend/threejs/drone.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'backend', 'threejs', 'drone.js'));
});
app.get('/backend/threejs/measurePoints.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'backend', 'threejs', 'measurePoints.js'));
});
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});