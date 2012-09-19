var fs = require('fs');
var path = require('path');
var sax = require('sax');
var parser = sax.parser(false);
var spawn = require('child_process').spawn;

function Zone() {}; // namespace

// Parse the zone xml and return back something more structured. This is kept as
// a public function so you can use it, but it's not generally considered
// useful.
Zone.parse = function(zonexml, callback) {
  var resource = null; 
  var network = null;
  var device = null;
  var zone = {}
  var deviceOrNetwork;

  parser.onerror = function(err) {
    callback(err, null);
  }

  parser.onopentag = function(node) {
    switch(node.name) {
    case 'RCTL':
      resource = node.attributes.name.split(/zone./)[1];
      break;
    case 'RCTL-VALUE':
      zone[resource.replace(/-/g,'_')] = node.attributes.limit;
      break;
    case 'MCAP':
      zone['mem_phys_cap'] = node.attributes.physcap;
      break;
    case 'ATTR':
      // TODO ?
      if (!zone.attributes)
        zone.attributes= {};
      zone['attributes'][node.attributes.name] = node.attributes.value;
      break;
    case 'ZONE':
      zone['name'] = node.attributes.name;
      zone['debugid'] = node.attributes.debugid;
      zone['zonepath'] = node.attributes.zonepath;
      zone['autoboot'] = node.attributes.autoboot;
      zone['brand'] = node.attributes.brand;
      break;
    case 'DEVICE':
      deviceOrNetwork = device = {};
      device['match'] = node.attributes['match'];
      break;
    case 'NETWORK':
      deviceOrNetwork = network = {};
      network['mac_addr'] = node.attributes['mac-addr'];
      network['vlan_id'] = node.attributes['vlan-id'];
      network['physical'] = node.attributes['physical'];
      network['global_nic'] = node.attributes['global-nic'];
      // we push it later on close (see onclosetag())
      break;
    case 'NET-ATTR':
      deviceOrNetwork[node.attributes.name.replace(/-/g,'_')] = node.attributes.value;
    }
  }

  parser.onclosetag = function(node) {
    switch(node) {
    case 'DEVICE':
      if (zone['devices'] == undefined) {
        zone['devices'] = [];
      }
      zone['devices'].push(device);
      break;
    case 'NETWORK':
      if (zone['networks'] == undefined) {
        zone['networks'] = [];
      } 
      zone['networks'].push(network);
      break;
    }
  }

  parser.onend = function() {
    // final sets
    zone.datasets = [];
    callback(null, zone);
  }

  parser.write(zonexml);
  parser.close();

}

// loads a particular zone name and returns structured output
Zone.get = function (name, callback) {
  var zonepath = '/etc/zones';
  var zonefile = path.join(zonepath, name + '.xml');
  
  fs.exists(zonefile, function (exists) {
    if (exists) {
      fs.readFile(zonefile, 'utf8', function (err, body) {
        if (err) { 
          return callback(err, null);
        } else {
          Zone.parse(body, callback);
        }
      });
    }
    else {
      return callback(new Error("no such zone configured"));
    }
  });
}
// fetches a slightly verbose listing of all zones and a few
// of their properties.
Zone.list = function(callback) {
  var args = ['list', '-pc'];

  zfs = spawn('/usr/sbin/zoneadm', args);

  zfs.stderr.on('data', function(data) {
    callback(data, null);
  });

  zfs.stdout.on('data', function(data) {
    var zones = [];
    var lines = data.toString().split(/\n/);
    for (var i=0; i<lines.length; i++ ) {
      if (lines[i].length ==0) continue;
      var line = lines[i].split(/:/);
      var zone = {
        name: line[1],
        id: line[0],
        status: line[2],
        zonepath: line[3],
        uuid: line[4],
        brand: line[5],
        ip_type: line[6]
      }
      zones.push(zone);
    }
    callback(null, zones);
  });
}

// simply lists all zones and their state 
// from the actual zone index file
Zone.listFromFile = function(callback) {
  var zoneindex = '/etc/zones/index';

  fs.exists(zoneindex, function(exists) {
    if (exists) {
      fs.readFile(zoneindex, 'utf8', function(err, body) {
        if (err) {
          callback(err, null);
        } else {
          var zones = [];
          lines = body.split(/\n/);
          for (var i=0; i< lines.length; i++) {
            if (lines[i].match(/^#/) || lines[i] == "") continue;
            var zone = {}
            var line = lines[i].split(/:/);
            zone['name'] = line[0];
            zone['state'] = line[1];
            zone['dataset'] = line[2] || '';
            zone['uuid'] = line[3] || ''; 
            zones.push(zone);
          }
          callback(null, zones);
        }
      });
    }
  });
}

module.exports = Zone;
