const {mongoConfig:url} = require('./config.js');
const MongoClient = require('mongodb').MongoClient;
console.log(url);

// Database Name
const dbName = 'yt';

// Use connect method to connect to the server
MongoClient.connect(url, {
	   useNewUrlParser: true,
	   useUnifiedTopology: true
	 },(err, client) => {
  if (err) {
    console.log(err);
  }
  console.log('Connected correctly to server');

  const db = client.db(dbName);
	db.listCollections()
	            .toArray().then(x=>console.log(x));
});
