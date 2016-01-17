/*jshint node:true es5:true strict:false*/
var connect = require('connect'),
  path = require('path'),
  spawn = require('child_process').spawn;

var basePath = path.normalize(__dirname + '/..'),
  PORT = 4000;


console.log("Base Path:", basePath);

connect()
//.use(connect.logger())
.use(connect.static(basePath))
.use(connect.static(basePath + '/test'))
.use(connect.static(basePath + '/node_modules'))
.listen(PORT, function() {
  console.log('Test server running on http://0.0.0.0:' + PORT);
  spawn('open', ['http://0.0.0.0:' + PORT]);
});

process.on('SIGINT', function() {
    console.log('Shutting down.');
    process.exit();
});