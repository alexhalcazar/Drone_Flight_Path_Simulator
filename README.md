# Drone_Flight_Path_Simulator

Our project aims to design, implement, and test a 3D visualization architecture that allows operators in small military units to plan, visualize, and revise drone flight paths over a specific terrain to fulfill the mission success criteria of effectively utilizing sensors over an area while minimizing detection, and possibly susceptibility to countermeasures.

## Installation

1. Clone the Repository:

```bash
git clone https://github.com/alexhalcazar/Drone_Flight_Path_Simulator.git
cd Drone_Flight_Path_Simulator
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

While in the 'Drone_Flight_Path_Simulator' directory run the following command:

```bash
npm start
```

4. Access the server:

Open your web browser and navigate to [local host](http://localhost:3000/src/index.html). <br>
You can use this server to explore and interact with the web application.

## Features

The web application starts with a top down view of Alhambra, CA. <br>
Move the mouse and hold down the 'left click' to move around the map. <br>
Move the mouse and hold down the 'right click' to control the camera pitch. <br>
Use the mouse scroll to zoom in and out of the map. <br>

The left side bar contains the following buttons:

**Center on Church** - Centers the camera over Saint Thomas More Catholic School <br>
**Center on Run-Route** - Centers the camera over a custom run-route that wraps around Granada Park <br>
**Center on School** - Centers the camera over Fremont Elementary School <br>
**Ruler On** - When this button is clicked the display box inside the side bar will indicate 'Ruler On' and <br>
any left clicks on the map will start to generate points. Each succesive point will add a distance equal generating a total distance. <br>
Clicking on a point will delete that point. <br>
**Ruler Off** - Will disable the ruler which is indicated in the display box by 'Ruler Off' allowing you to resume regular controls. <br>
**Move** - Clicking this button while there are at least 2 or more points will move the 3D model drone located on Fremont Ave between <br>
San Clemente Ave and Las Flores St will begin to move the drone to the points in the order the points were placed. <br>
**Reset** - Will reset the drone to its original starting space. <br>

## Reporting Issues

If you encounter any issues or have suggestions for improvement, please [create an issue](https://github.com/alexhalcazar/Drone_Flight_Path_Simulator/issues)

## 3D Drone License

The 3D drone model's licensing can be viewed under '/drone/license.txt'

## Authors

Alex Alcazar, Francisco Brito, Helen Dam, Alex Gaeta, Alberto Gonzalez, Sergio Maradiaga, Thaddeus Owens, Mychal Salgado, Kevin Tang, Sergio Valadez
