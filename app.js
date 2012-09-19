var Zone = require('./lib/zone');
var Dataset = require('./lib/dataset');
var Monitor = require('./lib/monitor');


/*
Zone.list(function(err, zones) {
  if (err) throw err;
  for (var i=0; i<zones.length; i++) {
    console.log(zones[i].name);
  }
});
*/

var m = Monitor.create();

m.on('event', function(event) {
  console.log(event);
  Zone.get(event.name, function(err, zone) {
    Dataset.get(zone.zonepath, function(err, datasets) {
      if (err) throw err;
      zone.datasets = datasets;
      console.log(JSON.stringify(zone));
    });
  });
});

m.start();

