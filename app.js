
/**
 * Module dependencies.
 */
process.on('uncaughtException', function (err) {
  console.log(err);
  console.log(err.stack);
});
var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var fs = require('fs');
// Routes
global.root = fs.readFileSync('root').toString().split(/\s+/)[0];
fs.watch('root',function () {
  global.root = fs.readFileSync('root').toString().split(/\s+/)[0];
});
app.get('/*', routes.index);


app.listen(3500, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
