var util = require('util');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var events = require('events');
var path = path;

function createJsonChunkParser (handler) {
  return (function () {
    var buffer = '';
    var onData = function (data) {
      var chunk, chunks;
      buffer += data.toString();
      chunks = buffer.split('\n');
      while (chunks.length > 1) {
        chunk = chunks.shift();
        if (!chunk)
          continue;
        var msg;
        try {
          msg = JSON.parse(chunk);
          handler(msg);
        } catch (e) {
          console.log(e.message);
          console.log(e.stack);
          process.nextTick(function () {
            process.exit(1);
          });
        }
      }
      buffer = chunks.pop();
    }

    return onData;
  })();
}

Monitor = function() {}; //

monitor = function() {};

util.inherits(monitor, events.EventEmitter);

Monitor.create = function() {
  return new monitor();
}

var zoneStatus
  = ["uninitialized", "initialized", "ready", "booting", "running",
     "shutting_down", "empty", "down", "dying", "dead"];

monitor.prototype.start = function() {
  var self = this;

  var dfilename = path.join(__dirname, '/monitor/dscripts/zone_events.d');
  fs.readFile(dfilename, { encoding: 'utf8' }, function (error, dscript) {
    startDTrace(dscript);
  });

  function startDTrace (dscript) {
    var args = ['-n', dscript];
    var dtrace = self.dtrace = spawn('/usr/sbin/dtrace', args);

    dtrace.stderr.on('data', function(data) {
      console.log(data.toString());
    });

    var handler = function (zevent) {
      var date = new Date(Date.parse(zevent.date));
      zevent.date = date;

      if (zevent.type == "zone_status")
        zevent.status = zoneStatus[zevent.status];

      self.emit('event', zevent);
    };

    var onData = createJsonChunkParser(handler);

    dtrace.stdout.on('data', onData);

    dtrace.on('exit', function(code) {
      console.log("dtrace exited with code: " + code);
      self.start();
    });

    self.emit('start');
  }
}

monitor.prototype.stop = function () {
  this.dtrace.kill();
}

/*
m = Monitor.create();

m.on('event', function(event) {
  console.log(JSON.stringify(event));
});

m.start();
*/

module.exports = Monitor;
