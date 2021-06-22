const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://www.444.cl:27017';

// Database Name
const dbName = 'yt';

// Use connect method to connect to the server
MongoClient.connect(url, (err, client) => {
  if (err) {
    console.log(err);
  }
  console.log('Connected correctly to server');

  const db = client.db(dbName);
});
