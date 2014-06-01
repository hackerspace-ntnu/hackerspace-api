var mongo = require('mongodb'),
    config = require('../config.js'),
    gcm = require('node-gcm'),
    util = require('util'),
    http = require('http'), 
    url = require('url'),
    qs = require('querystring'),
    Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('hackerspacedb', server);


db.open(function (err) {
  if (!err) 
    console.log("Connected to 'hackerspacedb' database.");
    db.collection('androidids', {strict: true}, function (err, collection) {
      if (err) {
        console.log('DB Error: '+ err);
      }
    });
  });


exports.register = function(request, response){
  ID = request.body.registrationId;
  console.log('Registering new device: '+ ID);

  if(!ID){
    response.send('No ID!');
    return;
  }

  var deviceID = {registrationId: ID};
  db.collection('androidids', function (err, collection) {
    collection.insert(deviceID, {safe: true}, function (err, record) {
      if (err) {
        response.send({'error': 'An error has occured'});
        console.log(err);
      } else {
        console.log('Added new DB record:  ' + record[0]);
        response.send('Registered');
      }
    })
  })
}


exports.send = function(msg){
  var message = new gcm.Message();

  // or with object values
  var message = new gcm.Message({
    collapseKey: 'demo',
    delayWhileIdle: false,
    timeToLive: 3,
    data: {
      message: msg
    } 
  });

  var sender = new gcm.Sender(config.gcm.sender);

  db.collection('androidids', function (err, collection){
    console.log('Opened androidids');
    collection.find().toArray(function(err, items){
      var registrationIds = [];
      var BUCKET_SIZE = 1000; //gcm can send to max 1000 receipients per msg
      for(var i = 0; i <= Math.floor(items.length/BUCKET_SIZE); i++){
        registrationIds[i] = [];
        console.log('Preparing message batch nr. ' + Math.floor(items.length/BUCKET_SIZE));
      }
      for(var i = 0; i < items.length; i++){
        var item = items[i];
        if(item && item.registrationId){
          registrationIds[Math.floor(i/BUCKET_SIZE)].push(item.registrationId);
        }

      }

      for(var i = 0; i < registrationIds.length; i++){
        // Params: message-literal, registrationIds-array, No. of retries, callback-function
        sender.send(message, registrationIds[i], 4, function (err, result) {
        console.log(result);
        });
      }   
    });

 });
}

