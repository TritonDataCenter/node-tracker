/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

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

