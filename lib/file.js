var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var moment = require('moment');
var is = require('./is');


var File = function (filepath, timestamp, content) {
  this._path = path.relative('', filepath);
  this._timestamp = moment(timestamp);
  this._content = content;
};

File.Mode = {
  Text: 'text',
  Binary: 'binary'
};

File.fromPath = function (filepath, content) {
  var stat = fs.statSync(filepath);
  return new File(filepath, moment(stat.mtime).isAfter(stat.ctime)? stat.mtime: stat.ctime, content);
};

File.create = function (dir, filename, content) {
  return new File(path.join(dir, filename), moment(), content);
};

File.prototype.path = function () {
  return this._path;
};

File.prototype.dir = function () {
  this._dir = this._dir || path.dirname(this._path);
  return this._dir;
};

File.prototype.filename = function () {
  this._filename = this._filename || path.basename(this._path);
  return this._filename;
};

File.prototype.ext = function () {
  this._ext = this._ext || path.extname(this._path);
  return this._ext;
};

File.prototype.name = function () {
  this._name = this._name || path.basename(this._path, this.ext());
  return this._name;
};

File.prototype.content = function () {
  return this._content;
};

File.prototype.setContent = function (content) {
  if (!is.String(content) && !is.Buffer(content)) {
    throw new Error({what: 'content must be String or Buffer', module: 'File'});
  }

  this._content = content;
};

File.prototype.isChanged = function (timestamp) {
  timestamp = timestamp || moment();
  return this._timestamp.isAfter(timestamp);
};

//TODO is it worth to make async loading / saving
File.prototype.load = function (mode) {
  var ret = false;
  var encoding = (mode === File.Mode.Binary)? undefined: 'utf8';

  try {
    this._content = fs.readFileSync(this._path, encoding);
    ret = true;
  }
  catch (e) {
    this._ioError = e;
  }

  return ret;
};

File.prototype.save = function () {
  var ret = false;

  try {
    mkdirp.sync(this.dir());
    fs.writeFileSync(this._path, this._content);
    ret = true;
  }
  catch (e) {
    this._ioError = e;
  }

  return ret;
};

File.prototype.ioError = function () {
  return this._ioError;
};

module.exports = File;
