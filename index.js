'use strict';

var Glob = require('glob').Glob;
var hashcode = require('./lib/hashcode');
var is = require('./lib/is');


var Link = function (value, prev) {
  this._value = value;
  this._next = [];

  if (prev) {
    this._prev = prev;
    prev._next.push(this);
  }
};

var Chain = function (link) {
  var actions = this.actions = [];

  if (link instanceof Link) {
    while (link._value) {
      actions.unshift(link._value.actionId);
      link = link._prev;
    }
  }
  else {
    actions.push(link);
  }
};

Chain.prototype.hashcode = function () {
  return 'Chain<[' + this.actions.join(',') + ']>';
};

Chain.prototype.caches = function () {
  var ret = [];
  var actions = this.actions;
  var length = actions.length;
  var cacheId = actions[0];

  for (var it = 0; it < length; ++it) {
    cacheId += actions[it];
    ret.push(cacheId);
  }

  return ret;
};

var Action = function (pluginName, args) {
  this.pluginName = pluginName;
  this.args = args;
  this.actionId = hashcode(this);
};

Action.prototype.hashcode = function () {
  var argsHash = hashcode(this.args);
  return 'Action<' + this.pluginName + ':' + argsHash.slice(argsHash.indexOf(':') + 1)  + '>';
};

// GourmandPlugin
var GourmandPlugin = function (pluginName, shortName) {
  this._pluginName = pluginName;
  this._shortName = shortName;
};

GourmandPlugin.prototype.register = function (gourmandObj) {
  var pluginName = this._pluginName;
  var shortName = this._shortName;

  Link.prototype[shortName] = function () {
    var args = [];

    for (var it = 0; it < arguments.length; ++it) {
      var arg = arguments[it];

      if (arg instanceof Link) {
        arg = new Chain(arg);
      }

      args.push(arg);
    }

    var action = new Action(pluginName, args);
    gourmandObj.registerAction(action);

    return new Link(action, this);
  };
};


GourmandPlugin.prototype.run = function (args, inputCache, outputCache) {
  console.log('Run "' + this._pluginName + '" with args = ', args, ', in = ', inputCache, ", out = ", outputCache);
};

// Src plugin
var GourmandSrcPlugin = function () {
  GourmandPlugin.call(this, 'gourmand-src', 'src');
};

GourmandSrcPlugin.prototype = Object.create(GourmandPlugin.prototype);

GourmandSrcPlugin.prototype.run = function (args, inputCache, outputCache) {
  console.log('Run "' + this._pluginName + '" with args = ', args, ', in = ', inputCache, ", out = ", outputCache);

  this._glob = new Glob(args[0], {sync: true, stat: true});

  var util = require('util');
  console.log('Glob is', util.inspect(this._glob, {depth: null, colors: true}));
};

// Dest plugin
var GourmandDestPlugin = function () {
  GourmandPlugin.call(this, 'gourmand-dest', 'dest');
};

GourmandDestPlugin.prototype = Object.create(GourmandPlugin.prototype);

// Map plugin
var GourmandMapPlugin = function () {
  GourmandPlugin.call(this, 'gourmand-map', 'map');
};

GourmandMapPlugin.prototype = Object.create(GourmandPlugin.prototype);

// Concat plugin
var GourmandConcatPlugin = function () {
  GourmandPlugin.call(this, 'gourmand-concat', 'concat');
};

GourmandConcatPlugin.prototype = Object.create(GourmandPlugin.prototype);

// Gourmand Plugin Registrar
// TODO for debug only
var GourmandPluginRegistrar = {
  'gourmand-src': GourmandSrcPlugin,
  'gourmand-dest': GourmandDestPlugin,
  'gourmand-map': GourmandMapPlugin,
  'gourmand-concat': GourmandConcatPlugin
};

// Gourmand
var Gourmand = function () {
  this._tasks = {};
  this._actions = {};
  this._plugins = {};
  this._caches = {};
  this._watches = {
    'default': this._tasks
  };

  this.require('gourmand-src');
  this.require('gourmand-dest');
};

Gourmand.prototype.task = function (name, deps, action) {
  var task = this._tasks[name] = {};
  task.deps = deps;
  task.action = new Chain(action);
  this.registerCaches(task.action.caches());
};

Gourmand.prototype.require = function (pluginName) {
  if (!this._plugins[pluginName]) {
    var plugin = this._plugins[pluginName] = new GourmandPluginRegistrar[pluginName];
    plugin.register(this);
  }
};

Gourmand.prototype.src = function () {
  var root = new Link();
  return root.src.apply(root, arguments);
};

Gourmand.prototype.watch = function (name, tasks) {
  this._watches[name] = tasks;
};

Gourmand.prototype.file = {
  path: '__GourmandFilePlaceholderPath__',
  nameWithExtension: '__GourmandFilePlaceholderNameWithExtension__'
};

Gourmand.prototype.registerAction = function (action) {
  this._actions[action.actionId] = action;
};

Gourmand.prototype.registerCaches = function (caches) {
  var length = caches.length;

  for (var it = 0; it < length; ++it) {
    this._caches[caches[it]] = 'cache'; // TODO implement the right cache
  }
};

Gourmand.prototype.run = function (taskIds) {
  var util = require('util');
  console.log('Gourmand is', util.inspect(this, {depth: null, colors: true}));

  var actionsToRun = [];
  var errors = [];

  for (var it = 0; it < taskIds.length; ++it) {
    var taskId = taskIds[it];
    var task = this._tasks[taskId];

    if (is.Undefined(task) && taskId !== 'default') {
      errors.push('Task "' + taskId + '" not found');
    }

    if (errors.length === 0) {
      if (is.Undefined(task) && taskId === 'default') {
        actionsToRun = [];
        var keys = Object.keys(this._tasks);

        for (var keyIdx = 0; keyIdx < keys.length; ++keyIdx) {
          actionsToRun.push(this._tasks[keys[keyIdx]].action);
        }

        break;
      }
      else {
        actionsToRun.push(task.action);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors);
  }

  for (var it = 0; it < actionsToRun.length; ++it) {
    var runningAction = actionsToRun[it];
    var caches = runningAction.caches();

    for (var idx = 0; idx < runningAction.actions.length; ++idx) {
      var actionId = runningAction.actions[idx];
      var spec = this._actions[actionId];
      var plugin = this._plugins[spec.pluginName];
      plugin.run(spec.args, this._caches[caches[idx]], this._caches[caches[idx + 1]]);
    }
  }
};

var instance = new Gourmand();
module.exports = instance;
