const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/mydb";
const opts = {useUnifiedTopology: true};

MongoClient.connect(url, opts, (err, db) => {
  if (err) throw err;
  console.log('DB created.');
  db.close();
});

MongoClient.connect(url, opts, (err, db) => {
  if (err) throw err;
  const dbo = db.db('mydb');
  dbo.createCollection('games', (err, res) => {
    if (err) throw err;
      console.log('Game collection created.');
      db.close();
  });
});
