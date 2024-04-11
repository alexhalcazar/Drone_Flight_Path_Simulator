// Connects us to our localhost database
// Database in its current iteration is stored locally
// Therefore everyone needs to follow the instructions in
// db.txt to setup the db on their machines

const { Client } = require('pg')
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'SUAS Flight Path Visualizer',
  password: '9263',
  port: 5432,
})
client.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});