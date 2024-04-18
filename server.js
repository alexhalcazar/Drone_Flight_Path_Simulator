const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, 'frontend'), { extensions: ['gltf'] }));

// Setup API endpoint
const weatherRouter = require('./backend/api/weather');
app.use('/api', weatherRouter);
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
