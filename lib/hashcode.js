var is = require('./is');

var hashed = [];

var hashcode = function (x) {
  var code = '';

  if (is.String(x)) {
    code += 'str:' + x;
  }
  else if (is.Number(x)) {
    code += 'num:' + x;
  }
  else if (is.Boolean(x)) {
    code += 'bool:' + x;
  }
  else if (is.Function(x)) {
    code += 'fn:' + x;
  }
  else if (is.Array(x)) {
    if (hashed.indexOf(x) >= 0) {
      code += '[<cycle]';
    }
    else {
      hashed.push(x);

      var length = x.length;
      code += 'arr<'+ length + '>:[';

      for (var it = 0; it < length; ++it) {
        code += hashcode(x[it]);

        if (it + 1 < length) {
          code += ','
        }
        else {
          code += ']';
        }
      }

      hashed.pop();
    }
  }
  else if (is.Object(x)) {
    if (hashed.indexOf(x) >= 0) {
      code += '{<cycle}';
    }
    else {
      hashed.push(x);

      var keys = Object.keys(x).sort();
      var length = keys.length;
      code += 'obj<' + length + '>:{';

      for (var it = 0; it < length; ++it) {
        var key = keys[it];
        code += key + '=' + hashcode(x[key]);

        if (it + 1 < length) {
          code += ','
        }
        else {
          code += '}';
        }
      }

      hashed.pop();
    }
  }
  // TODO implement for the rest types
  else if (is.String(x.hashcode)) {
    code += x.hashcode;
  }
  else if (is.Function(x.hashcode)) {
    code += x.hashcode();
  }

  return code;
};

module.exports = hashcode;
