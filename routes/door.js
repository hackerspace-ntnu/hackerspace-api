var mongo = require('mongodb');
var gcm = require('./gcm.js');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('hackerspacedb', server);

db.open(function (err) {
  if (!err) {
    console.log("Connected to 'hackerspacedb' database.");
    db.collection('door', {strict: true}, function (err, collection) {
      if (err) {
        console.log('Collection does not exist, creating it.');
      }
    });
  }
});

exports.isOpen = function (req, res) {
  db.collection('door', function (err, collection){
    collection.find().sort({_id: -1}).limit(1).toArray(function (err, item) {
      item[0].isOpen = false;
      if (item[0].closed === undefined) {
        item[0].isOpen = true;
      }
      res.send(item);
    });
  });
}

exports.opened = function (req, res) {
  var open = {opened: Date.now()};
  db.collection('door', function (err, collection) {
    collection.insert(open, {safe: true}, function (err, result) {
      if (err) {
        res.send({'error': 'An error has occured'});
      } else {
        console.log('Success ' + result[0]);
        res.send(result[0]);
        //gcm.send("The door is open!");
      }
    })
  })
}

exports.closed = function (req, res) {
  db.collection('door', function (err, collection) {
    collection.find().sort({_id: -1}).limit(1).toArray(function (err, item) {
      collection.update({_id: item[0]._id}, {$set: {"closed": Date.now()}}, function (err, result){
        res.send(result)
      });
    })
  });
}

