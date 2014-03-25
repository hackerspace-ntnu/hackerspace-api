var express = require('express')
  , door = require('./routes/door.js')
  , app = express();

app.configure(function () {
  app.use(express.logger('dev')); /* 'default', 'short', 'tiny', 'dev' */
  app.use(express.bodyParser());
});

app.get('/door', door.isOpen);
app.post('/door', door.opened);
app.put('/door', door.closed);

app.listen(3000);
console.log('Listen on port 3000...')
