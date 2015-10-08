'use strict';

var hashcode = require('./lib/hashcode');


var Link = function (value, prev) {
  this._value = value;
  this._next = [];

  if (prev) {
    this._prev = prev;
    prev._next.push(this);
  }
};

var Chain = function (link) {
  var actions = this._actions = [];

  while (link._value) {
    actions.unshift(link._value.actionId);
    link = link._prev;
  }
};

Chain.prototype.hashcode = function () {
  return 'Chain<[' + this._actions.join(',') + ']>';
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

// Src plugin
var GourmandSrcPlugin = function () {
  GourmandPlugin.call(this, 'gourmand-src', 'src');
};

GourmandSrcPlugin.prototype = Object.create(GourmandPlugin.prototype);

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
  this._watches = {
    'default': this._tasks
  };

  this.require('gourmand-src');
  this.require('gourmand-dest');
};

Gourmand.prototype.task = function (name, deps, action) {
  var task = this._tasks[name] = {};
  task.deps = deps;
  task.action = action instanceof Link? new Chain(action): action;
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

var instance = new Gourmand();
module.exports = instance;
