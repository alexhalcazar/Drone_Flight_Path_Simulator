const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files
app.use(express.static(path.resolve(__dirname, 'public')));
app.use('/data', express.static(path.resolve(__dirname, 'data'), { extensions: ['geojson'] }));
app.use('/drone', express.static(path.resolve(__dirname, 'drone'), { extensions: ['gltf'] }));

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});