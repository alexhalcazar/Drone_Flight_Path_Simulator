require('dotenv').config();

// weather router
const router = require('express').Router();

//define your API endpoint
router.get('/weather', async (req, res) => {
    const longitude = req.query.longitude;
    const latitude = req.query.latitude;
    const windSpeed = await getWindSpeed(longitude, latitude);
    res.json({ windSpeed });
});

module.exports = router;

// gets wind speed at 10m above ground 
const getWindSpeed = async (longitude, latitude) => {

    const username = process.env.METEOMATICS_USERNAME
    const password = process.env.METEOMATICS_PASSWORD
    const currentDate = new Date();
    const formatDate = currentDate.toISOString();
 
    try {
        const token = await fetchToken(username, password);
        const response = await fetch(`https://api.meteomatics.com/${formatDate}/wind_speed_10m:ms/${latitude},${longitude}/json?access_token=${token}`);
        if (!response.ok) {
            throw new Error('Failed to fetch wind spped data');
        }
        const res = await response.json();
        return res.data[0].coordinates[0].dates[0].value;
    }
    catch (error) {
        console.error(error);
    }
}

const fetchToken = async (username, password) => {
    
    let headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ":" + password));

    try {
        const response = await fetch('https://login.meteomatics.com/api/v1/token', {
            method: 'GET', headers: headers
        });
        if(!response.ok) {
            throw new Error('Failed to fetch access token');
        }
        const data = await response.json();
        if (!data || !data.access_token) {
            throw new Error('Token not found in response data');
        }
        return data.access_token;
    }
    catch (error){
        console.error('Error in fetchToken:', error);
    }
}
