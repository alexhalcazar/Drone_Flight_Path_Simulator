# MyFirstMap

This project marks my first experience with Mapbox. I am developing a web application that will leverage the fundamental features of Mapbox. The aim is to gain familiarity with the platform and build a foundation for a more advanced project in the future.

## Installation

1. Clone the Repository:

```bash
git clone https://github.com/alexhalcazar/MyFirstMap.git
cd MyFirstMap
```

2. Install Dependencies:

The project relies on the following npm packages:

- [Express](https://www.npmjs.com/package/express/v/4.18.2)

Ensure you are in the 'MyFirstMap' directory and run the following command:

```bash
npm install
```

## Usage

3. Start the server:

While in the 'MyFirstMap' directory run the following command:

```bash
node server.js
```

4. Access the server:

Open your web browser and navigate to [http://localhost:3000]
You can use this server to explore and interact with the web application.

## Features

The web application starts with a top down view of Alhambra, CA.
Move the mouse and hold down the 'left click' to move around the map.
Move the mouse and hold down the 'right click' to control the camera pitch.
Use the mouse scroll to zoom in and out of the map.

The left side bar contains the following buttons:

Center on Church - Centers the camera over Saint Thomas More Catholic School
Center on Run-Route - Centers the camera over a custom run-route that wraps around Granada Park
Center on School - Centers the camera over Fremont Elementary School
Ruler On - When this button is clicked the display box inside the side bar will indicate 'Ruler On' and 
any left clicks on the map will start to generate points. Each succesive point will add a distance equal generating a total distance.
Clicking on a point will delete that point.
Ruler Off - Will disable the ruler which is indicated in the display box by 'Ruler Off' allowing you to resume regular controls.
Move - Clicking this button while there are at least 2 or more points will move the 3D model drone located on Fremont Ave between
San Clemente Ave and Las Flores St will begin to move the drone to the points in the order the points were placed.
Reset - Will reset the drone to its original starting space.

## Reporting Issues

If you encounter any issues or have suggestions for improvement, please [create an issue](https://github.com/alexhalcazar/MyFirstMap/issues)

## 3D Drone License

The 3D drone model's licensing can be viewed under '/drone/license.txt'

## Authors

Alex Alcazar