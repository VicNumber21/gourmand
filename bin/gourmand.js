#!/usr/bin/env node

'use strict';

var Liftoff = require('liftoff');
var interpret = require('interpret');
var v8flags = require('v8flags');
var argv = require('minimist')(process.argv.slice(2));
var util = require('util');

var projectCWD = process.cwd();

var cli = new Liftoff({
  name: 'gourmand',
  //TODO completions: completion,
  extensions: interpret.jsVariants,
  v8flags: v8flags
});

//TODO do I need it? vvv
var errorCode = 0;
process.once('exit', function(code) {
  if (code === 0 && errorCode !== 0) {
    process.exit(errorCode);
  }
});

// Parse those args m8
var cliPackage = require('../package');
var versionFlag = argv.v || argv.version;
var tasksFlag = argv.T || argv.tasks;
var tasks = argv._;
var toRun = tasks.length ? tasks : ['default'];

cli.on('require', function(name) {
  //TODO improve logging
  console.log('Requiring external module', name);
});

cli.on('requireFail', function(name) {
  console.log('Failed to load external module', name);
});

cli.on('respawn', function(flags, child) {
  var nodeFlags = flags.join(', ');
  var pid = child.pid;
  console.log('Node flags detected:', nodeFlags);
  console.log('Respawned to PID:', pid);
});

cli.launch({
  cwd: argv.cwd,
  configPath: argv.gourmandfile,
  require: argv.require
  //TODO completion: argv.completion
}, onLaunched);

function onLaunched (env) {
  console.log('gourmand launched in', projectCWD);
  console.log('Env is', env);
  console.log('Tasks', toRun);

  require(env.configPath);
  var gourmand = require(env.modulePath);

  console.log('Gourmand is', util.inspect(gourmand, {depth: null, colors: true}));
}
