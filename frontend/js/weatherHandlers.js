import { lng, lat } from "./mapClickHandlers.js";
import { startLongitude, startLatitude } from "./drone.js";

document.querySelector('#weather').addEventListener('click', async () => {
    try {
        let longitude;
        let latitude;

        if(lng && lat) {
            longitude = lng;
            latitude = lat;
        } else {
            longitude = startLongitude;
            latitude = startLatitude;
        }
        const response = await fetch(`http://localhost:3000/api/weather?longitude=${longitude}&latitude=${latitude}`);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        // Handle the API response data here
        const windDisplay = document.getElementById('wind');
        windDisplay.textContent = data.windSpeed;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});
