/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var util = require('util');
var spawn = require('child_process').spawn

function Dataset() {}; // namespace

// returns details for a single zfs dataset
Dataset.get = function(name, callback) {
  var args = ['get','-rpH', '-o', 'name,property,value'];
  var properties = ['type', 'origin', 'used', 'available', 'referenced', 
                    'quota', 'usedbydataset', 'usedbysnapshots', 
                    'usedbychildren', 'volsize', 'volblocksize'];
  
  args.push(properties.join(','));
  name = name.replace(/^\//,'');
  args.push(name);
  
  zfs = spawn('/usr/sbin/zfs', args);
  
  zfs.stdout.on('data', function(data) {
    var datasets = [];
    var lines = data.toString().split(/\n/);
    var dataset = {name: name};
    
    for (var i=0; i<lines.length; i++) {
      if (lines[i].length == 0) continue;
      line = lines[i].split(/\t/);
      if (line[2] == '-') continue;
      
      if (dataset['name'] == line[0]) {
        dataset[line[1]] = line[2];
      } 
      else {
        datasets.push(dataset);
        dataset = {name: line[0]};
        dataset[line[1]] = line[2];
      }
    }
    
    datasets.push(dataset);
    callback(null, datasets);

  });

  // not expecting anything here
  zfs.stderr.on('data', function(data) {
    callback(data, null);
  });

}

// returns a list of all datasets (verbose)
Dataset.list = function(callback) {
  var args = ['list', '-H', '-t', 'all', '-o']
  var properties = ['name', 'type', 'used', 'available', 'referenced', 'quota', 
                    'usedbydataset', 'usedbychildren' ,'usedbysnapshots'];
  
  args.push(properties.join(','));
 
  // need a libffi thing-y
  zfs = spawn('/usr/sbin/zfs', args)

  zfs.stderr.on('data', function(data) {
    callback(data, null);
  });

  zfs.stdout.on('data', function(data) {
    var datasets = [];
    var lines = data.toString().split(/\n/);
    for (var i=0; i<lines.length; i++) {
      if (lines[i].length == 0) continue;
      var line = lines[i].split(/\t/);
      var dataset = {};
      
      for (var p=0; p<properties.length; p++) {
        dataset[properties[p]] = line[p];
      }

      datasets.push(dataset);
    }

    callback(null, datasets);

  });
}

module.exports = Dataset;
