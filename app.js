'use strict';

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , mongo = require('mongodb')
  , taco = require('./') // Yeah
  , path = require('path');

// Initialize Express.js
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8215);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  
  // Enable Taco.js for URLs: /, /mostfed and /post/XZY1.html
  app.use(taco.express('/', '/mostfed',  /\/post\/(.*)\.html/));
  
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));  
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/random', routes.random);
app.get('/post/:id.html', routes.post);
app.get('/mostfed', routes.mostfed);

var mongoDBURL = 'mongodb://localhost/tacojs';

mongo.connect(mongoDBURL, {}, function(err, db) {
  if (err) {
    throw new Error('Cannot connect to MongoDB: ' + mongoDBURL); }
  
  // Set MongoDB handler
  app.set('db', db);
  
  // Bind Taco.js to Express.js
  taco.bind(app);
  
  // Start Express.js
  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
});
