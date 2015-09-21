'use strict';

var Gourmand = function () {
  this._tasks = [];
  this._srcs = [];
  this._dests = [];
  this._maps = [];
  this._concats = [];
  this._requires = [];
  this._watches = [];
};

//TODO for debug purpose
Gourmand.prototype.task = function (task, _deps, fn) {
  this._tasks.push(task);
  fn();
};

Gourmand.prototype.require = function (requires) {
  this._requires.push(requires);
};

Gourmand.prototype.src = function (src) {
  this._srcs.push(src);
  return this;
};

Gourmand.prototype.map = function (map) {
  this._maps.push(map);
  return this;
};

Gourmand.prototype.concat = function (concat) {
  this._concats.push(concat);
  return this;
};

Gourmand.prototype.dest = function (dest) {
  this._dests.push(dest);
};

Gourmand.prototype.watch = function (_src, tasks) {
  this._watches = this._watches.concat(tasks);
};

var instance = new Gourmand();
module.exports = instance;
