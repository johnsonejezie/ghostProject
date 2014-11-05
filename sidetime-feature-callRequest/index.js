'use strict'

var bugsnag = require("bugsnag");
bugsnag.register("2ad186ee39a039e5c5b921a609868f62");

global._ = require('lodash');
global.t = require('moment');

var bodyParser = require('body-parser');
var multer  = require('multer');
var settings  = require('./serverside_controllers/settings.server.js');
var call_request  = require('./serverside_controllers/call_request.server.js');

function run(appdir) {
  var express = require('express');
  var app = express();

  app.use(bodyParser.json());
  //app.use(bodyParser.urlencoded({ extended: true }));
  app.use(multer({
    dest: './tmp/',
    onError: function (error, next) {
      console.log(error);
      next(error);
    }
  }));

  app.dir = process.cwd();

  // things to do on each request
  app.use(function (req, res, next) { 
    // tell the client what firebase to use
    if(process.env.NODE_ENV === 'production') {
      res.cookie('rootRef', "replaceme");
    }
    else {
      res.cookie('rootRef', "https://filmmakersource.firebaseio.com/sidetime");
      // log the request
      console.log(t().format('HH:MM'), req['method'], req.url, req.socket.bytesRead);
    }
    next();
  });

  // static files
  app.use(express.static(app.dir + '/public'));
  app.get('*', function(req, res) {
      res.sendFile('index.html', {root: './public'});
  });

  app.post('/user/username', settings.isItUnique);
  app.post('/call_request', call_request.makeCallRequest);
  app.post('/call_request/accept_or_decline', call_request.acceptOrDecline);

  // Standard error handling
  app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  // Fire up server
  var server = app.listen(process.env.PORT || 5555, function() {
    console.log('Listening on port %d', server.address().port);
  });

}

run(process.cwd());
