import express from 'express';
import bodyParser from 'body-parser';

// MongoDB setup.
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://localhost:27017/';
const opts = {useUnifiedTopology: true};

// App creation.
const app = express();
const port = 5005;
const clientRoot = __dirname + '/client/';
const jsonParser = bodyParser.json();

// Include the JS client.
app.use('/js', express.static('client/js'));

// Serve the JS client
app.get('/', (req, res) => {
  res.sendFile(clientRoot + 'index.html');
});

// Server ping
app.post('/game/ping', (req, res) => {
  res.send({pong: 'pong'});
});

app.listen(port, () => {
  console.log(`Server running at localhost:${port}/`);
});
