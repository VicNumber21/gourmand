var typechecker = require('typechecker');


module.exports = {
  Undefined: typechecker.isUndefined,
  Null: typechecker.isNull,
  Boolean: typechecker.isBoolean,
  Number: typechecker.isNumber,
  String: typechecker.isString,
  Array: typechecker.isArray,
  Object: typechecker.isPlainObject,
  Function: typechecker.isFunction,
  Buffer: function (x) { return (x instanceof Buffer); },

  Empty: typechecker.isEmpty
};
