(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],3:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":4}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){

var DynamoDB = require('./lib/dynamodb')

window['@awspilot/dynamodb'] = DynamoDB

},{"./lib/dynamodb":6}],6:[function(require,module,exports){
(function (global){
'use strict';

	var Promise = (typeof window !== "undefined" ? window['promise'] : typeof global !== "undefined" ? global['promise'] : null)
	var util = require('@awspilot/dynamodb-util')
	var AWS = (typeof window !== "undefined" ? window['AWS'] : typeof global !== "undefined" ? global['AWS'] : null)
	var sqlparser = require('./sqlparser.js');
	sqlparser.parser.yy.extend = function (a,b){
		if(typeof a == 'undefined') a = {};
		for(var key in b) {
			if(b.hasOwnProperty(key)) {
				a[key] = b[key]
			}
		}
		return a;
	}


	var filterOperators = {
		EQ: '=',
		NE: '<>',
		LT: '<',
		LE: '<=',
		GT: '>',
		GE: '>=',

		BETWEEN: 'BETWEEN',
		IN: 'IN',

		NOT_NULL: 'attribute_exists',
		NULL:     'attribute_not_exists',

		BEGINS_WITH: 'begins_with',
		CONTAINS: 'contains',
		NOT_CONTAINS: 'not_contains',

	 }

	function DynamoDB ( $config ) {
		this.events = {
			error: function() {},
			beforeRequest: function() {}
		}

		// $config will not be an instance of DynamoDB becanse we have a different instance of AWS sdk loaded
		// aws had similar issues in the past: https://github.com/awslabs/dynamodb-document-js-sdk/issues/16

		// a way around to make sure it is an instance of AWS.DynamoDB
		if ((typeof $config === "object") && (($config.config || {}).hasOwnProperty('dynamoDbCrc32'))) {
		//if ($config instanceof AWS.DynamoDB) {
				this.client = $config
				return
		}


		// delay implementation of amazon-dax-client,
		// if node-gyp is not available during npm install,
		// amazon-dax-client will throw error when require('@awspilot/dynamodb')


		//if (process.version.match(/^v(\d+)/)[1] !== '0') {
		//	// amazon-dax-client does not work on node 0.x atm
		//	var AmazonDaxClient = require('amazon-dax-client')
		//	if ($config instanceof AmazonDaxClient) {
		//		this.client = $config
		//		$config = null
		//		return
		//	}
		//}


		if ($config && $config.hasOwnProperty('accessKeyId')) {
			$config.credentials = {
				accessKeyId: $config.accessKeyId,
				secretAccessKey: $config.secretAccessKey || null
			}
			delete $config.accessKeyId
			delete $config.secretAccessKey
		}

		if ($config)
			this.client = new AWS.DynamoDB($config)
		else
			this.client = new AWS.DynamoDB()


	}
	DynamoDB.prototype.SS = function(data) {
		if (Array.isArray(data))
			return new util.Raw({'SS': data })
		throw new Error('SS: argument should be a array')
	}
	DynamoDB.prototype.stringSet = DynamoDB.prototype.SS


	DynamoDB.prototype.N = function(data) {
		if (typeof data === "number" || typeof data === "string")
			return new util.Raw({'N': data.toString() })
		throw new Error('N: argument should be a number or string that converts to a number')
	}
	DynamoDB.prototype.number = DynamoDB.prototype.N


	DynamoDB.prototype.S = function(data) {
		if (typeof data === "string")
			return new util.Raw({'S': data })

		throw new Error('S: argument should be a string')
	}
	DynamoDB.prototype.string = DynamoDB.prototype.S

	DynamoDB.prototype.NS = function(data) {
		if (Array.isArray(data)) {
			var $to_ret = []
			return new util.Raw({'NS': data.map(function(el,idx) { return el.toString() }) })
		}
		throw new Error('NS: argument should be an Array')
	}
	DynamoDB.prototype.numberSet = DynamoDB.prototype.NS


	DynamoDB.prototype.L = function(data) {
		if (Array.isArray(data)) {
			var $to_ret = []
			for (var i in data) {
				$to_ret[i] = util.stringify( data[i] )
			}
			return new util.Raw({'L': $to_ret })
		}
		throw new Error('L: argument should be an Array')
	}
	DynamoDB.prototype.list = DynamoDB.prototype.L



	DynamoDB.prototype.add = function(data, datatype ) {
		// if datatype is defined then force it
		if (typeof datatype == "string") {
			switch (datatype) {
				case 'N':  return this.add(this.N(data));break
				case 'NS': return this.add(this.NS(data));break
				case 'SS': return this.add(this.SS(data));break
				case 'L':  return this.add(this.L(data));break

				// unsupported by AWS
				case 'B':
				case 'BOOL':
				case 'NULL':
				case 'S':
					throw new Error('ADD action is not supported for the type: ' + datatype );
					break

				// unsupported by aws-dynamodb
				case 'BS':
				case 'M':
				default:
					 throw new Error('ADD action is not supported by aws-dynamodb for type: ' + datatype );
					 break
			}
			return
		}

		// check if it is instance of Raw
		if ((typeof data === "object") && (data instanceof util.Raw )) {
			return new DynamoDB.Raw({
				Action: 'ADD',
				Value: data.data
			})
		}

		// autodetect

		// number or undefined: increment number, eg add(5), add()
		if ((typeof data === "number") || (typeof data === "undefined"))
			return this.add(this.N(data || 1));

		if (Array.isArray(data))
			return this.add(this.L(data));

		// add for M is not supported
		//if (typeof data === "object")
		//	return this.add(this.M(data))


		// further autodetection
		throw new Error('ADD action is not supported by aws-dynamodb for type: ' + typeof data );
	}

	DynamoDB.prototype.del = function(data, datatype) {
		// if datatype is defined then force it
		if (typeof datatype == "string") {
			switch (datatype) {
				case 'NS': return this.del(this.NS(data));break
				case 'SS': return this.del(this.SS(data));break

				// unsupported by AWS
				case 'S':
				case 'N':
				case 'L':
					throw new Error('DELETE action with value is not supported for the type: ' + datatype );
					break

				// unsupported by aws-dynamodb
				case 'B':
				case 'BOOL':
				case 'NULL':
				case 'BS':
				case 'M':
				default:
					 throw new Error('DELETE action is not supported by aws-dynamodb for type: ' + datatype );
					 break
			}
			return
		}

		// check if it is instance of Raw
		if ((typeof data === "object") && (data instanceof util.Raw )) {
			return new DynamoDB.Raw({
				Action: 'DELETE',
				Value: data.data
			})
		}

		// autodetect

		if (!arguments.length)
			return new DynamoDB.Raw({ Action: 'DELETE'})

		throw new Error('DELETE action is not supported by aws-dynamodb for type: ' + typeof data );
	}

	DynamoDB.prototype.table = function($tableName) {
		return new Request( this.client, this.events ).table($tableName)
	}


	DynamoDB.prototype.query = function() {
		var r = new Request( this.client, this.events )
		return r.sql(arguments[0],arguments[1]);
	}

	DynamoDB.prototype.getClient = function() {
		return this.client
	}

	DynamoDB.prototype.on = function( event, handler ) {
		this.events[event] = handler
	}

	// select
	DynamoDB.prototype.ALL = 1
	DynamoDB.prototype.ALL_ATTRIBUTES = 1
	DynamoDB.prototype.PROJECTED = 2
	DynamoDB.prototype.ALL_PROJECTED_ATTRIBUTES = 2
	DynamoDB.prototype.COUNT = 3

	// ReturnValues
	DynamoDB.prototype.NONE = 'NONE'
	DynamoDB.prototype.ALL_OLD = 'ALL_OLD'
	DynamoDB.prototype.UPDATED_OLD = 'UPDATED_OLD'
	DynamoDB.prototype.ALL_NEW = 'ALL_NEW'
	DynamoDB.prototype.UPDATED_NEW = 'UPDATED_NEW'

	// ReturnConsumedCapacity
	//DynamoDB.prototype.NONE = 'NONE'
	DynamoDB.prototype.TOTAL = 'TOTAL'
	DynamoDB.prototype.INDEXES = 'INDEXES'

	function Request( $client, $events ) {
		this.events = $events // global events
		this.local_events = {}
		this.client = $client

		this.reset()
	}

	Request.prototype.reset = function() {
		//console.log("reseting")

		this.Select = null

		this.AttributesToGet = [] // deprecated in favor of ProjectionExpression
		this.ProjectionExpression = undefined
		this.ExpressionAttributeNames = undefined
		this.ExpressionAttributeValues = undefined

		this.FilterExpression = undefined

		this.pendingKey = null
		this.pendingFilter = null
		this.pendingIf = null

		this.whereKey = {}
		this.KeyConditionExpression = undefined

		this.whereOther = {}
		this.whereFilter = {}
		this.whereFilterExpression = []  // same as whereFilter, except we can support same attribute compared multiple times

		this.ifFilter = {}
		this.ifConditionExpression = []  // same as ifFilter, except we can support same attribute compared multiple times
		this.ConditionExpression = undefined

		this.limit_value = null
		this.IndexName = null
		this.ScanIndexForward = true
		this.LastEvaluatedKey = null
		this.ExclusiveStartKey = null
		this.ConsistentRead = false
		this.ReturnConsumedCapacity = 'TOTAL'
		this.ReturnValues = DynamoDB.NONE
		//this.ConsumedCapacity = null

	}

	Request.prototype.routeCall = function(method, params, reset ,callback ) {
		var $this = this
		this.events.beforeRequest.apply( this, [ method, params ])

		this.client[method]( params, function( err, data ) {

			if (err)
				$this.events.error.apply( $this, [ method, err , params ] )

			if ((data || {}).hasOwnProperty('ConsumedCapacity') )
				$this.ConsumedCapacity = data.ConsumedCapacity

			if ( reset === true )
				$this.reset()

			callback.apply( $this, [ err, data ] )
		})
	}
	Request.prototype.describeTable = function( table, callback ) {
		this.routeCall('describeTable', { TableName: table }, false, function(err,data) {
			return callback.apply( this, [ err, data ] )
		})
	}

	Request.prototype.describe = function( callback ) {
		this.routeCall('describeTable', { TableName: this.tableName }, true,function(err,raw) {
			if (err)
				return callback.apply( this, [ err ] )

			if (!raw.hasOwnProperty('Table'))
				return callback.apply( this, [ { errorMessage: "Invalid data. No Table Property in describeTable"} ] )

			var info = raw.Table
			delete info.TableStatus
			delete info.TableArn
			delete info.TableSizeBytes
			delete info.ItemCount
			delete info.CreationDateTime
			delete info.ProvisionedThroughput.NumberOfDecreasesToday
			delete info.ProvisionedThroughput.LastIncreaseDateTime
			delete info.ProvisionedThroughput.LastDecreaseDateTime
			if (info.hasOwnProperty('GlobalSecondaryIndexes')) {
				for (var i in info.GlobalSecondaryIndexes) {
					delete info.GlobalSecondaryIndexes[i].IndexSizeBytes
					delete info.GlobalSecondaryIndexes[i].IndexStatus
					delete info.GlobalSecondaryIndexes[i].ItemCount
					delete info.GlobalSecondaryIndexes[i].IndexArn
					delete info.GlobalSecondaryIndexes[i].ProvisionedThroughput.NumberOfDecreasesToday
				}
			}
			if (info.hasOwnProperty('LocalSecondaryIndexes')) {
				for (var i in info.LocalSecondaryIndexes) {
					delete info.LocalSecondaryIndexes[i].IndexSizeBytes
					delete info.LocalSecondaryIndexes[i].ItemCount
					delete info.LocalSecondaryIndexes[i].IndexArn
				}
			}
			return callback.apply( this, [ err, info, raw ] )
		})
	}

	Request.prototype.table = function($tableName) {
		this.tableName = $tableName;
		return this;
	}
	Request.prototype.on = function(eventName, callback ) {
		this.local_events[eventName] = callback
		return this
	}
	Request.prototype.select = function() {

		if (arguments.length === 1 && arguments[0] === DynamoDB.ALL_ATTRIBUTES ) {
			this.Select = 'ALL_ATTRIBUTES'
			return this
		}

		if (arguments.length === 1 && arguments[0] === DynamoDB.ALL_PROJECTED_ATTRIBUTES ) {
			this.Select = 'ALL_PROJECTED_ATTRIBUTES'
			return this
		}

		if (arguments.length === 1 && arguments[0] === 3 ) {
			this.Select = 'COUNT'
			return this
		}

		this.AttributesToGet = []

		for (var i = 0; i < arguments.length; i++)
			this.AttributesToGet.push(arguments[i])

		return this;
	}
	Request.prototype.return = function(rv) {
		this.ReturnValues = rv
		return this
	}
	Request.prototype.addSelect = function($field) {
		this.AttributesToGet.push($field)
		return this
	}

	Request.prototype.consistentRead = function( $value ) {
		if ($value === undefined ) {
			this.ConsistentRead = true
			return this
		}

		if ($value)
			this.ConsistentRead = true
		else
			this.ConsistentRead = false

		return this
	}
	Request.prototype.consistent_read = Request.prototype.consistentRead

	Request.prototype.return_consumed_capacity = function( $value ) { this.ReturnConsumedCapacity = $value; return this }
	Request.prototype.ReturnConsumedCapacity = Request.prototype.return_consumed_capacity

	Request.prototype.descending = function( ) {
		this.ScanIndexForward = false
		return this
	}
	Request.prototype.desc = Request.prototype.descending
	Request.prototype.index = function( $IndexName ) {
		this.IndexName = $IndexName
		return this
	}
	Request.prototype.order_by = Request.prototype.index

	Request.prototype.where = function($key,$value1,$value2) {
		if ($value1 === undefined ) {
			this.pendingKey = $key
			return this
		}

		if ($value2 === undefined) {
			this.whereKey[$key] = {'S' : $value1};

			if (typeof $value1 == "number")
				this.whereKey[$key] = {'N' : ($value1).toString() };

		} else {
			this.whereOther[$key] = {
				type: 'S',
				value: $value2,
				operator: $value1
			};
		}

		return this;
	}

	Request.prototype.insert = function(item, callback) {
		var $this = this

		if (typeof callback !== "function") {
			return new Promise(function(fullfill, reject) {
				$this.describeTable($this.tableName, function(err,data) {
					if (err)
						return reject(err)

					for (var i in data.Table.KeySchema ) {
						$this.if(data.Table.KeySchema[i].AttributeName).not_exists()
					}

					var $thisQuery = {
						TableName: $this.tableName,
						Item: util.anormalizeItem(item),
						Expected: util.buildExpected( $this.ifFilter ),
						ReturnConsumedCapacity: $this.ReturnConsumedCapacity,
						ReturnValues: $this.ReturnValues
					}

				if (typeof $this.local_events['beforeRequest'] === "function" )
						$this.local_events['beforeRequest']('putItem', $thisQuery)

					$this.routeCall('putItem', $thisQuery ,true, function(err,data) {
						if (err)
							return reject(err)

						fullfill(util.normalizeItem(data.Attributes || {}))
					})
				})
			})
		}

		this.describeTable(this.tableName, function(err,data) {
			if (err)
				return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

			for (var i in data.Table.KeySchema ) {
				this.if(data.Table.KeySchema[i].AttributeName).not_exists()
			}

			var $thisQuery = {
				TableName: this.tableName,
				Item: util.anormalizeItem(item),
				Expected: util.buildExpected( this.ifFilter ),
				ReturnConsumedCapacity: this.ReturnConsumedCapacity,
				ReturnValues: this.ReturnValues
			}

			if (typeof this.local_events['beforeRequest'] === "function" )
				this.local_events['beforeRequest']('putItem', $thisQuery)

			this.routeCall('putItem', $thisQuery ,true, function(err,data) {
				if (err)
					return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

				typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeItem(data.Attributes || {}), data ])
			})
		})
	}

	// remember that replace should fail if item does not exist
	Request.prototype.replace = function(item, callback) {
		var $this = this
		if (typeof callback !== "function") {
			return new Promise(function(fullfill, reject) {
				$this.describeTable($this.tableName, function(err,data) {
					if (err)
						return reject(err)

					for (var i in data.Table.KeySchema ) {
						$this.if(data.Table.KeySchema[i].AttributeName).eq(item[ data.Table.KeySchema[i].AttributeName ])
					}

					var $thisQuery = {
						TableName: $this.tableName,
						Item: util.anormalizeItem(item),
						Expected: util.buildExpected( $this.ifFilter ),
						ReturnConsumedCapacity: $this.ReturnConsumedCapacity,
						ReturnValues: $this.ReturnValues
					}

					$this.routeCall('putItem', $thisQuery, true , function(err,data) {
						if (err)
							return reject(err)

						fullfill(util.normalizeItem(data.Attributes || {}))
					})
				})
			})
		}

		this.describeTable(this.tableName, function(err,data) {
			if (err)
				return callback(err, false)

			for (var i in data.Table.KeySchema ) {
				this.if(data.Table.KeySchema[i].AttributeName).eq(item[ data.Table.KeySchema[i].AttributeName ])
			}

			var $thisQuery = {
				TableName: this.tableName,
				Item: util.anormalizeItem(item),
				Expected: util.buildExpected( this.ifFilter ),
				ReturnConsumedCapacity: this.ReturnConsumedCapacity,
				ReturnValues: this.ReturnValues
			}

			this.routeCall('putItem', $thisQuery, true , function(err,data) {
				if (err)
					return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

				typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeItem(data.Attributes || {}), data ])
			})
		})
	}

	Request.prototype.update = function($attrz, callback, $action ) {
		var $this = this

		if (typeof callback !== "function") {
			return new Promise(function(fullfill, reject) {

				$this.describeTable($this.tableName, function(err,data) {
					if (err)
						return reject(err)

					for (var i in data.Table.KeySchema ) {
						if (!$this.whereKey.hasOwnProperty(data.Table.KeySchema[i].AttributeName)) {
							// aws will throw: Uncaught ValidationException: The provided key element does not match the schema
							// we're throwing a more understandable error
							return reject({message: "Uncaught ValidationException: Missing value for Attribute '" + data.Table.KeySchema[i].AttributeName + "' in .where()" })
						} else {
							$this.if(data.Table.KeySchema[i].AttributeName).eq(util.normalizeItem({key: $this.whereKey[ data.Table.KeySchema[i].AttributeName ]}).key )
						}
					}

					var $to_update = {}
					for (var $k in $attrz) {
						if ($attrz.hasOwnProperty($k)) {
							if ($attrz[$k] === undefined ) {
								$to_update[$k] = {
									Action: $action ? $action : 'DELETE',
								}
							} else if ($attrz[$k] instanceof DynamoDB.Raw) {
								$to_update[$k] = $attrz[$k].getRawData()
							} else {
								$to_update[$k] = {
									Action: $action ? $action : 'PUT',
									Value: util.stringify($attrz[$k])
								}
							}
						}
					}
					//this.buildConditionExpression()
					var $thisQuery = {
						TableName: $this.tableName,
						Key: $this.whereKey,

						Expected: util.buildExpected( $this.ifFilter ),

						//ConditionExpression: $this.ConditionExpression,
						//ExpressionAttributeNames: $this.ExpressionAttributeNames,
						//ExpressionAttributeValues: $this.ExpressionAttributeValues,

						//UpdateExpression
						AttributeUpdates : $to_update,

						ReturnConsumedCapacity: $this.ReturnConsumedCapacity,
						ReturnValues: $this.ReturnValues,

					}

					if (typeof $this.local_events['beforeRequest'] === "function" )
						$this.local_events['beforeRequest']('updateItem', $thisQuery)

					$this.routeCall('updateItem', $thisQuery, true , function(err,data) {
						if (err)
							return reject(err)

						fullfill(util.normalizeItem(data.Attributes || {}))
					})
				})
			})
		}

		this.describeTable(this.tableName, function(err,data) {
			if (err)
				return typeof callback !== "function" ? null : callback(err, false)

			for (var i in data.Table.KeySchema ) {
				if (!this.whereKey.hasOwnProperty(data.Table.KeySchema[i].AttributeName)) {
					// aws will throw: Uncaught ValidationException: The provided key element does not match the schema
					// we're throwing a more understandable error
					typeof callback !== "function" ? null : callback.apply( this, [{message: "Uncaught ValidationException: Missing value for Attribute '" + data.Table.KeySchema[i].AttributeName + "' in .where()" }])
				} else {
					this.if(data.Table.KeySchema[i].AttributeName).eq(util.normalizeItem({key: this.whereKey[ data.Table.KeySchema[i].AttributeName ]}).key )
				}

			}

			var $to_update = {}
			for (var $k in $attrz) {
				if ($attrz.hasOwnProperty($k)) {
					if ($attrz[$k] === undefined ) {
						$to_update[$k] = {
							Action: $action ? $action : 'DELETE',
						}
					} else if ($attrz[$k] instanceof DynamoDB.Raw) {
						$to_update[$k] = $attrz[$k].getRawData()
					} else {
						$to_update[$k] = {
							Action: $action ? $action : 'PUT',
							Value: util.stringify($attrz[$k])
						}
					}
				}
			}
			//this.buildConditionExpression()
			var $thisQuery = {
				TableName: this.tableName,
				Key: this.whereKey,


				Expected: util.buildExpected( this.ifFilter ),

				//ConditionExpression: this.ConditionExpression,
				//ExpressionAttributeNames: this.ExpressionAttributeNames,
				//ExpressionAttributeValues: this.ExpressionAttributeValues,

				//UpdateExpression
				AttributeUpdates : $to_update,

				ReturnConsumedCapacity: this.ReturnConsumedCapacity,
				ReturnValues: this.ReturnValues,

			}

			if (typeof this.local_events['beforeRequest'] === "function" )
				this.local_events['beforeRequest']('updateItem', $thisQuery)

			this.routeCall('updateItem', $thisQuery, true , function(err,data) {
				if (err)
					return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

				typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeItem(data.Attributes || {}), data ])
			})
		})
	}

	Request.prototype.insert_or_update = function( params, callback, $action ) {
		var $this = this
		var $attrz = util.clone( params )

		if (typeof callback !== "function") {
			return new Promise(function(fullfill, reject) {

				$this.describeTable($this.tableName, function(err,data) {
					if (err)
						return reject(err)

					// extract the hash/range keys
					for (var i in data.Table.KeySchema ) {
						$this.where(data.Table.KeySchema[i].AttributeName).eq( $attrz[data.Table.KeySchema[i].AttributeName])
						delete $attrz[data.Table.KeySchema[i].AttributeName]
					}
					var $to_update = {}
					for (var $k in $attrz) {
						if ($attrz.hasOwnProperty($k)) {
							if ($attrz[$k] === undefined ) {
								$to_update[$k] = {
									Action: $action ? $action : 'DELETE',
								}
							} else if ($attrz[$k] instanceof DynamoDB.Raw) {
								$to_update[$k] = $attrz[$k].getRawData()
							} else {
								$to_update[$k] = {
									Action: $action ? $action : 'PUT',
									Value: util.stringify($attrz[$k])
								}
							}
						}
					}
					var $thisQuery = {
						TableName: $this.tableName,
						Key: $this.whereKey,
						AttributeUpdates : $to_update,
						ReturnConsumedCapacity: $this.ReturnConsumedCapacity,
						ReturnValues: $this.ReturnValues
					}
					$this.routeCall('updateItem', $thisQuery, true , function(err,data) {
						if (err)
							return reject(err)

						fullfill(util.normalizeItem(data.Attributes || {}))
					})
				})
			})
		}



		this.describeTable(this.tableName, function(err,data) {
			if (err)
				return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

			// extract the hash/range keys
			for (var i in data.Table.KeySchema ) {
				this.where(data.Table.KeySchema[i].AttributeName).eq( $attrz[data.Table.KeySchema[i].AttributeName])
				delete $attrz[data.Table.KeySchema[i].AttributeName]
			}
			var $to_update = {}
			for (var $k in $attrz) {
				if ($attrz.hasOwnProperty($k)) {
					if ($attrz[$k] === undefined ) {
						$to_update[$k] = {
							Action: $action ? $action : 'DELETE',
						}
					} else if ($attrz[$k] instanceof DynamoDB.Raw) {
						$to_update[$k] = $attrz[$k].getRawData()
					} else {
						$to_update[$k] = {
							Action: $action ? $action : 'PUT',
							Value: util.stringify($attrz[$k])
						}
					}
				}
			}
			var $thisQuery = {
				TableName: this.tableName,
				Key: this.whereKey,
				AttributeUpdates : $to_update,
				ReturnConsumedCapacity: this.ReturnConsumedCapacity,
				ReturnValues: this.ReturnValues
			}
			this.routeCall('updateItem', $thisQuery, true , function(err,data) {
				if (err)
					return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

				typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeItem(data.Attributes || {}), data ])
			})
		})
	}

	Request.prototype.insert_or_replace = function( item, callback ) {
		var $this = this

		var $thisQuery = {
			TableName: this.tableName,
			Item: util.anormalizeItem(item),
			ReturnConsumedCapacity: this.ReturnConsumedCapacity,
			ReturnValues: this.ReturnValues
		}

		if (typeof this.local_events['beforeRequest'] === "function" )
			this.local_events['beforeRequest']('putItem', $thisQuery)

		if (typeof callback !== "function") {
			return new Promise(function(fullfill, reject) {
				$this.routeCall('putItem', $thisQuery , true, function(err,data) {
					if (err)
						return reject(err)

					fullfill(util.normalizeItem(data.Attributes || {}))
				})
			})
		}

		this.routeCall('putItem', $thisQuery , true , function(err,data) {
			if (err)
				return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

			typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeItem(data.Attributes || {}), data ])
		})
	}

	Request.prototype.delete = function($attrz, callback ) {
		var $this = this

		if ( arguments.length === 0) {
			var $thisQuery = {
				TableName: this.tableName,
				Key: this.whereKey,
				ReturnConsumedCapacity: this.ReturnConsumedCapacity,
				ReturnValues: this.ReturnValues
			}
			return new Promise(function(fullfill, reject) {
				$this.routeCall('deleteItem', $thisQuery , true, function(err,data) {
					if (err)
						return reject(err)

					fullfill(util.normalizeItem(data.Attributes || {}))
				})
			})
		} else if (typeof $attrz == 'function') {
			// delete entire item, $attrz is actually the callback

			var $thisQuery = {
				TableName: this.tableName,
				Key: this.whereKey,
				ReturnConsumedCapacity: this.ReturnConsumedCapacity,
				ReturnValues: this.ReturnValues
			}
			this.routeCall('deleteItem', $thisQuery, true , function(err,data) {
				if (err)
					return $attrz.apply( this, [ err, false ] )

				$attrz.apply( this, [ err, util.normalizeItem(data.Attributes || {}), data ])
			})
		} else {
			// delete attributes
			var $to_delete = {};
			for (var $i = 0; $i < $attrz.length;$i++) {
				$to_delete[$attrz[$i]] = {
					Action: 'DELETE'
				}
			}
			var $thisQuery = {
				TableName: this.tableName,
				Key: this.whereKey,
				AttributeUpdates : $to_delete,
				ReturnConsumedCapacity: this.ReturnConsumedCapacity,
				ReturnValues: this.ReturnValues
			}
			this.routeCall('updateItem', $thisQuery , true , function(err,data) {
				if (err)
					return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

				typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeItem(data.Attributes || {}), data ])
			})
		}
	}

	Request.prototype.get = function(callback) {
		var $this = this
		this.buildProjectionExpression() // this will set ProjectionExpression and ExpressionAttributeNames
		var $thisQuery = {
			TableName: this.tableName,
			Key: this.whereKey,
			ConsistentRead: this.ConsistentRead,
			ReturnConsumedCapacity: this.ReturnConsumedCapacity,

			ProjectionExpression: this.ProjectionExpression,
			ExpressionAttributeNames: this.ExpressionAttributeNames,
		}

		if (typeof callback !== "function") {
			return new Promise(function(fullfill, reject) {
				$this.routeCall('getItem', $thisQuery , true, function(err,data) {
					if (err)
						return reject(err)

					fullfill(util.normalizeItem(data.Item))
				})
			})
		}


		this.routeCall('getItem', $thisQuery , true, function(err,data) {
			if (err)
				return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

			typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeItem(data.Item), data ])
		})
	}

	Request.prototype.query = function(callback) {
		var $this = this

		if ( this.KeyConditionExpression === undefined )
			this.buildKeyConditionExpression() // will set KeyConditionExpression, ExpressionAttributeNames, ExpressionAttributeValues

		if ( this.ProjectionExpression === undefined )
			this.buildProjectionExpression() // will set ProjectionExpression, ExpressionAttributeNames

		if ( this.FilterExpression === undefined )
			this.buildFilterExpression() // will set FilterExpression, ExpressionAttributeNames, ExpressionAttributeValues

		var $thisQuery = {
			TableName: this.tableName,

			KeyConditionExpression: this.KeyConditionExpression,

			ConsistentRead: this.ConsistentRead,
			ReturnConsumedCapacity: this.ReturnConsumedCapacity,

			"Select": this.Select !== null ? this.Select : undefined,
			//AttributesToGet: this.AttributesToGet.length ? this.AttributesToGet : undefined

			ProjectionExpression: this.ProjectionExpression,
			ExpressionAttributeNames: this.ExpressionAttributeNames,

			FilterExpression: this.FilterExpression,

			ExpressionAttributeValues: this.ExpressionAttributeValues,
		}
		if (this.limit_value !== null)
			$thisQuery['Limit'] = this.limit_value;

		if (this.ScanIndexForward !== true) {
				$thisQuery['ScanIndexForward'] = false;
		}
		if ( this.IndexName !== null )
			$thisQuery['IndexName'] = this.IndexName;

		if ( this.ExclusiveStartKey !== null )
			$thisQuery['ExclusiveStartKey'] = this.ExclusiveStartKey;

		if (typeof this.local_events['beforeRequest'] === "function" )
			this.local_events['beforeRequest']('updateItem', $thisQuery)

		if (typeof callback !== "function") {
			return new Promise(function(fullfill, reject) {
				$this.routeCall('query', $thisQuery , true, function(err,data) {
					if (err)
						return reject(err)

					fullfill(util.normalizeList(data.Items))
				})
			})
		}

		this.routeCall('query', $thisQuery , true , function(err,data) {
			if (err)
				return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

			this.LastEvaluatedKey = data.LastEvaluatedKey === undefined ? null : data.LastEvaluatedKey

			typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeList(data.Items), data ])
		})

		return this
	}

	Request.prototype.scan = function( callback ) {
		var $this = this

		if ( this.ProjectionExpression === undefined )
			this.buildProjectionExpression() // this will set ProjectionExpression and ExpressionAttributeNames

		this.buildFilterExpression()
		var $thisQuery = {
			TableName: this.tableName,
			"Select": this.Select !== null ? this.Select : undefined,

			ProjectionExpression: this.ProjectionExpression,
			ExpressionAttributeNames: this.ExpressionAttributeNames,

			FilterExpression: this.FilterExpression,

			ExpressionAttributeValues: this.ExpressionAttributeValues,

			ReturnConsumedCapacity: this.ReturnConsumedCapacity
		}

		if (this.limit_value !== null)
			$thisQuery['Limit'] = this.limit_value;


		if ( this.ExclusiveStartKey !== null )
			$thisQuery['ExclusiveStartKey'] = this.ExclusiveStartKey;

		if ( this.IndexName !== null )
			$thisQuery['IndexName'] = this.IndexName;

		if (typeof callback !== "function") {
			return new Promise(function(fullfill, reject) {
				$this.routeCall('scan', $thisQuery , true, function(err,data) {
					if (err)
						return reject(err)

					fullfill(util.normalizeList(data.Items))
				})
			})
		}

		this.routeCall('scan', $thisQuery, true , function(err,data) {
			if (err)
				return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

			this.LastEvaluatedKey = data.LastEvaluatedKey === undefined ? null : data.LastEvaluatedKey

			typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeList(data.Items), data ])

		})
	}

	Request.prototype.sql = function( sql, callback ) {
		var $this = this;

		var sqp;
		try {
			sqp = sqlparser.parse( sql );
		} catch(err){
			return callback(err)
		}

		if (sqp.length > 1)
			return callback( { errorCode: 'UNSUPPORTED_MULTIQUERY', errorMessage: '[AWSPILOT] Multiple queries not supported, yet!' } )

		sqp = sqp[0];

		if (typeof callback !== "function") {
			return new Promise(function(fullfill, reject) {
				switch (sqp.statement) {
					case 'BATCHINSERT':

						if (typeof $this.local_events['beforeRequest'] === "function" )
							$this.local_events['beforeRequest'](sqp.operation, sqp.dynamodb)

						$this.routeCall( sqp.operation, sqp.dynamodb ,true, function(err,data) {
							if (err)
								return reject(err)

							fullfill(data)
						})

						break;
					case 'INSERT':
						$this.describeTable(sqp.dynamodb.TableName, function(err,data) {
							if (err)
								return reject(err)

							for (var i in data.Table.KeySchema ) {
								$this.if(data.Table.KeySchema[i].AttributeName).not_exists()
							}

							sqp.dynamodb.Expected = util.buildExpected( $this.ifFilter )

							if (typeof $this.local_events['beforeRequest'] === "function" )
								$this.local_events['beforeRequest'](sqp.operation, sqp.dynamodb)

							$this.routeCall( sqp.operation, sqp.dynamodb ,true, function(err,data) {
								if (err)
									return reject(err)

								fullfill(util.normalizeItem(data.Attributes || {}))
							})
						})
						break;
					case 'UPDATE':
						$this.describeTable(sqp.dynamodb.TableName, function(err,data) {
							if (err)
								return reject(err)

							if (Object.keys(sqp.dynamodb.Expected).length !== Object.keys(data.Table.KeySchema).length)
								return reject( { errorCode: 'WHERE_SCHEMA_INVALID' } )

							for (var i in data.Table.KeySchema ) {
								if (! sqp.dynamodb.Expected.hasOwnProperty(data.Table.KeySchema[i].AttributeName))
									return reject( { errorCode: 'WHERE_SCHEMA_INVALID' } )
							}

							if (typeof $this.local_events['beforeRequest'] === "function" )
								$this.local_events['beforeRequest'](sqp.operation, sqp.dynamodb)

							$this.routeCall( sqp.operation, sqp.dynamodb ,true, function(err,data) {
								if (err)
									return reject(err)

								fullfill(util.normalizeItem(data.Attributes || {}))
							})

						})
						break
					case 'REPLACE':
					case 'DELETE':

						if (typeof $this.local_events['beforeRequest'] === "function" )
							$this.local_events['beforeRequest'](sqp.operation, sqp.dynamodb)

						$this.routeCall( sqp.operation, sqp.dynamodb ,true, function(err,data) {
							if (err)
								return reject(err)

							fullfill(util.normalizeItem(data.Attributes || {}))
						})

						break;
					case 'SELECT':
					case 'SCAN':

						if (typeof $this.local_events['beforeRequest'] === "function" )
							$this.local_events['beforeRequest'](sqp.operation, sqp.dynamodb)

						$this.routeCall( sqp.operation, sqp.dynamodb ,true, function(err,data) {
							if (err)
								return reject(err)
						
							this.LastEvaluatedKey = data.LastEvaluatedKey === undefined ? null : data.LastEvaluatedKey
						
							fullfill(util.normalizeList(data.Items || []))
						})
						break;
					default:
						reject({ errorCode: 'UNSUPPORTED_QUERY_TYPE' })
				}

			})
		}


		switch (sqp.statement) {
			case 'BATCHINSERT':
				if (typeof this.local_events['beforeRequest'] === "function" )
					this.local_events['beforeRequest'](sqp.operation, sqp.dynamodb)

				this.routeCall(sqp.operation, sqp.dynamodb ,true, function(err,data) {
					if (err)
						return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

					typeof callback !== "function" ? null : callback.apply( this, [ err, data, data ])
				})
				break;
			case 'INSERT':

				this.describeTable(sqp.dynamodb.TableName, function(err,data) {
					if (err)
						return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

					for (var i in data.Table.KeySchema ) {
						this.if(data.Table.KeySchema[i].AttributeName).not_exists()
					}

					sqp.dynamodb.Expected = util.buildExpected( this.ifFilter )

					if (typeof this.local_events['beforeRequest'] === "function" )
						this.local_events['beforeRequest'](sqp.operation, sqp.dynamodb)

					this.routeCall(sqp.operation, sqp.dynamodb ,true, function(err,data) {
						if (err)
							return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

						typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeItem(data.Attributes || {}), data ])
					})

				})

				break;
			case 'UPDATE':

				this.describeTable(sqp.dynamodb.TableName, function(err,data) {
					if (err)
						return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

					if (Object.keys(sqp.dynamodb.Expected).length !== Object.keys(data.Table.KeySchema).length)
						return callback( { errorCode: 'WHERE_SCHEMA_INVALID' } )

					for (var i in data.Table.KeySchema ) {
						if (! sqp.dynamodb.Expected.hasOwnProperty(data.Table.KeySchema[i].AttributeName))
							return callback( { errorCode: 'WHERE_SCHEMA_INVALID' } )
					}

					if (typeof this.local_events['beforeRequest'] === "function" )
						this.local_events['beforeRequest'](sqp.operation, sqp.dynamodb)

					this.routeCall(sqp.operation, sqp.dynamodb ,true, function(err,data) {
						if (err)
							return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

						typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeItem(data.Attributes || {}), data ])
					})

				})
				break;
			case 'REPLACE':
			case 'DELETE':

				if (typeof this.local_events['beforeRequest'] === "function" )
					this.local_events['beforeRequest'](sqp.operation, sqp.dynamodb)

				this.routeCall(sqp.operation, sqp.dynamodb ,true, function(err,data) {
					if (err)
						return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )

					typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeItem(data.Attributes || {}), data ])
				})

				break;
			case 'SELECT':
			case 'SCAN':

				if (typeof this.local_events['beforeRequest'] === "function" )
					this.local_events['beforeRequest'](sqp.operation, sqp.dynamodb)

				this.routeCall(sqp.operation, sqp.dynamodb, true , function(err,data) {
					if (err)
						return typeof callback !== "function" ? null : callback.apply( this, [ err, false ] )
				
					this.LastEvaluatedKey = data.LastEvaluatedKey === undefined ? null : data.LastEvaluatedKey
				
					typeof callback !== "function" ? null : callback.apply( this, [ err, util.normalizeList(data.Items), data ])
				
				})
				break;
			default:
				return callback({ errorCode: 'UNSUPPORTED_QUERY_TYPE' })
				break;
		}
	}

	Request.prototype.resume = function( from ) {
		this.ExclusiveStartKey = from
		return this
	}
	Request.prototype.compare = function( $comparison, $value , $value2 ) {
		if (this.pendingFilter !== null) {
			this.whereFilter[this.pendingFilter] = {
				operator: $comparison,
				type: util.anormalizeType($value),
				value: $value,
				value2: $value2
			}
			this.whereFilterExpression.push({
				attribute: this.pendingFilter,
				operator: $comparison,
				type: util.anormalizeType($value),
				value: $value,
				value2: $value2
			})
			this.pendingFilter = null
			return this
		}

		if (this.pendingIf !== null) {
			if ($comparison == 'EQ') {
				this.ifFilter[this.pendingIf] = new util.Raw({ Exists: true, Value: util.stringify($value) })
			} else {
				this.ifFilter[this.pendingIf] = { operator: $comparison, type: util.anormalizeType($value), value: $value, value2: $value2 }
			}

			this.ifConditionExpression.push({
				attribute: this.pendingIf,
				operator: $comparison,
				type: util.anormalizeType($value),
				value: $value,
				value2: $value2
			})

			this.pendingIf = null
			return this
		}

		this.whereOther[this.pendingKey] = { operator: $comparison, type: util.anormalizeType($value), value: $value, value2: $value2 }
		this.pendingKey = null
		return this
	}

	Request.prototype.filter = function($key) {
		this.pendingFilter = $key
		return this
	}
	// alias
	Request.prototype.having = Request.prototype.filter

	Request.prototype.if = function($key) {
		this.pendingIf = $key
		return this
	}

	Request.prototype.limit = function($limit) {
		this.limit_value = $limit;
		return this;
	}

	// comparison functions
	Request.prototype.eq = function( $value ) {
		if (this.pendingFilter !== null)
			return this.compare( 'EQ', $value )

		if (this.pendingIf !== null)
			return this.compare( 'EQ', $value )

		this.whereKey[this.pendingKey] = util.stringify( $value )

		this.pendingKey = null

		return this
	}
	Request.prototype.le = function( $value ) {
		return this.compare( 'LE', $value )
	}
	Request.prototype.lt = function( $value ) {
		return this.compare( 'LT', $value )
	}
	Request.prototype.ge = function( $value ) {
		return this.compare( 'GE', $value )
	}
	Request.prototype.gt = function( $value ) {
		return this.compare( 'GT', $value )
	}
	Request.prototype.begins_with = function( $value ) {
		return this.compare( 'BEGINS_WITH', $value )
	}
	Request.prototype.between = function( $value1, $value2 ) {
		return this.compare( 'BETWEEN', $value1, $value2 )
	}

	// QueryFilter only
	Request.prototype.ne = function( $value ) {
		return this.compare( 'NE', $value )
	}
	Request.prototype.not_null = function( ) {
		return this.compare( 'NOT_NULL' )
	}
	Request.prototype.defined = Request.prototype.not_null
	Request.prototype.null = function( $value ) {
		return this.compare( 'NULL' )
	}
	Request.prototype.undefined = Request.prototype.null
	Request.prototype.contains = function( $value ) {
		return this.compare( 'CONTAINS', $value )
	}
	Request.prototype.not_contains = function( $value ) {
		return this.compare( 'NOT_CONTAINS', $value )
	}
	Request.prototype.in = function( $value ) {
		return this.compare( 'IN', $value )
	}

	// Expected only
	Request.prototype.exists = function( ) {
		if (this.pendingIf !== null) {
			this.ifFilter[this.pendingIf] = new util.Raw({ Exists: true })

			this.pendingIf = null
			return this
		}
		return this
	}
	Request.prototype.not_exists = function( ) {
		if (this.pendingIf !== null) {
			this.ifFilter[this.pendingIf] = new util.Raw({ Exists: false })
			this.pendingIf = null
			return this
		}
		return this
	}

	// helper functions ...

	Request.prototype.registerExpressionAttributeName = function(item, ALLOW_DOT ) {
		var $this = this

		if ($this.ExpressionAttributeNames === undefined)
			$this.ExpressionAttributeNames = {}



		if (!ALLOW_DOT)
			return util.expression_name_split(item).map(function(original_attName) {

				var attName =  original_attName.split('-').join('_minus_').split('.').join('_dot_') // "-","." not allowed
				var attSpecialName = '#' + attName


				if (attName.indexOf('[') !== -1) {
					attSpecialName = attName.split('[').map(function(v) {
						if (v[v.length-1] == ']')
							return v

						$this.ExpressionAttributeNames[ '#'+v ] = v
						return '#' + v
					}).join('[')
				} else {
					if (attSpecialName[0] === '#')
						$this.ExpressionAttributeNames[ attSpecialName ] = original_attName
				}

				return attSpecialName
			}).join('.')


		//if (ALLOW_DOT)
		var original_attName = item
		var attName =  original_attName.split('-').join('_minus_').split('.').join('_dot_') // "-","." not allowed

		var attSpecialName = '#' + attName


		if (attName.indexOf('[') !== -1) {
			attSpecialName = attName.split('[').map(function(v) {
				if (v[v.length-1] == ']')
					return v

				$this.ExpressionAttributeNames[ '#'+v ] = v
				return '#' + v
			}).join('[')
		} else {
			if (attSpecialName[0] === '#')
				$this.ExpressionAttributeNames[ attSpecialName ] = original_attName
		}

		return attSpecialName

	}
	Request.prototype.registerExpressionAttributeValue = function(original_attName, value) {
		if (this.ExpressionAttributeValues === undefined)
			this.ExpressionAttributeValues = {}

		var attName = original_attName.split('-').join('_minus_').split('"').join("_quote_") // "-" not allowed

		var attNameValue = ':' + attName.split('.').join('_').split('[').join('_idx_').split(']').join('')

		var attNameValueVersion = 1;
		while (this.ExpressionAttributeValues.hasOwnProperty(attNameValue+'_v'+attNameValueVersion)) attNameValueVersion++

		this.ExpressionAttributeValues[attNameValue+'_v'+attNameValueVersion] = util.stringify( value )

		return attNameValue+'_v'+attNameValueVersion
	}

	Request.prototype.buildProjectionExpression = function() {
		if (!this.AttributesToGet.length)
			return

		var $this = this

		this.ProjectionExpression = this.AttributesToGet.map(function(item) {
			return $this.registerExpressionAttributeName(item)
		}).join(', ')
	}

	//
	Request.prototype.buildKeyConditionExpression = function(idx) {
		var $this = this
		var ret = []
		this.KeyConditionExpression = Object.keys(this.whereKey).map(function(key) {
			return $this.registerExpressionAttributeName(key, true ) + ' ' +
				'=' + ' ' +
				$this.registerExpressionAttributeValue(key, util.normalizeItem({value: $this.whereKey[key] }).value, true )
		}).concat(
			Object.keys(this.whereOther).map(function(key) {
				var whereFilter = $this.whereOther[key]

				switch (filterOperators[whereFilter.operator]) {
					case '=':
					case '<':
					case '<=':
					case '>':
					case '>=':
						return $this.registerExpressionAttributeName(key, true ) + ' ' +
							filterOperators[whereFilter.operator] + ' ' +
							$this.registerExpressionAttributeValue(key, whereFilter.value, true )
						break

					case  'BETWEEN':
						return $this.registerExpressionAttributeName(key, true ) + ' BETWEEN ' +
							$this.registerExpressionAttributeValue(key+'_1', whereFilter.value, true ) +
							' AND ' +
							$this.registerExpressionAttributeValue(key+'_2', whereFilter.value2, true )
						break;

					case 'begins_with':
						return 'begins_with(' + $this.registerExpressionAttributeName(key, true ) + ', ' + $this.registerExpressionAttributeValue(key, whereFilter.value, true ) + ')'
						break;

				}
			})
		).map(function(v) { return '( ' + v + ' )'}).join(" AND \n")
	}

	Request.prototype.buildFilterExpression = function(idx) {
		var $this = this

		if (!this.whereFilterExpression.length)
			return

		var ret = []
		this.FilterExpression = this.whereFilterExpression.map(function(whereFilter) {
			var key = whereFilter.attribute

			switch (filterOperators[whereFilter.operator]) {
				case '=':
				case '<>':
				case '<':
				case '<=':
				case '>':
				case '>=':
					return $this.registerExpressionAttributeName(whereFilter.attribute) + ' ' +
						filterOperators[whereFilter.operator] + ' ' +
						$this.registerExpressionAttributeValue(whereFilter.attribute, whereFilter.value)
					break

				case  'BETWEEN':
					return $this.registerExpressionAttributeName(whereFilter.attribute) + ' BETWEEN ' +
						$this.registerExpressionAttributeValue(whereFilter.attribute+'_1', whereFilter.value) +
						' AND ' +
						$this.registerExpressionAttributeValue(whereFilter.attribute+'_2', whereFilter.value2)
					break;

				case 'IN':
					return $this.registerExpressionAttributeName(whereFilter.attribute) + ' IN (' +
							whereFilter.value.map(function(v, idx) {
								return $this.registerExpressionAttributeValue(whereFilter.attribute+'_' + idx, v)
							}).join(',')  +
						' )'
					break;


				case 'attribute_exists':
					return 'attribute_exists(' + $this.registerExpressionAttributeName(whereFilter.attribute) + ')'
					break;

				case 'attribute_not_exists':
					return 'attribute_not_exists(' + $this.registerExpressionAttributeName(whereFilter.attribute) + ')'
					break;

				case 'begins_with':
					return 'begins_with(' + $this.registerExpressionAttributeName(whereFilter.attribute) + ', ' + $this.registerExpressionAttributeValue(whereFilter.attribute, whereFilter.value) + ')'
					break;

				case 'contains':
					return 'contains(' + $this.registerExpressionAttributeName(whereFilter.attribute) + ', ' + $this.registerExpressionAttributeValue(whereFilter.attribute, whereFilter.value) + ')'
					break;

				case 'not_contains':
					return 'NOT contains(' + $this.registerExpressionAttributeName(whereFilter.attribute) + ', ' + $this.registerExpressionAttributeValue(whereFilter.attribute, whereFilter.value) + ')'
					break;
				//attribute_type (path, type)
				//size (path)
			}
		}).map(function(v) { return '( ' + v + ' )'}).join(" AND \n")
	}


	// RAW functions, used by dynamodb-sql 
	Request.prototype.RawIndexName = function( value ) {
		this.IndexName = value
		return this
	}
	Request.prototype.RawScanIndexForward = function( value ) {
		this.ScanIndexForward = value
		return this
	}
	Request.prototype.RawLimit = function( value ) {
		this.limit_value = value
		return this
	}
	Request.prototype.RawConsistentRead = function( value ) {
		this.ConsistentRead = value
		return this
	}
	Request.prototype.RawKeyConditionExpression = function( value ) {
		this.KeyConditionExpression = value
		return this
	}
	Request.prototype.RawExpressionAttributeNames = function( value ) {
		this.ExpressionAttributeNames = value
		return this
	}
	Request.prototype.RawExpressionAttributeValues = function( value ) {
		this.ExpressionAttributeValues = value
		return this
	}
	Request.prototype.RawProjectionExpression = function( value ) {
		this.ProjectionExpression = value
		return this
	}
	Request.prototype.RawFilterExpression = function( value ) {
		this.FilterExpression = value
		return this
	}


DynamoDB.Raw = function(data) {
	this.data = data
}
DynamoDB.Raw.prototype.getRawData = function() {
	return this.data
}
module.exports = function ( $config ) {
	return new DynamoDB($config)
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./sqlparser.js":7,"@awspilot/dynamodb-util":8}],7:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var sqlparser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,16],$V1=[1,17],$V2=[1,18],$V3=[1,19],$V4=[1,25],$V5=[1,20],$V6=[1,21],$V7=[1,22],$V8=[1,23],$V9=[1,26],$Va=[5,6],$Vb=[5,6,109,111],$Vc=[1,35],$Vd=[1,36],$Ve=[5,6,111],$Vf=[20,21,117],$Vg=[1,51],$Vh=[5,6,28,53,64,70,72,82,84,89,92,95,97,102,109,110,111,118,121,127,132,133,134,135,136,137,139,143,151,153,162,167],$Vi=[1,68],$Vj=[1,71],$Vk=[53,102],$Vl=[53,92],$Vm=[5,6,109,111,127],$Vn=[1,122],$Vo=[1,139],$Vp=[1,137],$Vq=[1,138],$Vr=[1,140],$Vs=[1,141],$Vt=[1,142],$Vu=[1,144],$Vv=[1,143],$Vw=[1,145],$Vx=[5,6,53],$Vy=[5,6,52,53,62,92,97,109,110,111,127],$Vz=[5,6,52,53,62,92],$VA=[53,62],$VB=[2,90],$VC=[1,170],$VD=[1,171],$VE=[52,53],$VF=[2,58],$VG=[5,6,109,110,111],$VH=[1,213],$VI=[1,214],$VJ=[1,215],$VK=[1,211],$VL=[1,212],$VM=[1,207],$VN=[5,6,97],$VO=[1,248],$VP=[5,6,109,110,111,127],$VQ=[1,254],$VR=[1,252],$VS=[1,255],$VT=[1,256],$VU=[1,257],$VV=[1,258],$VW=[1,259],$VX=[1,260],$VY=[1,261],$VZ=[5,6,89,97,109,111,132,133,134,135,136,137,139,143],$V_=[5,6,89,97,109,110,111,132,133,134,135,136,137,139,143],$V$=[1,287],$V01=[1,288],$V11=[1,289],$V21=[1,293],$V31=[1,297],$V41=[1,295],$V51=[1,298],$V61=[1,299],$V71=[1,300],$V81=[1,301],$V91=[1,302],$Va1=[1,303],$Vb1=[1,304],$Vc1=[52,53,72],$Vd1=[53,72],$Ve1=[5,6,97,109,110,111,127],$Vf1=[5,6,53,92],$Vg1=[2,251],$Vh1=[1,384],$Vi1=[2,253],$Vj1=[1,403],$Vk1=[53,72,157];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"main":3,"sql_stmt_list":4,"EOF":5,"SEMICOLON":6,"sql_stmt":7,"select_stmt":8,"insert_stmt":9,"update_stmt":10,"replace_stmt":11,"delete_stmt":12,"create_table_stmt":13,"show_tables_stmt":14,"drop_table_stmt":15,"describe_table_stmt":16,"drop_index_stmt":17,"scan_stmt":18,"name":19,"LITERAL":20,"BRALITERAL":21,"database_table_name":22,"DOT":23,"dynamodb_table_name":24,"database_index_name":25,"dynamodb_index_name":26,"signed_number":27,"NUMBER":28,"string_literal":29,"SINGLE_QUOTED_STRING":30,"DOUBLE_QUOTED_STRING":31,"XSTRING":32,"literal_value":33,"boolean":34,"TRUE":35,"FALSE":36,"boolean_value":37,"dynamodb_data_string":38,"dynamodb_raw_string":39,"dynamodb_data_number":40,"dynamodb_raw_number":41,"dynamodb_data_boolean":42,"dynamodb_raw_boolean":43,"dynamodb_data_null":44,"NULL":45,"dynamodb_raw_null":46,"dynamodb_data_undefined":47,"UNDEFINED":48,"dynamodb_data_array":49,"ARRAYLPAR":50,"array_list":51,"ARRAYRPAR":52,"COMMA":53,"array_value":54,"dynamodb_data_json":55,"dynamodb_raw_array":56,"array_list_raw":57,"array_value_raw":58,"dynamodb_raw_json":59,"JSONLPAR":60,"dynamodb_data_json_list":61,"JSONRPAR":62,"dynamodb_data_json_kv":63,"COLON":64,"dynamodb_data_json_list_raw":65,"dynamodb_raw_json_kv":66,"dynamodb_raw_stringset":67,"NEW":68,"STRINGSET":69,"LPAR":70,"stringset_list":71,"RPAR":72,"dynamodb_raw_numberset":73,"NUMBERSET":74,"numberset_list":75,"javascript_raw_obj_date":76,"DATE":77,"javascript_raw_date_parameter":78,"INSERT":79,"def_insert_ignore":80,"INTO":81,"SET":82,"def_insert_columns":83,"VALUES":84,"def_insert_items":85,"IGNORE":86,"def_insert_item":87,"def_insert_onecolumn":88,"EQ":89,"UPDATE":90,"def_update_columns":91,"WHERE":92,"def_update_where":93,"def_update_onecolumn":94,"PLUSEQ":95,"def_update_where_cond":96,"AND":97,"REPLACE":98,"def_replace_columns":99,"def_replace_onecolumn":100,"DELETE":101,"FROM":102,"def_delete_where":103,"def_delete_where_cond":104,"def_select":105,"select_sort_clause":106,"limit_clause":107,"def_consistent_read":108,"LIMIT":109,"DESC":110,"CONSISTENT_READ":111,"distinct_all":112,"DISTINCT":113,"ALL":114,"def_select_columns":115,"def_select_onecolumn":116,"STAR":117,"AS":118,"def_select_from":119,"def_select_use_index":120,"USE":121,"INDEX":122,"def_where":123,"select_where_hash":124,"select_where_range":125,"def_having":126,"HAVING":127,"having_expr":128,"SELECT":129,"where_expr":130,"bind_parameter":131,"OR":132,"GT":133,"GE":134,"LT":135,"LE":136,"BETWEEN":137,"where_between":138,"LIKE":139,"select_where_hash_value":140,"select_where_range_value":141,"select_where_between":142,"CONTAINS":143,"CREATE":144,"TABLE":145,"def_ct_typedef_list":146,"def_ct_pk":147,"def_ct_indexes":148,"def_ct_index_list":149,"def_ct_index":150,"LSI":151,"def_ct_projection":152,"GSI":153,"def_ct_throughput":154,"PRIMARY":155,"KEY":156,"THROUGHPUT":157,"PROJECTION":158,"KEYS_ONLY":159,"def_ct_projection_list":160,"def_ct_typedef":161,"STRING":162,"SHOW":163,"TABLES":164,"DROP":165,"DESCRIBE":166,"ON":167,"def_scan":168,"def_scan_limit_clause":169,"def_scan_consistent_read":170,"SCAN":171,"def_scan_columns":172,"def_scan_use_index":173,"def_scan_having":174,"def_scan_onecolumn":175,"def_scan_having_expr":176,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",6:"SEMICOLON",20:"LITERAL",21:"BRALITERAL",23:"DOT",28:"NUMBER",30:"SINGLE_QUOTED_STRING",31:"DOUBLE_QUOTED_STRING",32:"XSTRING",35:"TRUE",36:"FALSE",45:"NULL",48:"UNDEFINED",50:"ARRAYLPAR",52:"ARRAYRPAR",53:"COMMA",60:"JSONLPAR",62:"JSONRPAR",64:"COLON",68:"NEW",69:"STRINGSET",70:"LPAR",72:"RPAR",74:"NUMBERSET",77:"DATE",79:"INSERT",81:"INTO",82:"SET",84:"VALUES",86:"IGNORE",89:"EQ",90:"UPDATE",92:"WHERE",95:"PLUSEQ",97:"AND",98:"REPLACE",101:"DELETE",102:"FROM",109:"LIMIT",110:"DESC",111:"CONSISTENT_READ",113:"DISTINCT",114:"ALL",117:"STAR",118:"AS",121:"USE",122:"INDEX",127:"HAVING",129:"SELECT",131:"bind_parameter",132:"OR",133:"GT",134:"GE",135:"LT",136:"LE",137:"BETWEEN",139:"LIKE",143:"CONTAINS",144:"CREATE",145:"TABLE",151:"LSI",153:"GSI",155:"PRIMARY",156:"KEY",157:"THROUGHPUT",158:"PROJECTION",159:"KEYS_ONLY",162:"STRING",163:"SHOW",164:"TABLES",165:"DROP",166:"DESCRIBE",167:"ON",171:"SCAN"},
productions_: [0,[3,2],[4,3],[4,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[19,1],[19,1],[22,3],[22,1],[24,1],[25,1],[26,1],[27,1],[29,1],[29,1],[29,1],[33,1],[33,1],[34,1],[34,1],[37,1],[37,1],[38,1],[38,1],[39,1],[39,1],[40,1],[41,1],[42,1],[42,1],[43,1],[43,1],[44,1],[46,1],[47,1],[49,3],[51,3],[51,1],[54,0],[54,1],[54,1],[54,1],[54,1],[54,1],[54,1],[56,3],[57,3],[57,1],[58,0],[58,1],[58,1],[58,1],[58,1],[58,1],[58,1],[55,3],[61,3],[61,1],[63,0],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[63,3],[59,3],[65,3],[65,1],[66,0],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[66,3],[67,7],[71,3],[71,1],[73,7],[75,3],[75,1],[76,5],[76,9],[78,0],[78,1],[78,1],[9,6],[9,6],[80,0],[80,1],[85,3],[85,1],[87,3],[83,3],[83,1],[88,3],[88,3],[88,3],[88,3],[88,3],[88,3],[88,3],[88,3],[88,3],[10,6],[91,3],[91,1],[94,3],[94,3],[94,3],[94,3],[94,3],[94,3],[94,3],[94,3],[94,3],[94,3],[94,3],[93,1],[93,3],[96,3],[96,3],[11,5],[99,3],[99,1],[100,3],[100,3],[100,3],[100,3],[100,3],[100,3],[100,3],[100,3],[100,3],[12,5],[103,1],[103,3],[104,3],[104,3],[8,4],[107,0],[107,2],[106,0],[106,1],[108,0],[108,1],[112,0],[112,1],[112,1],[115,3],[115,1],[116,1],[116,1],[116,3],[119,2],[120,0],[120,3],[123,2],[123,4],[126,2],[126,0],[105,7],[130,1],[130,1],[130,1],[130,3],[130,3],[130,3],[130,3],[130,3],[130,3],[130,3],[130,3],[130,3],[124,3],[140,1],[140,1],[125,3],[125,3],[125,3],[125,3],[125,3],[125,3],[125,3],[141,1],[141,1],[142,3],[142,3],[138,3],[138,3],[128,1],[128,1],[128,1],[128,1],[128,3],[128,3],[128,3],[128,3],[128,3],[128,3],[128,3],[128,3],[128,3],[128,3],[128,3],[128,3],[13,9],[148,0],[148,2],[149,3],[149,1],[150,7],[150,8],[150,9],[150,10],[147,6],[147,8],[154,0],[154,3],[152,0],[152,2],[152,2],[152,4],[160,3],[160,1],[146,3],[146,1],[161,2],[161,2],[14,2],[15,3],[16,3],[17,5],[18,3],[168,6],[169,0],[169,2],[170,0],[170,1],[172,3],[172,1],[175,1],[175,1],[175,3],[173,0],[173,3],[174,2],[174,0],[176,1],[176,1],[176,1],[176,1],[176,3],[176,3],[176,3],[176,3],[176,3],[176,3],[176,3],[176,3],[176,3],[176,3],[176,3],[176,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:

			this.$ = $$[$0-1];
			return this.$;
		
break;
case 2:
 this.$ = $$[$0-2]; if($$[$0]) this.$.push($$[$0]); 
break;
case 3: case 47: case 57: case 67: case 89: case 111: case 125: case 128: case 140: case 158: case 184: case 258: case 274:
 this.$ = [$$[$0]]; 
break;
case 15: case 19: case 21: case 22: case 23: case 24: case 25: case 188: case 190: case 196: case 224: case 225: case 279: case 282: case 283:
 this.$ = $$[$0]; 
break;
case 16:
 this.$ = $$[$0].substr(1,$$[$0].length-2); 
break;
case 17:
 this.$ = {database:$$[$0-2], table:$$[$0]}; 
break;
case 18:
 this.$ = {table:$$[$0]}; 
break;
case 20:
 this.$ = {index:$$[$0]}; 
break;
case 26:
 this.$ = {type:'number', number:$$[$0]}; 
break;
case 27:
 this.$ = {type:'string', string: $$[$0]}
break;
case 28: case 38:
 this.$ = true; 
break;
case 29: case 39:
 this.$ = false; 
break;
case 30:
 this.$ = {type:'boolean', value: true }; 
break;
case 31:
 this.$ = {type:'boolean', value: false }; 
break;
case 32: case 33: case 36:
 this.$ = eval($$[$0]); 
break;
case 34: case 35:
 this.$ = { 'S': eval($$[$0]).toString() } 
break;
case 37:
 this.$ = { 'N': eval($$[$0]).toString() } 
break;
case 40:
 this.$ = { 'BOOL': true  } 
break;
case 41:
 this.$ = { 'BOOL': false } 
break;
case 42:
 this.$ = null; 
break;
case 43:
 this.$ = { 'NULL': true } 
break;
case 44:
 this.$ = "\0"; 
break;
case 45:

			if ($$[$0-1].slice(-1) == "\0") {
				this.$ = $$[$0-1].slice(0,-1)
			} else
				this.$ = $$[$0-1];
		
break;
case 46: case 56: case 110:

			this.$ = $$[$0-2] 
			this.$.push($$[$0]); 
		
break;
case 48: case 58:
 this.$ = "\0" 
break;
case 49: case 50: case 51: case 52: case 53: case 54: case 59: case 60: case 61: case 62: case 63: case 64: case 118: case 119: case 209: case 210: case 218: case 219:
 this.$ = $$[$0] 
break;
case 55:

			if ($$[$0-1].slice(-1) == "\0") {
				$$[$0-1] = $$[$0-1].slice(0,-1)
			}
			this.$ = { 'L': $$[$0-1] }
		
break;
case 65:
 
			var $kv = {}
			if ($$[$0-1]) {
				$$[$0-1].map(function(v) {
					if (v)
						$kv[v[0]] = v[1]
				})
			}
			this.$ = $kv
		
break;
case 66: case 88: case 124: case 127: case 139: case 157: case 183: case 243: case 257: case 273:
 this.$ = $$[$0-2]; this.$.push($$[$0]); 
break;
case 68: case 90: case 174: case 180: case 189: case 241: case 269: case 278:
 this.$ = undefined; 
break;
case 69: case 70: case 71: case 72: case 73: case 74: case 75: case 76: case 77: case 78: case 79: case 80: case 81: case 82: case 83: case 84: case 85: case 86: case 91: case 94: case 97: case 100: case 103: case 106:
 this.$ = [$$[$0-2], $$[$0] ] 
break;
case 87:
 
			var $kv = {}
			if ($$[$0-1]) {
				$$[$0-1].map(function(v) {
					if (v)
						$kv[v[0]] = v[1]
				})
			}
			this.$ = { 'M': $kv }
		
break;
case 92: case 93: case 95: case 96: case 98: case 99: case 101: case 102: case 104: case 105: case 107: case 108:
 this.$ = [eval($$[$0-2]), $$[$0] ] 
break;
case 109:

			if ($$[$0-2].slice(-1) == "\0") {
				$$[$0-2] = $$[$0-2].slice(0,-1)
			}
			this.$ = { 'SS': $$[$0-2] }
		
break;
case 112:

			if ($$[$0-2].slice(-1) == "\0") {
				$$[$0-2] = $$[$0-2].slice(0,-1)
			}
			this.$ = { 'NS': $$[$0-2] }
		
break;
case 113:

			this.$ = $$[$0-2] 
			this.$.push( ($$[$0]).toString() ); 
		
break;
case 114:
 this.$ = [ ($$[$0]).toString() ]; 
break;
case 115:

			var date;
			if ($$[$0-1])
				date = new Date($$[$0-1]);
			else
				date = new Date()

			if (typeof date === "object") {
				this.$ = { S: date.toString() }
			}
			if (typeof date === "string") {
				this.$ = { S: date }
			}
			if (typeof date === "number") {
				this.$ = { N: date.toString() }
			}
		
break;
case 116:

			var date;
			if ($$[$0-5])
				date = new Date($$[$0-5]);
			else
				date = new Date()


			if (typeof date[$$[$0-2]] === "function" ) {
				date = date[$$[$0-2]]();
				if (typeof date === "object") {
					this.$ = { S: date.toString() }
				}
				if (typeof date === "string") {
					this.$ = { S: date }
				}
				if (typeof date === "number") {
					this.$ = { N: date.toString() }
				}
			} else {
				throw $$[$0-2] + " not a function"
			}
		
break;
case 117:
 this.$ = undefined 
break;
case 120:

			var $kv = {}
			$$[$0].map(function(v) { $kv[v[0]] = v[1] })

			this.$ = {
				statement: 'INSERT', 
				operation: 'putItem',
				ignore: $$[$0-4],
				dynamodb: {
					TableName: $$[$0-2],
					Item: $kv,
					
				},
				
			};

		
break;
case 121:

			if ($$[$0].length == 1) {
				this.$ = {
					statement: 'INSERT', 
					operation: 'putItem',
					ignore: $$[$0-4],
					dynamodb: {
						TableName: $$[$0-2],
						Item: $$[$0][0].M,
					},
					
				};
			} else {
				// batch insert
				this.$ = {
					statement: 'BATCHINSERT', 
					operation: 'batchWriteItem',
					dynamodb: {
						RequestItems: {}
					}
					
				}
				
				var RequestItems = {}
				
				RequestItems[$$[$0-2]] = []
				
				$$[$0].map(function(v) { 
					RequestItems[$$[$0-2]].push({
						PutRequest: {
							Item: v.M
						}	
					})
				})
				this.$.dynamodb.RequestItems = RequestItems;
			}
		
break;
case 122:
 this.$ = false 
break;
case 123:
 this.$ = true 
break;
case 126:
 this.$ = $$[$0-1] 
break;
case 129: case 130: case 131: case 132: case 133: case 134: case 135: case 136: case 137: case 141: case 142: case 143: case 144: case 145: case 146: case 147: case 148: case 149: case 159: case 160: case 161: case 162: case 163: case 164: case 165: case 166: case 167: case 220: case 221:
 this.$ = [ $$[$0-2], $$[$0] ]; 
break;
case 138:


			var Key = {}
			$$[$0].map(function(k) {
				Key[k.k] = k.v
			})
			var Expected = {}
			$$[$0].map(function(k) {
				Expected[k.k] = {
					ComparisonOperator: 'EQ',
					Value: k.v,
					
				}
			})

			var AttributeUpdates = {}
			$$[$0-2].map(function(k) {
				var Value = k[1]
				var Action = 'PUT' // default

				if (k[2] === '+=')
					Action = 'ADD'

				if (k[2] === 'delete') {
					Action = 'DELETE'
					
				}

				AttributeUpdates[k[0]] = {
					Action: Action,
					Value: Value,
				}
			})
			
			this.$ = {
				statement: 'UPDATE', 
				operation: 'updateItem',
				dynamodb: {
					TableName: $$[$0-4],
					Key: Key,
					Expected: Expected,
					AttributeUpdates: AttributeUpdates, 
				},
			}
		
break;
case 150:
 this.$ = [ $$[$0-2], $$[$0], '+=' ]; 
break;
case 151:
 this.$ = [ $$[$0-2], undefined, 'delete' ]; 
break;
case 152: case 169: case 244: case 260:
 this.$ = [ $$[$0] ]; 
break;
case 153: case 170:
 this.$ = [$$[$0-2], $$[$0]]; 
break;
case 154: case 155: case 171: case 172:
 this.$ = {k: $$[$0-2], v: $$[$0] }; 
break;
case 156:

			var $kv = {}
			$$[$0].map(function(v) { 
				$kv[v[0]] = v[1]
			})
			this.$ = {
				statement: 'REPLACE', 
				operation: 'putItem',
				dynamodb: {
					TableName: $$[$0-2],
					Item: $kv 
				},
			}
		
break;
case 168:

			var $kv = {}
			$$[$0].map(function(v) { $kv[v.k] = v.v })

			this.$ = {
				statement: 'DELETE', 
				operation: 'deleteItem',
				dynamodb: {
					TableName: $$[$0-2],
					Key: $kv,
				}
			}
		
break;
case 173:

			this.$ = {
				statement: 'SELECT', 
				operation: 'query',
				dynamodb: $$[$0-3].dynamodb,
			};
			yy.extend(this.$.dynamodb,$$[$0-2]);
			yy.extend(this.$.dynamodb,$$[$0-1]);
			yy.extend(this.$.dynamodb,$$[$0]);
		
break;
case 175:
 this.$ = { Limit: $$[$0] }; 
break;
case 176:
 this.$ = { ScanIndexForward: true }; 
break;
case 177:
 this.$ = { ScanIndexForward: false }; 
break;
case 178: case 271:
 this.$ = { ConsistentRead: false }; 
break;
case 179:
 this.$ = { ConsistentRead: true }; 
break;
case 181:
 this.$ = {distinct:true}; 
break;
case 182:
 this.$ = {all:true}; 
break;
case 185: case 275:
 this.$ = {type: 'star', star:true}; 
break;
case 186: case 276:
 this.$ = {type: 'column', column: $$[$0]}; 
break;
case 187: case 277:
 this.$ = {type: 'column', column: $$[$0-2], alias: $$[$0] }; 
break;
case 191:

			this.$ = { 
				//KeyConditionExpression: $$[$0],
				ExpressionAttributeNames: {},
				ExpressionAttributeValues: {},
			}; 
			
			this.$.ExpressionAttributeNames[ '#partitionKeyName' ] = $$[$0].partition.partitionKeyName
			this.$.ExpressionAttributeValues[ ':partitionKeyValue' ] = $$[$0].partition.partitionKeyValue
			this.$.KeyConditionExpression = ' #partitionKeyName =  :partitionKeyValue '

		
break;
case 192:

			this.$ = { 
				//KeyConditionExpression: $$[$0-2],
				ExpressionAttributeNames: {},
				ExpressionAttributeValues: {},
			}; 
			
			this.$.ExpressionAttributeNames[ '#partitionKeyName' ] = $$[$0-2].partition.partitionKeyName
			this.$.ExpressionAttributeValues[ ':partitionKeyValue' ] = $$[$0-2].partition.partitionKeyValue
			this.$.KeyConditionExpression = ' #partitionKeyName =  :partitionKeyValue '


			if ($$[$0].sort) {
				this.$.ExpressionAttributeNames[ '#sortKeyName' ] = $$[$0].sort.sortKeyName
				
				switch ($$[$0].sort.op) {
					case '=':
					case '>':
					case '>=':
					case '<':
					case '<=':
						this.$.ExpressionAttributeValues[ ':sortKeyValue' ] = $$[$0].sort.sortKeyValue
						this.$.KeyConditionExpression += ' AND #sortKeyName ' + $$[$0].sort.op + ' :sortKeyValue '
						
						break;
					case 'BETWEEN':
						this.$.ExpressionAttributeValues[ ':sortKeyValue1' ] = $$[$0].sort.sortKeyValue1
						this.$.ExpressionAttributeValues[ ':sortKeyValue2' ] = $$[$0].sort.sortKeyValue2
						this.$.KeyConditionExpression += ' AND #sortKeyName BETWEEN :sortKeyValue1 AND :sortKeyValue2'
						break;
					case 'BEGINS_WITH':

						if ($$[$0].sort.sortKeyValue.S.slice(-1) !== '%' )
							throw "LIKE '%string' must end with a % for sort key "

							
						$$[$0].sort.sortKeyValue.S = $$[$0].sort.sortKeyValue.S.slice(0,-1)
						
						this.$.ExpressionAttributeValues[ ':sortKeyValue' ] = $$[$0].sort.sortKeyValue
						this.$.KeyConditionExpression += ' AND begins_with ( #sortKeyName, :sortKeyValue ) '

						break;
				}
				
			}


		
break;
case 193: case 280:
 this.$ = {having: $$[$0]}; 
break;
case 195:

			this.$ = {
				dynamodb: {
					TableName: $$[$0-3],
					IndexName: $$[$0-2],
				},
				columns:$$[$0-4]
			};
			yy.extend(this.$.dynamodb,$$[$0-5]);
			yy.extend(this.$.dynamodb,$$[$0-1]);
			yy.extend(this.$.dynamodb,$$[$0]);

			// if we have star, then the rest does not matter
			if (this.$.columns.filter(function(c) { return c.type === 'star'}).length === 0) {
				if (!this.$.dynamodb.hasOwnProperty('ExpressionAttributeNames'))
					this.$.dynamodb.ExpressionAttributeNames = {}

				var ExpressionAttributeNames_from_projection = { }
				var ProjectionExpression = []
				this.$.columns.map(function(c) {
					if (c.type === "column") {
						var replaced_name = '#projection_' + c.column.split('-').join('_minus_').split('.').join('_dot_') 
						ExpressionAttributeNames_from_projection[replaced_name] = c.column;
						ProjectionExpression.push(replaced_name)
					}
					
				})
				
				yy.extend(this.$.dynamodb.ExpressionAttributeNames,ExpressionAttributeNames_from_projection);
				
				if (ProjectionExpression.length)
					this.$.dynamodb.ProjectionExpression = ProjectionExpression.join(' , ')
			
			}


		
break;
case 197: case 226: case 284:
 this.$ = {bind_parameter: $$[$0]}; 
break;
case 198: case 227: case 285:
 this.$ = {column: $$[$0]}; 
break;
case 199: case 228: case 286:
 this.$ = {op: 'AND', left: $$[$0-2], right: $$[$0]}; 
break;
case 200: case 229: case 287:
 this.$ = {op: 'OR', left: $$[$0-2], right: $$[$0]}; 
break;
case 201: case 230: case 288:
 this.$ = {op: '=', left: $$[$0-2], right: $$[$0]}; 
break;
case 202: case 231: case 289:
 this.$ = {op: '>', left: $$[$0-2], right: $$[$0]}; 
break;
case 203: case 232: case 290:
 this.$ = {op: '>=', left: $$[$0-2], right: $$[$0]}; 
break;
case 204: case 233: case 291:
 this.$ = {op: '<', left: $$[$0-2], right: $$[$0]}; 
break;
case 205: case 234: case 292:
 this.$ = {op: '<=', left: $$[$0-2], right: $$[$0]}; 
break;
case 206: case 235: case 293:
 this.$ = {op: 'BETWEEN', left: $$[$0-2], right:$$[$0] }; 
break;
case 207: case 236: case 294:
 this.$ = {op: 'LIKE', left:$$[$0-2], right: { type: 'string', string: $$[$0] } }; 
break;
case 208:
 
			this.$ = {
				partition: {
					partitionKeyName: $$[$0-2],
					partitionKeyValue: $$[$0]
				}
			}
		
break;
case 211:

			this.$ = {
				sort: {
					sortKeyName: $$[$0-2],
					sortKeyValue: $$[$0],
					op: '='
				}
			}
		
break;
case 212:

			this.$ = {
				sort: {
					sortKeyName: $$[$0-2],
					sortKeyValue: $$[$0],
					op: '>'
				}
			}
		
break;
case 213:

			this.$ = {
				sort: {
					sortKeyName: $$[$0-2],
					sortKeyValue: $$[$0],
					op: '>='
				}
			}
		
break;
case 214:

			this.$ = {
				sort: {
					sortKeyName: $$[$0-2],
					sortKeyValue: $$[$0],
					op: '<'
				}
			}
		
break;
case 215:

			this.$ = {
				sort: {
					sortKeyName: $$[$0-2],
					sortKeyValue: $$[$0],
					op: '<='
				}
			}
		
break;
case 216:

			this.$ = {
				sort: {
					sortKeyName: $$[$0-2],
					sortKeyValue1: $$[$0][0],
					sortKeyValue2: $$[$0][1],
					op: 'BETWEEN'
				}
			}
		
break;
case 217:

			this.$ = {
				sort: {
					sortKeyName: $$[$0-2],
					sortKeyValue: $$[$0],
					op: 'BEGINS_WITH'
				}
			}
		
break;
case 222:
 this.$ = {left: { type: 'number', number: $$[$0-2]}, right: {type: 'number', number: $$[$0] } }; 
break;
case 223:
 this.$ = {left: { type: 'string', string: $$[$0-2]}, right: {type: 'string', string: $$[$0] } }; 
break;
case 237: case 295:
 this.$ = {op: 'CONTAINS', left:$$[$0-2], right: { type: 'string', string: $$[$0] } }; 
break;
case 238: case 296:
 this.$ = {op: 'CONTAINS', left:$$[$0-2], right: { type: 'number', number: $$[$0] } }; 
break;
case 239: case 297:
 this.$ = {op: 'CONTAINS', left:$$[$0-2], right: { type: 'boolean', value: $$[$0] } }; 
break;
case 240:

			this.$ = {
				statement: 'CREATE_TABLE',
				operation: 'createTable',
				dynamodb: {
					TableName: $$[$0-6],
					AttributeDefinitions: $$[$0-4],
				}
				
			};
			yy.extend(this.$.dynamodb,$$[$0-2]); // extend with pk
			yy.extend(this.$.dynamodb,$$[$0-1]); // extend with indexes
		
break;
case 242:

			var indexes = {
				LocalSecondaryIndexes: [],
				GlobalSecondaryIndexes: []
			}
			
			$$[$0].map(function(idx) {
				if (idx.hasOwnProperty('LSI'))
					indexes.LocalSecondaryIndexes.push(idx.LSI)
				if (idx.hasOwnProperty('GSI'))
					indexes.GlobalSecondaryIndexes.push(idx.GSI)
			})
			this.$ = indexes
		
break;
case 245:

			this.$ = {}
			this.$[$$[$0-4]] = { 
				IndexName: $$[$0-5], 
				KeySchema: [ { AttributeName: $$[$0-2], KeyType: 'HASH' } ], 
				Projection: $$[$0],
			}
		
break;
case 246:

			this.$ = {}
			this.$[$$[$0-5]] = { 
				IndexName: $$[$0-6], 
				KeySchema: [ { AttributeName: $$[$0-3], KeyType: 'HASH' } ], 
				Projection: $$[$0-1],
				ProvisionedThroughput: $$[$0] 
			}
		
break;
case 247:

			this.$ = {}
			this.$[$$[$0-6]] = { 
				IndexName: $$[$0-7], 
				KeySchema: [ { AttributeName: $$[$0-4], KeyType: 'HASH' }, { AttributeName: $$[$0-2], KeyType: 'RANGE' } ], 
				Projection: $$[$0],
			}
		
break;
case 248:

			this.$ = {}
			this.$[$$[$0-7]] = { 
				IndexName: $$[$0-8], 
				KeySchema: [ { AttributeName: $$[$0-5], KeyType: 'HASH' }, { AttributeName: $$[$0-3], KeyType: 'RANGE' } ], 
				Projection: $$[$0-1],
				ProvisionedThroughput: $$[$0] 
			}
		
break;
case 249:
 this.$ = { KeySchema: [ { AttributeName: $$[$0-2], KeyType: 'HASH' }], ProvisionedThroughput: $$[$0] }  
break;
case 250:
 this.$ = { KeySchema: [ { AttributeName: $$[$0-4], KeyType: 'HASH' } , { AttributeName: $$[$0-2], KeyType: 'RANGE' } ], ProvisionedThroughput: $$[$0] }  
break;
case 251:
 this.$ = { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }; 
break;
case 252:
 this.$ = { ReadCapacityUnits: eval($$[$0-1]), WriteCapacityUnits: eval($$[$0]) } 
break;
case 253: case 254:
 this.$ = { ProjectionType: 'ALL' }; 
break;
case 255:
 this.$ = { ProjectionType: 'KEYS_ONLY' } 
break;
case 256:
 this.$ = { ProjectionType: 'INCLUDE', NonKeyAttributes: $$[$0-1] } 
break;
case 259:
 this.$ = $$[$0-2]; this.$.push($$[$0]) 
break;
case 261:
 this.$ = { AttributeName: $$[$0-1], AttributeType: 'S'}; 
break;
case 262:
 this.$ = { AttributeName: $$[$0-1], AttributeType: 'N'}; 
break;
case 263:

			this.$ = {
				statement: 'SHOW_TABLES',
				operation: 'listTables',
				dynamodb: {}
			}
		
break;
case 264:

			this.$ = {
				statement: 'DROP_TABLE',
				operation: 'deleteTable',
				dynamodb: {
					TableName: $$[$0]
				}
			};
		
break;
case 265:

			this.$ = {
				statement: 'DESCRIBE_TABLE',
				operation: 'describeTable',
				dynamodb: {
					TableName: $$[$0]
				}
			};
		
break;
case 266:

			this.$ = {
				statement: 'DROP_INDEX',
				operation: 'updateTable',
				dynamodb: {
					TableName: $$[$0],
					GlobalSecondaryIndexUpdates: [
						{
							Delete: {
								IndexName: $$[$0-2]
							}
						}
					]
				}
			};
		
break;
case 267:

			this.$ = {
				statement: 'SCAN', 
				operation: 'scan',
				dynamodb: $$[$0-2].dynamodb,
			};

			this.$.columns = $$[$0-2].columns
			this.$.having  = Object.keys($$[$0-2].having).length ? $$[$0-2].having : undefined;
			
			yy.extend(this.$.dynamodb, $$[$0-1]);
			yy.extend(this.$.dynamodb, $$[$0]);
		
break;
case 268:

			this.$ = {
				dynamodb: {
					TableName: $$[$0-2],
					IndexName: $$[$0-1],
				},
				columns:$$[$0-4],
				having: {},
			}; 
			yy.extend(this.$,$$[$0]); // filter


			// if we have star, then the rest does not matter
			if (this.$.columns.filter(function(c) { return c.type === 'star'}).length === 0) {
				if (!this.$.dynamodb.hasOwnProperty('ExpressionAttributeNames'))
					this.$.dynamodb.ExpressionAttributeNames = {}

				var ExpressionAttributeNames_from_projection = { }
				var ProjectionExpression = []
				this.$.columns.map(function(c) {
					if (c.type === "column") {
						var replaced_name = '#projection_' + c.column.split('-').join('_minus_').split('.').join('_dot_') 
						ExpressionAttributeNames_from_projection[replaced_name] = c.column;
						ProjectionExpression.push(replaced_name)
					}	
				})
				
				yy.extend(this.$.dynamodb.ExpressionAttributeNames,ExpressionAttributeNames_from_projection);
				
				if (ProjectionExpression.length)
					this.$.dynamodb.ProjectionExpression = ProjectionExpression.join(' , ')
			
			}


		
break;
case 270:
 this.$ = {Limit: $$[$0]}; 
break;
case 272:
 this.$ = { ConsistentRead: true  }; 
break;
}
},
table: [{3:1,4:2,7:3,8:4,9:5,10:6,11:7,12:8,13:9,14:10,15:11,16:12,17:13,18:14,79:$V0,90:$V1,98:$V2,101:$V3,105:15,129:$V4,144:$V5,163:$V6,165:$V7,166:$V8,168:24,171:$V9},{1:[3]},{5:[1,27],6:[1,28]},o($Va,[2,3]),o($Va,[2,4]),o($Va,[2,5]),o($Va,[2,6]),o($Va,[2,7]),o($Va,[2,8]),o($Va,[2,9]),o($Va,[2,10]),o($Va,[2,11]),o($Va,[2,12]),o($Va,[2,13]),o($Va,[2,14]),o($Vb,[2,176],{106:29,110:[1,30]}),{80:31,81:[2,122],86:[1,32]},{19:34,20:$Vc,21:$Vd,24:33},{81:[1,37]},{102:[1,38]},{145:[1,39]},{164:[1,40]},{122:[1,42],145:[1,41]},{145:[1,43]},o($Ve,[2,269],{169:44,109:[1,45]}),o($Vf,[2,180],{112:46,113:[1,47],114:[1,48]}),{19:52,20:$Vc,21:$Vd,117:$Vg,172:49,175:50},{1:[2,1]},{7:53,8:4,9:5,10:6,11:7,12:8,13:9,14:10,15:11,16:12,17:13,18:14,79:$V0,90:$V1,98:$V2,101:$V3,105:15,129:$V4,144:$V5,163:$V6,165:$V7,166:$V8,168:24,171:$V9},o($Ve,[2,174],{107:54,109:[1,55]}),o($Vb,[2,177]),{81:[1,56]},{81:[2,123]},{82:[1,57]},o([5,6,70,82,84,92,109,111,121,127],[2,19]),o($Vh,[2,15]),o($Vh,[2,16]),{19:34,20:$Vc,21:$Vd,24:58},{19:34,20:$Vc,21:$Vd,24:59},{19:34,20:$Vc,21:$Vd,24:60},o($Va,[2,263]),{19:34,20:$Vc,21:$Vd,24:61},{19:63,20:$Vc,21:$Vd,26:62},{19:34,20:$Vc,21:$Vd,24:64},o($Va,[2,271],{170:65,111:[1,66]}),{27:67,28:$Vi},{19:72,20:$Vc,21:$Vd,115:69,116:70,117:$Vj},o($Vf,[2,181]),o($Vf,[2,182]),{53:[1,74],102:[1,73]},o($Vk,[2,274]),o($Vk,[2,275]),o($Vk,[2,276],{118:[1,75]}),o($Va,[2,2]),o($Va,[2,178],{108:76,111:[1,77]}),{27:78,28:$Vi},{19:34,20:$Vc,21:$Vd,24:79},{19:82,20:$Vc,21:$Vd,91:80,94:81},{82:[1,83]},{92:[1,84]},{70:[1,85]},o($Va,[2,264]),{167:[1,86]},{167:[2,21]},o($Va,[2,265]),o($Va,[2,267]),o($Va,[2,272]),o($Ve,[2,270]),o([5,6,28,53,72,89,97,109,110,111,132,133,134,135,136,137,139,143],[2,22]),{53:[1,88],102:[1,89],119:87},o($Vk,[2,184]),o($Vk,[2,185]),o($Vk,[2,186],{118:[1,90]}),{19:34,20:$Vc,21:$Vd,24:91},{19:52,20:$Vc,21:$Vd,117:$Vg,175:92},{19:93,20:$Vc,21:$Vd},o($Va,[2,173]),o($Va,[2,179]),o($Ve,[2,175]),{82:[1,94],84:[1,95]},{53:[1,97],92:[1,96]},o($Vl,[2,140]),{89:[1,98],95:[1,99]},{19:102,20:$Vc,21:$Vd,99:100,100:101},{19:105,20:$Vc,21:$Vd,103:103,104:104},{19:108,20:$Vc,21:$Vd,146:106,161:107},{19:34,20:$Vc,21:$Vd,24:109},{92:[2,189],120:110,121:[1,111]},{19:72,20:$Vc,21:$Vd,116:112,117:$Vj},{19:34,20:$Vc,21:$Vd,24:113},{19:114,20:$Vc,21:$Vd},o($Vm,[2,278],{173:115,121:[1,116]}),o($Vk,[2,273]),o($Vk,[2,277]),{19:119,20:$Vc,21:$Vd,83:117,88:118},{70:$Vn,85:120,87:121},{19:125,20:$Vc,21:$Vd,93:123,96:124},{19:82,20:$Vc,21:$Vd,94:126},{28:$Vo,30:$Vp,31:$Vq,35:$Vr,36:$Vs,39:127,41:128,43:129,45:$Vt,46:130,47:136,48:[1,146],50:$Vu,56:132,59:131,60:$Vv,67:133,68:$Vw,73:134,76:135},{28:$Vo,41:147},o($Va,[2,156],{53:[1,148]}),o($Vx,[2,158]),{89:[1,149]},o($Va,[2,168]),o($Va,[2,169],{97:[1,150]}),{89:[1,151]},{53:[1,152]},{53:[2,260]},{28:[1,154],162:[1,153]},o($Va,[2,266]),{92:[1,156],123:155},{122:[1,157]},o($Vk,[2,183]),o([92,121],[2,188]),o($Vk,[2,187]),o($Vb,[2,281],{174:158,127:[1,159]}),{122:[1,160]},o($Va,[2,120],{53:[1,161]}),o($Vx,[2,128]),{89:[1,162]},o($Va,[2,121],{53:[1,163]}),o($Vx,[2,125]),{59:164,60:$Vv},o($Va,[2,138]),o($Va,[2,152],{97:[1,165]}),{89:[1,166]},o($Vl,[2,139]),o($Vl,[2,141]),o($Vl,[2,142]),o($Vl,[2,143]),o($Vl,[2,144]),o($Vl,[2,145]),o($Vl,[2,146]),o($Vl,[2,147]),o($Vl,[2,148]),o($Vl,[2,149]),o($Vl,[2,151]),o($Vy,[2,34]),o($Vy,[2,35]),o($Vy,[2,37]),o($Vz,[2,40]),o($Vz,[2,41]),o($Vz,[2,43]),o($VA,$VB,{65:167,66:168,19:169,20:$Vc,21:$Vd,30:$VC,31:$VD}),o($VE,$VF,{57:172,58:173,41:174,39:175,43:176,46:177,56:178,59:179,28:$Vo,30:$Vp,31:$Vq,35:$Vr,36:$Vs,45:$Vt,50:$Vu,60:$Vv}),{69:[1,180],74:[1,181],77:[1,182]},o($Vl,[2,44]),o($Vl,[2,150]),{19:102,20:$Vc,21:$Vd,100:183},{28:$Vo,30:$Vp,31:$Vq,35:$Vr,36:$Vs,39:184,41:185,43:186,45:$Vt,46:187,50:$Vu,56:189,59:188,60:$Vv,67:190,68:$Vw,73:191,76:192},{19:105,20:$Vc,21:$Vd,104:193},{28:$Vo,30:$Vp,31:$Vq,39:194,41:195},{19:108,20:$Vc,21:$Vd,147:196,155:[1,198],161:197},{53:[2,261]},{53:[2,262]},o($VG,[2,194],{126:199,127:[1,200]}),{19:202,20:$Vc,21:$Vd,124:201},{19:203,20:$Vc,21:$Vd},o($Vb,[2,268]),{19:208,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:205,35:$VK,36:$VL,37:206,131:$VM,176:204},{19:216,20:$Vc,21:$Vd},{19:119,20:$Vc,21:$Vd,88:217},{28:$Vo,30:$Vp,31:$Vq,35:$Vr,36:$Vs,39:218,41:219,43:220,45:$Vt,46:221,50:$Vu,56:223,59:222,60:$Vv,67:224,68:$Vw,73:225,76:226},{70:$Vn,87:227},{72:[1,228]},{19:125,20:$Vc,21:$Vd,96:229},{28:$Vo,30:$Vp,31:$Vq,39:230,41:231},{53:[1,233],62:[1,232]},o($VA,[2,89]),{64:[1,234]},{64:[1,235]},{64:[1,236]},{52:[1,237],53:[1,238]},o($VE,[2,57]),o($VE,[2,59]),o($VE,[2,60]),o($VE,[2,61]),o($VE,[2,62]),o($VE,[2,63]),o($VE,[2,64]),{70:[1,239]},{70:[1,240]},{70:[1,241]},o($Vx,[2,157]),o($Vx,[2,159]),o($Vx,[2,160]),o($Vx,[2,161]),o($Vx,[2,162]),o($Vx,[2,163]),o($Vx,[2,164]),o($Vx,[2,165]),o($Vx,[2,166]),o($Vx,[2,167]),o($Va,[2,170]),o($VN,[2,171]),o($VN,[2,172]),{53:[1,243],72:[2,241],148:242},{53:[2,259]},{156:[1,244]},o($VG,[2,195]),{19:249,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:246,35:$VK,36:$VL,37:247,128:245,131:$VO},o($VP,[2,191],{97:[1,250]}),{89:[1,251]},{92:[2,190]},o($Vb,[2,280],{89:$VQ,97:$VR,132:[1,253],133:$VS,134:$VT,135:$VU,136:$VV,137:$VW,139:$VX,143:$VY}),o($VZ,[2,282]),o($VZ,[2,283]),o($VZ,[2,284]),o($VZ,[2,285]),o($V_,[2,26]),o($V_,[2,27]),o($V_,[2,30]),o($V_,[2,31]),o($V_,[2,23]),o($V_,[2,24]),o($V_,[2,25]),o($Vm,[2,279]),o($Vx,[2,127]),o($Vx,[2,129]),o($Vx,[2,130]),o($Vx,[2,131]),o($Vx,[2,132]),o($Vx,[2,133]),o($Vx,[2,134]),o($Vx,[2,135]),o($Vx,[2,136]),o($Vx,[2,137]),o($Vx,[2,124]),o($Vx,[2,126]),o($Va,[2,153]),o($VN,[2,154]),o($VN,[2,155]),o([5,6,52,53,62,72,92],[2,87]),o($VA,$VB,{19:169,66:262,20:$Vc,21:$Vd,30:$VC,31:$VD}),{28:$Vo,30:$Vp,31:$Vq,35:$Vr,36:$Vs,39:264,41:263,43:265,45:$Vt,46:266,50:$Vu,56:267,59:268,60:$Vv},{28:$Vo,30:$Vp,31:$Vq,35:$Vr,36:$Vs,39:270,41:269,43:271,45:$Vt,46:272,50:$Vu,56:273,59:274,60:$Vv},{28:$Vo,30:$Vp,31:$Vq,35:$Vr,36:$Vs,39:276,41:275,43:277,45:$Vt,46:278,50:$Vu,56:279,59:280,60:$Vv},o($Vz,[2,55]),o($VE,$VF,{41:174,39:175,43:176,46:177,56:178,59:179,58:281,28:$Vo,30:$Vp,31:$Vq,35:$Vr,36:$Vs,45:$Vt,50:$Vu,60:$Vv}),{50:[1,282]},{50:[1,283]},{28:$V$,30:$V01,31:$V11,38:286,40:285,72:[2,117],78:284},{72:[1,290]},{122:$V21,149:291,150:292},{70:[1,294]},o($VG,[2,193],{89:$V31,97:$V41,132:[1,296],133:$V51,134:$V61,135:$V71,136:$V81,137:$V91,139:$Va1,143:$Vb1}),o($V_,[2,224]),o($V_,[2,225]),o($V_,[2,226]),o($V_,[2,227]),{19:306,20:$Vc,21:$Vd,125:305},{28:$Vo,30:$Vp,31:$Vq,39:309,41:308,140:307},{19:208,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:205,35:$VK,36:$VL,37:206,131:$VM,176:310},{19:208,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:205,35:$VK,36:$VL,37:206,131:$VM,176:311},{19:208,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:205,35:$VK,36:$VL,37:206,131:$VM,176:312},{19:208,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:205,35:$VK,36:$VL,37:206,131:$VM,176:313},{19:208,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:205,35:$VK,36:$VL,37:206,131:$VM,176:314},{19:208,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:205,35:$VK,36:$VL,37:206,131:$VM,176:315},{19:208,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:205,35:$VK,36:$VL,37:206,131:$VM,176:316},{27:318,28:$Vi,29:319,30:$VH,31:$VI,32:$VJ,138:317},{29:320,30:$VH,31:$VI,32:$VJ},{27:322,28:$Vi,29:321,30:$VH,31:$VI,32:$VJ,35:$VK,36:$VL,37:323},o($VA,[2,88]),o($VA,[2,91]),o($VA,[2,94]),o($VA,[2,97]),o($VA,[2,100]),o($VA,[2,103]),o($VA,[2,106]),o($VA,[2,92]),o($VA,[2,95]),o($VA,[2,98]),o($VA,[2,101]),o($VA,[2,104]),o($VA,[2,107]),o($VA,[2,93]),o($VA,[2,96]),o($VA,[2,99]),o($VA,[2,102]),o($VA,[2,105]),o($VA,[2,108]),o($VE,[2,56]),{30:$V01,31:$V11,38:325,71:324},{28:$V$,40:327,75:326},{72:[1,328]},{72:[2,118]},{72:[2,119]},o($Vc1,[2,36]),o($Vc1,[2,32]),o($Vc1,[2,33]),o($Va,[2,240]),{53:[1,329],72:[2,242]},o($Vd1,[2,244]),{19:330,20:$Vc,21:$Vd},{19:331,20:$Vc,21:$Vd},{19:249,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:246,35:$VK,36:$VL,37:247,128:332,131:$VO},{19:249,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:246,35:$VK,36:$VL,37:247,128:333,131:$VO},{19:249,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:246,35:$VK,36:$VL,37:247,128:334,131:$VO},{19:249,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:246,35:$VK,36:$VL,37:247,128:335,131:$VO},{19:249,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:246,35:$VK,36:$VL,37:247,128:336,131:$VO},{19:249,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:246,35:$VK,36:$VL,37:247,128:337,131:$VO},{19:249,20:$Vc,21:$Vd,27:209,28:$Vi,29:210,30:$VH,31:$VI,32:$VJ,33:246,35:$VK,36:$VL,37:247,128:338,131:$VO},{27:318,28:$Vi,29:319,30:$VH,31:$VI,32:$VJ,138:339},{29:340,30:$VH,31:$VI,32:$VJ},{27:342,28:$Vi,29:341,30:$VH,31:$VI,32:$VJ,35:$VK,36:$VL,37:343},o($VP,[2,192]),{89:[1,344],133:[1,345],134:[1,346],135:[1,347],136:[1,348],137:[1,349],139:[1,350]},o($Ve1,[2,208]),o($Ve1,[2,209]),o($Ve1,[2,210]),o([5,6,97,109,111,132],[2,286],{89:$VQ,133:$VS,134:$VT,135:$VU,136:$VV,137:$VW,139:$VX,143:$VY}),o([5,6,109,111,132],[2,287],{89:$VQ,97:$VR,133:$VS,134:$VT,135:$VU,136:$VV,137:$VW,139:$VX,143:$VY}),o([5,6,89,97,109,111,132,137,139,143],[2,288],{133:$VS,134:$VT,135:$VU,136:$VV}),o($VZ,[2,289]),o($VZ,[2,290]),o($VZ,[2,291]),o($VZ,[2,292]),o($VZ,[2,293]),{97:[1,351]},{97:[1,352]},o($VZ,[2,294]),o($VZ,[2,295]),o($VZ,[2,296]),o($VZ,[2,297]),{52:[1,353],53:[1,354]},o($VE,[2,111]),{52:[1,355],53:[1,356]},o($VE,[2,114]),o($Vf1,[2,115],{23:[1,357]}),{122:$V21,150:358},{151:[1,359],153:[1,360]},{53:[1,362],72:[1,361]},o([5,6,97,109,110,111,132],[2,228],{89:$V31,133:$V51,134:$V61,135:$V71,136:$V81,137:$V91,139:$Va1,143:$Vb1}),o([5,6,109,110,111,132],[2,229],{89:$V31,97:$V41,133:$V51,134:$V61,135:$V71,136:$V81,137:$V91,139:$Va1,143:$Vb1}),o([5,6,89,97,109,110,111,132,137,139,143],[2,230],{133:$V51,134:$V61,135:$V71,136:$V81}),o($V_,[2,231]),o($V_,[2,232]),o($V_,[2,233]),o($V_,[2,234]),o($V_,[2,235]),o($V_,[2,236]),o($V_,[2,237]),o($V_,[2,238]),o($V_,[2,239]),{28:$Vo,30:$Vp,31:$Vq,39:365,41:364,141:363},{28:$Vo,30:$Vp,31:$Vq,39:365,41:364,141:366},{28:$Vo,30:$Vp,31:$Vq,39:365,41:364,141:367},{28:$Vo,30:$Vp,31:$Vq,39:365,41:364,141:368},{28:$Vo,30:$Vp,31:$Vq,39:365,41:364,141:369},{28:$Vo,30:$Vp,31:$Vq,39:372,41:371,142:370},{30:$Vp,31:$Vq,39:373},{27:374,28:$Vi},{29:375,30:$VH,31:$VI,32:$VJ},{72:[1,376]},{30:$V01,31:$V11,38:377},{72:[1,378]},{28:$V$,40:379},{20:[1,380]},o($Vd1,[2,243]),{70:[1,381]},{70:[1,382]},o($Vd1,$Vg1,{154:383,157:$Vh1}),{19:385,20:$Vc,21:$Vd},o($VP,[2,211]),o($VP,[2,218]),o($VP,[2,219]),o($VP,[2,212]),o($VP,[2,213]),o($VP,[2,214]),o($VP,[2,215]),o($VP,[2,216]),{97:[1,386]},{97:[1,387]},o($VP,[2,217]),o($V_,[2,222]),o($V_,[2,223]),o($Vf1,[2,109]),o($VE,[2,110]),o($Vf1,[2,112]),o($VE,[2,113]),{70:[1,388]},{19:389,20:$Vc,21:$Vd},{19:390,20:$Vc,21:$Vd},o($Vd1,[2,249]),{27:391,28:$Vi},{72:[1,392]},{28:$Vo,41:393},{30:$Vp,31:$Vq,39:394},{72:[1,395]},{53:[1,397],72:[1,396]},{53:[1,399],72:[1,398]},{27:400,28:$Vi},o($Vd1,$Vg1,{154:401,157:$Vh1}),o($VP,[2,220]),o($VP,[2,221]),o($Vf1,[2,116]),o($Vd1,$Vi1,{152:402,158:$Vj1}),{19:404,20:$Vc,21:$Vd},o($Vk1,$Vi1,{152:405,158:$Vj1}),{19:406,20:$Vc,21:$Vd},o($Vd1,[2,252]),o($Vd1,[2,250]),o($Vd1,[2,245]),{70:[1,409],114:[1,407],159:[1,408]},{72:[1,410]},o($Vd1,$Vg1,{154:411,157:$Vh1}),{72:[1,412]},o($Vk1,[2,254]),o($Vk1,[2,255]),{19:414,20:$Vc,21:$Vd,160:413},o($Vd1,$Vi1,{152:415,158:$Vj1}),o($Vd1,[2,246]),o($Vk1,$Vi1,{152:416,158:$Vj1}),{53:[1,418],72:[1,417]},o($Vd1,[2,258]),o($Vd1,[2,247]),o($Vd1,$Vg1,{154:419,157:$Vh1}),o($Vk1,[2,256]),{19:420,20:$Vc,21:$Vd},o($Vd1,[2,248]),o($Vd1,[2,257])],
defaultActions: {27:[2,1],32:[2,123],63:[2,21],107:[2,260],153:[2,261],154:[2,262],197:[2,259],203:[2,190],285:[2,118],286:[2,119]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 21
break;
case 1:return 30
break;
case 2:return 31
break;
case 3:/* skip -- comments */
break;
case 4:/* skip whitespace */
break;
case 5:return 'ABORT'
break;
case 6:return 'ADD'
break;
case 7:return 'AFTER'
break;
case 8:return 'ALTER'
break;
case 9:return 'ANALYZE'
break;
case 10:return 97
break;
case 11:return 118
break;
case 12:return 'ASC'
break;
case 13:return 'ATTACH'
break;
case 14:return 'BEFORE'
break;
case 15:return 'BEGIN'
break;
case 16:return 137
break;
case 17:return 'BY'
break;
case 18:return 'CASCADE'
break;
case 19:return 'CASE'
break;
case 20:return 'CAST'
break;
case 21:return 'CHECK'
break;
case 22:return 'COLLATE'
break;
case 23:return 'COLUMN'
break;
case 24:return 'CONFLICT'
break;
case 25:return 111
break;
case 26:return 'CONSTRAINT'
break;
case 27:return 144
break;
case 28:return 'CROSS'
break;
case 29:return 'CURRENT DATE'
break;
case 30:return 'CURRENT TIME'
break;
case 31:return 'CURRENT TIMESTAMP'
break;
case 32:return 'DATABASE'
break;
case 33:return 'DEFAULT'
break;
case 34:return 'DEFERRABLE'
break;
case 35:return 'DEFERRED'
break;
case 36:return 101
break;
case 37:return 110
break;
case 38:return 'DETACH'
break;
case 39:return 113
break;
case 40:return 165
break;
case 41:return 166
break;
case 42:return 'EACH'
break;
case 43:return 'ELSE'
break;
case 44:return 'END'
break;
case 45:return 'ESCAPE'
break;
case 46:return 'EXCEPT'
break;
case 47:return 'EXCLUSIVE'
break;
case 48:return 'EXISTS'
break;
case 49:return 'EXPLAIN'
break;
case 50:return 'FAIL'
break;
case 51:return 'FOR'
break;
case 52:return 'FOREIGN'
break;
case 53:return 102
break;
case 54:return 'FULL'
break;
case 55:return 'GLOB'
break;
case 56:return 'GROUP'
break;
case 57:return 127
break;
case 58:return 'IF'
break;
case 59:return 86
break;
case 60:return 'IMMEDIATE'
break;
case 61:return 'IN'
break;
case 62:return 121
break;
case 63:return 122
break;
case 64:return 'INDEXED'
break;
case 65:return 'INITIALLY'
break;
case 66:return 'INNER'
break;
case 67:return 79
break;
case 68:return 'INSTEAD'
break;
case 69:return 'INTERSECT'
break;
case 70:return 81
break;
case 71:return 'IS'
break;
case 72:return 'ISNULL'
break;
case 73:return 'JOIN'
break;
case 74:return 156
break;
case 75:return 'LEFT'
break;
case 76:return 139
break;
case 77:return 143
break;
case 78:return 109
break;
case 79:return 'MATCH'
break;
case 80:return 'NATURAL'
break;
case 81:return 'NO'
break;
case 82:return 'NOT'
break;
case 83:return 'NOTNULL'
break;
case 84:return 45
break;
case 85:return 48
break;
case 86:return 'OF'
break;
case 87:return 'OFFSET'
break;
case 88:return 167
break;
case 89:return 132
break;
case 90:return 'ORDER'
break;
case 91:return 'OUTER'
break;
case 92:return 'PLAN'
break;
case 93:return 'PRAGMA'
break;
case 94:return 155
break;
case 95:return 'QUERY'
break;
case 96:return 'RAISE'
break;
case 97:return 'RECURSIVE'
break;
case 98:return 'REFERENCES'
break;
case 99:return 'REGEXP'
break;
case 100:return 'REINDEX'
break;
case 101:return 'RELEASE'
break;
case 102:return 'RENAME'
break;
case 103:return 98
break;
case 104:return 'RESTRICT'
break;
case 105:return 'RIGHT'
break;
case 106:return 'ROLLBACK'
break;
case 107:return 'ROW'
break;
case 108:return 129
break;
case 109:return 171
break;
case 110:return 82
break;
case 111:return 145
break;
case 112:return 'TEMP'
break;
case 113:return 'THEN'
break;
case 114:return 'TO'
break;
case 115:return 'TRIGGER'
break;
case 116:return 'UNION'
break;
case 117:return 'UNIQUE'
break;
case 118:return 90
break;
case 119:return 'USING'
break;
case 120:return 'VACUUM'
break;
case 121:return 84
break;
case 122:return 'VIEW'
break;
case 123:return 'WHEN'
break;
case 124:return 92
break;
case 125:return 'WITH'
break;
case 126:return 35
break;
case 127:return 36
break;
case 128:return 163
break;
case 129:return 164
break;
case 130:return 162
break;
case 131:return 28
break;
case 132:return 69
break;
case 133:return 74
break;
case 134:return 'BINARYSET'
break;
case 135:return 157
break;
case 136:return 153
break;
case 137:return 151
break;
case 138:return 158
break;
case 139:return 114
break;
case 140:return 159
break;
case 141:return 68
break;
case 142:return 'ALLOCATE'
break;
case 143:return 'ALTER'
break;
case 144:return 'ANALYZE'
break;
case 145:return 97
break;
case 146:return 'ANY'
break;
case 147:return 'ARCHIVE'
break;
case 148:return 'ARE'
break;
case 149:return 'ARRAY'
break;
case 150:return 118
break;
case 151:return 'ASC'
break;
case 152:return 'ASCII'
break;
case 153:return 'ASENSITIVE'
break;
case 154:return 'ASSERTION'
break;
case 155:return 'ASYMMETRIC'
break;
case 156:return 'AT'
break;
case 157:return 'ATOMIC'
break;
case 158:return 'ATTACH'
break;
case 159:return 'ATTRIBUTE'
break;
case 160:return 'AUTH'
break;
case 161:return 'AUTHORIZATION'
break;
case 162:return 'AUTHORIZE'
break;
case 163:return 'AUTO'
break;
case 164:return 'AVG'
break;
case 165:return 'BACK'
break;
case 166:return 'BACKUP'
break;
case 167:return 'BASE'
break;
case 168:return 'BATCH'
break;
case 169:return 'BEFORE'
break;
case 170:return 'BEGIN'
break;
case 171:return 137
break;
case 172:return 'BIGINT'
break;
case 173:return 'BINARY'
break;
case 174:return 'BIT'
break;
case 175:return 'BLOB'
break;
case 176:return 'BLOCK'
break;
case 177:return 'BOOLEAN'
break;
case 178:return 'BOTH'
break;
case 179:return 'BREADTH'
break;
case 180:return 'BUCKET'
break;
case 181:return 'BULK'
break;
case 182:return 'BY'
break;
case 183:return 'BYTE'
break;
case 184:return 'CALL'
break;
case 185:return 'CALLED'
break;
case 186:return 'CALLING'
break;
case 187:return 'CAPACITY'
break;
case 188:return 'CASCADE'
break;
case 189:return 'CASCADED'
break;
case 190:return 'CASE'
break;
case 191:return 'CAST'
break;
case 192:return 'CATALOG'
break;
case 193:return 'CHAR'
break;
case 194:return 'CHARACTER'
break;
case 195:return 'CHECK'
break;
case 196:return 'CLASS'
break;
case 197:return 'CLOB'
break;
case 198:return 'CLOSE'
break;
case 199:return 'CLUSTER'
break;
case 200:return 'CLUSTERED'
break;
case 201:return 'CLUSTERING'
break;
case 202:return 'CLUSTERS'
break;
case 203:return 'COALESCE'
break;
case 204:return 'COLLATE'
break;
case 205:return 'COLLATION'
break;
case 206:return 'COLLECTION'
break;
case 207:return 'COLUMN'
break;
case 208:return 'COLUMNS'
break;
case 209:return 'COMBINE'
break;
case 210:return 'COMMENT'
break;
case 211:return 'COMMIT'
break;
case 212:return 'COMPACT'
break;
case 213:return 'COMPILE'
break;
case 214:return 'COMPRESS'
break;
case 215:return 'CONDITION'
break;
case 216:return 'CONFLICT'
break;
case 217:return 'CONNECT'
break;
case 218:return 'CONNECTION'
break;
case 219:return 'CONSISTENCY'
break;
case 220:return 'CONSISTENT'
break;
case 221:return 'CONSTRAINT'
break;
case 222:return 'CONSTRAINTS'
break;
case 223:return 'CONSTRUCTOR'
break;
case 224:return 'CONSUMED'
break;
case 225:return 'CONTINUE'
break;
case 226:return 'CONVERT'
break;
case 227:return 'COPY'
break;
case 228:return 'CORRESPONDING'
break;
case 229:return 'COUNT'
break;
case 230:return 'COUNTER'
break;
case 231:return 144
break;
case 232:return 'CROSS'
break;
case 233:return 'CUBE'
break;
case 234:return 'CURRENT'
break;
case 235:return 'CURSOR'
break;
case 236:return 'CYCLE'
break;
case 237:return 'DATA'
break;
case 238:return 'DATABASE'
break;
case 239:return 77
break;
case 240:return 'DATETIME'
break;
case 241:return 'DAY'
break;
case 242:return 'DEALLOCATE'
break;
case 243:return 'DEC'
break;
case 244:return 'DECIMAL'
break;
case 245:return 'DECLARE'
break;
case 246:return 'DEFAULT'
break;
case 247:return 'DEFERRABLE'
break;
case 248:return 'DEFERRED'
break;
case 249:return 'DEFINE'
break;
case 250:return 'DEFINED'
break;
case 251:return 'DEFINITION'
break;
case 252:return 101
break;
case 253:return 'DELIMITED'
break;
case 254:return 'DEPTH'
break;
case 255:return 'DEREF'
break;
case 256:return 110
break;
case 257:return 166
break;
case 258:return 'DESCRIPTOR'
break;
case 259:return 'DETACH'
break;
case 260:return 'DETERMINISTIC'
break;
case 261:return 'DIAGNOSTICS'
break;
case 262:return 'DIRECTORIES'
break;
case 263:return 'DISABLE'
break;
case 264:return 'DISCONNECT'
break;
case 265:return 113
break;
case 266:return 'DISTRIBUTE'
break;
case 267:return 'DO'
break;
case 268:return 'DOMAIN'
break;
case 269:return 'DOUBLE'
break;
case 270:return 165
break;
case 271:return 'DUMP'
break;
case 272:return 'DURATION'
break;
case 273:return 'DYNAMIC'
break;
case 274:return 'EACH'
break;
case 275:return 'ELEMENT'
break;
case 276:return 'ELSE'
break;
case 277:return 'ELSEIF'
break;
case 278:return 'EMPTY'
break;
case 279:return 'ENABLE'
break;
case 280:return 'END'
break;
case 281:return 'EQUAL'
break;
case 282:return 'EQUALS'
break;
case 283:return 'ERROR'
break;
case 284:return 'ESCAPE'
break;
case 285:return 'ESCAPED'
break;
case 286:return 'EVAL'
break;
case 287:return 'EVALUATE'
break;
case 288:return 'EXCEEDED'
break;
case 289:return 'EXCEPT'
break;
case 290:return 'EXCEPTION'
break;
case 291:return 'EXCEPTIONS'
break;
case 292:return 'EXCLUSIVE'
break;
case 293:return 'EXEC'
break;
case 294:return 'EXECUTE'
break;
case 295:return 'EXISTS'
break;
case 296:return 'EXIT'
break;
case 297:return 'EXPLAIN'
break;
case 298:return 'EXPLODE'
break;
case 299:return 'EXPORT'
break;
case 300:return 'EXPRESSION'
break;
case 301:return 'EXTENDED'
break;
case 302:return 'EXTERNAL'
break;
case 303:return 'EXTRACT'
break;
case 304:return 'FAIL'
break;
case 305:return 36
break;
case 306:return 'FAMILY'
break;
case 307:return 'FETCH'
break;
case 308:return 'FIELDS'
break;
case 309:return 'FILE'
break;
case 310:return 'FILTER'
break;
case 311:return 'FILTERING'
break;
case 312:return 'FINAL'
break;
case 313:return 'FINISH'
break;
case 314:return 'FIRST'
break;
case 315:return 'FIXED'
break;
case 316:return 'FLATTERN'
break;
case 317:return 'FLOAT'
break;
case 318:return 'FOR'
break;
case 319:return 'FORCE'
break;
case 320:return 'FOREIGN'
break;
case 321:return 'FORMAT'
break;
case 322:return 'FORWARD'
break;
case 323:return 'FOUND'
break;
case 324:return 'FREE'
break;
case 325:return 102
break;
case 326:return 'FULL'
break;
case 327:return 'FUNCTION'
break;
case 328:return 'FUNCTIONS'
break;
case 329:return 'GENERAL'
break;
case 330:return 'GENERATE'
break;
case 331:return 'GET'
break;
case 332:return 'GLOB'
break;
case 333:return 'GLOBAL'
break;
case 334:return 'GO'
break;
case 335:return 'GOTO'
break;
case 336:return 'GRANT'
break;
case 337:return 'GREATER'
break;
case 338:return 'GROUP'
break;
case 339:return 'GROUPING'
break;
case 340:return 'HANDLER'
break;
case 341:return 'HASH'
break;
case 342:return 'HAVE'
break;
case 343:return 127
break;
case 344:return 'HEAP'
break;
case 345:return 'HIDDEN'
break;
case 346:return 'HOLD'
break;
case 347:return 'HOUR'
break;
case 348:return 'IDENTIFIED'
break;
case 349:return 'IDENTITY'
break;
case 350:return 'IF'
break;
case 351:return 86
break;
case 352:return 'IMMEDIATE'
break;
case 353:return 'IMPORT'
break;
case 354:return 'IN'
break;
case 355:return 'INCLUDING'
break;
case 356:return 'INCLUSIVE'
break;
case 357:return 'INCREMENT'
break;
case 358:return 'INCREMENTAL'
break;
case 359:return 122
break;
case 360:return 'INDEXED'
break;
case 361:return 'INDEXES'
break;
case 362:return 'INDICATOR'
break;
case 363:return 'INFINITE'
break;
case 364:return 'INITIALLY'
break;
case 365:return 'INLINE'
break;
case 366:return 'INNER'
break;
case 367:return 'INNTER'
break;
case 368:return 'INOUT'
break;
case 369:return 'INPUT'
break;
case 370:return 'INSENSITIVE'
break;
case 371:return 79
break;
case 372:return 'INSTEAD'
break;
case 373:return 'INT'
break;
case 374:return 'INTEGER'
break;
case 375:return 'INTERSECT'
break;
case 376:return 'INTERVAL'
break;
case 377:return 81
break;
case 378:return 'INVALIDATE'
break;
case 379:return 'IS'
break;
case 380:return 'ISOLATION'
break;
case 381:return 'ITEM'
break;
case 382:return 'ITEMS'
break;
case 383:return 'ITERATE'
break;
case 384:return 'JOIN'
break;
case 385:return 156
break;
case 386:return 'KEYS'
break;
case 387:return 'LAG'
break;
case 388:return 'LANGUAGE'
break;
case 389:return 'LARGE'
break;
case 390:return 'LAST'
break;
case 391:return 'LATERAL'
break;
case 392:return 'LEAD'
break;
case 393:return 'LEADING'
break;
case 394:return 'LEAVE'
break;
case 395:return 'LEFT'
break;
case 396:return 'LENGTH'
break;
case 397:return 'LESS'
break;
case 398:return 'LEVEL'
break;
case 399:return 139
break;
case 400:return 109
break;
case 401:return 'LIMITED'
break;
case 402:return 'LINES'
break;
case 403:return 'LIST'
break;
case 404:return 'LOAD'
break;
case 405:return 'LOCAL'
break;
case 406:return 'LOCALTIME'
break;
case 407:return 'LOCALTIMESTAMP'
break;
case 408:return 'LOCATION'
break;
case 409:return 'LOCATOR'
break;
case 410:return 'LOCK'
break;
case 411:return 'LOCKS'
break;
case 412:return 'LOG'
break;
case 413:return 'LOGED'
break;
case 414:return 'LONG'
break;
case 415:return 'LOOP'
break;
case 416:return 'LOWER'
break;
case 417:return 'MAP'
break;
case 418:return 'MATCH'
break;
case 419:return 'MATERIALIZED'
break;
case 420:return 'MAX'
break;
case 421:return 'MAXLEN'
break;
case 422:return 'MEMBER'
break;
case 423:return 'MERGE'
break;
case 424:return 'METHOD'
break;
case 425:return 'METRICS'
break;
case 426:return 'MIN'
break;
case 427:return 'MINUS'
break;
case 428:return 'MINUTE'
break;
case 429:return 'MISSING'
break;
case 430:return 'MOD'
break;
case 431:return 'MODE'
break;
case 432:return 'MODIFIES'
break;
case 433:return 'MODIFY'
break;
case 434:return 'MODULE'
break;
case 435:return 'MONTH'
break;
case 436:return 'MULTI'
break;
case 437:return 'MULTISET'
break;
case 438:return 'NAME'
break;
case 439:return 'NAMES'
break;
case 440:return 'NATIONAL'
break;
case 441:return 'NATURAL'
break;
case 442:return 'NCHAR'
break;
case 443:return 'NCLOB'
break;
case 444:return 68
break;
case 445:return 'NEXT'
break;
case 446:return 'NO'
break;
case 447:return 'NONE'
break;
case 448:return 'NOT'
break;
case 449:return 45
break;
case 450:return 'NULLIF'
break;
case 451:return 28
break;
case 452:return 'NUMERIC'
break;
case 453:return 'OBJECT'
break;
case 454:return 'OF'
break;
case 455:return 'OFFLINE'
break;
case 456:return 'OFFSET'
break;
case 457:return 'OLD'
break;
case 458:return 167
break;
case 459:return 'ONLINE'
break;
case 460:return 'ONLY'
break;
case 461:return 'OPAQUE'
break;
case 462:return 'OPEN'
break;
case 463:return 'OPERATOR'
break;
case 464:return 'OPTION'
break;
case 465:return 132
break;
case 466:return 'ORDER'
break;
case 467:return 'ORDINALITY'
break;
case 468:return 'OTHER'
break;
case 469:return 'OTHERS'
break;
case 470:return 'OUT'
break;
case 471:return 'OUTER'
break;
case 472:return 'OUTPUT'
break;
case 473:return 'OVER'
break;
case 474:return 'OVERLAPS'
break;
case 475:return 'OVERRIDE'
break;
case 476:return 'OWNER'
break;
case 477:return 'PAD'
break;
case 478:return 'PARALLEL'
break;
case 479:return 'PARAMETER'
break;
case 480:return 'PARAMETERS'
break;
case 481:return 'PARTIAL'
break;
case 482:return 'PARTITION'
break;
case 483:return 'PARTITIONED'
break;
case 484:return 'PARTITIONS'
break;
case 485:return 'PATH'
break;
case 486:return 'PERCENT'
break;
case 487:return 'PERCENTILE'
break;
case 488:return 'PERMISSION'
break;
case 489:return 'PERMISSIONS'
break;
case 490:return 'PIPE'
break;
case 491:return 'PIPELINED'
break;
case 492:return 'PLAN'
break;
case 493:return 'POOL'
break;
case 494:return 'POSITION'
break;
case 495:return 'PRECISION'
break;
case 496:return 'PREPARE'
break;
case 497:return 'PRESERVE'
break;
case 498:return 155
break;
case 499:return 'PRIOR'
break;
case 500:return 'PRIVATE'
break;
case 501:return 'PRIVILEGES'
break;
case 502:return 'PROCEDURE'
break;
case 503:return 'PROCESSED'
break;
case 504:return 'PROJECT'
break;
case 505:return 158
break;
case 506:return 'PROPERTY'
break;
case 507:return 'PROVISIONING'
break;
case 508:return 'PUBLIC'
break;
case 509:return 'PUT'
break;
case 510:return 'QUERY'
break;
case 511:return 'QUIT'
break;
case 512:return 'QUORUM'
break;
case 513:return 'RAISE'
break;
case 514:return 'RANDOM'
break;
case 515:return 'RANGE'
break;
case 516:return 'RANK'
break;
case 517:return 'RAW'
break;
case 518:return 'READ'
break;
case 519:return 'READS'
break;
case 520:return 'REAL'
break;
case 521:return 'REBUILD'
break;
case 522:return 'RECORD'
break;
case 523:return 'RECURSIVE'
break;
case 524:return 'REDUCE'
break;
case 525:return 'REF'
break;
case 526:return 'REFERENCE'
break;
case 527:return 'REFERENCES'
break;
case 528:return 'REFERENCING'
break;
case 529:return 'REGEXP'
break;
case 530:return 'REGION'
break;
case 531:return 'REINDEX'
break;
case 532:return 'RELATIVE'
break;
case 533:return 'RELEASE'
break;
case 534:return 'REMAINDER'
break;
case 535:return 'RENAME'
break;
case 536:return 'REPEAT'
break;
case 537:return 98
break;
case 538:return 'REQUEST'
break;
case 539:return 'RESET'
break;
case 540:return 'RESIGNAL'
break;
case 541:return 'RESOURCE'
break;
case 542:return 'RESPONSE'
break;
case 543:return 'RESTORE'
break;
case 544:return 'RESTRICT'
break;
case 545:return 'RESULT'
break;
case 546:return 'RETURN'
break;
case 547:return 'RETURNING'
break;
case 548:return 'RETURNS'
break;
case 549:return 'REVERSE'
break;
case 550:return 'REVOKE'
break;
case 551:return 'RIGHT'
break;
case 552:return 'ROLE'
break;
case 553:return 'ROLES'
break;
case 554:return 'ROLLBACK'
break;
case 555:return 'ROLLUP'
break;
case 556:return 'ROUTINE'
break;
case 557:return 'ROW'
break;
case 558:return 'ROWS'
break;
case 559:return 'RULE'
break;
case 560:return 'RULES'
break;
case 561:return 'SAMPLE'
break;
case 562:return 'SATISFIES'
break;
case 563:return 'SAVE'
break;
case 564:return 'SAVEPOINT'
break;
case 565:return 171
break;
case 566:return 'SCHEMA'
break;
case 567:return 'SCOPE'
break;
case 568:return 'SCROLL'
break;
case 569:return 'SEARCH'
break;
case 570:return 'SECOND'
break;
case 571:return 'SECTION'
break;
case 572:return 'SEGMENT'
break;
case 573:return 'SEGMENTS'
break;
case 574:return 129
break;
case 575:return 'SELF'
break;
case 576:return 'SEMI'
break;
case 577:return 'SENSITIVE'
break;
case 578:return 'SEPARATE'
break;
case 579:return 'SEQUENCE'
break;
case 580:return 'SERIALIZABLE'
break;
case 581:return 'SESSION'
break;
case 582:return 82
break;
case 583:return 'SETS'
break;
case 584:return 'SHARD'
break;
case 585:return 'SHARE'
break;
case 586:return 'SHARED'
break;
case 587:return 'SHORT'
break;
case 588:return 163
break;
case 589:return 'SIGNAL'
break;
case 590:return 'SIMILAR'
break;
case 591:return 'SIZE'
break;
case 592:return 'SKEWED'
break;
case 593:return 'SMALLINT'
break;
case 594:return 'SNAPSHOT'
break;
case 595:return 'SOME'
break;
case 596:return 'SOURCE'
break;
case 597:return 'SPACE'
break;
case 598:return 'SPACES'
break;
case 599:return 'SPARSE'
break;
case 600:return 'SPECIFIC'
break;
case 601:return 'SPECIFICTYPE'
break;
case 602:return 'SPLIT'
break;
case 603:return 'SQL'
break;
case 604:return 'SQLCODE'
break;
case 605:return 'SQLERROR'
break;
case 606:return 'SQLEXCEPTION'
break;
case 607:return 'SQLSTATE'
break;
case 608:return 'SQLWARNING'
break;
case 609:return 'START'
break;
case 610:return 'STATE'
break;
case 611:return 'STATIC'
break;
case 612:return 'STATUS'
break;
case 613:return 'STORAGE'
break;
case 614:return 'STORE'
break;
case 615:return 'STORED'
break;
case 616:return 'STREAM'
break;
case 617:return 162
break;
case 618:return 'STRUCT'
break;
case 619:return 'STYLE'
break;
case 620:return 'SUB'
break;
case 621:return 'SUBMULTISET'
break;
case 622:return 'SUBPARTITION'
break;
case 623:return 'SUBSTRING'
break;
case 624:return 'SUBTYPE'
break;
case 625:return 'SUM'
break;
case 626:return 'SUPER'
break;
case 627:return 'SYMMETRIC'
break;
case 628:return 'SYNONYM'
break;
case 629:return 'SYSTEM'
break;
case 630:return 145
break;
case 631:return 'TABLESAMPLE'
break;
case 632:return 'TEMP'
break;
case 633:return 'TEMPORARY'
break;
case 634:return 'TERMINATED'
break;
case 635:return 'TEXT'
break;
case 636:return 'THAN'
break;
case 637:return 'THEN'
break;
case 638:return 157
break;
case 639:return 'TIME'
break;
case 640:return 'TIMESTAMP'
break;
case 641:return 'TIMEZONE'
break;
case 642:return 'TINYINT'
break;
case 643:return 'TO'
break;
case 644:return 'TOKEN'
break;
case 645:return 'TOTAL'
break;
case 646:return 'TOUCH'
break;
case 647:return 'TRAILING'
break;
case 648:return 'TRANSACTION'
break;
case 649:return 'TRANSFORM'
break;
case 650:return 'TRANSLATE'
break;
case 651:return 'TRANSLATION'
break;
case 652:return 'TREAT'
break;
case 653:return 'TRIGGER'
break;
case 654:return 'TRIM'
break;
case 655:return 35
break;
case 656:return 'TRUNCATE'
break;
case 657:return 'TTL'
break;
case 658:return 'TUPLE'
break;
case 659:return 'TYPE'
break;
case 660:return 'UNDER'
break;
case 661:return 'UNDO'
break;
case 662:return 'UNION'
break;
case 663:return 'UNIQUE'
break;
case 664:return 'UNIT'
break;
case 665:return 'UNKNOWN'
break;
case 666:return 'UNLOGGED'
break;
case 667:return 'UNNEST'
break;
case 668:return 'UNPROCESSED'
break;
case 669:return 'UNSIGNED'
break;
case 670:return 'UNTIL'
break;
case 671:return 90
break;
case 672:return 'UPPER'
break;
case 673:return 'URL'
break;
case 674:return 'USAGE'
break;
case 675:return 121
break;
case 676:return 'USER'
break;
case 677:return 'USERS'
break;
case 678:return 'USING'
break;
case 679:return 'UUID'
break;
case 680:return 'VACUUM'
break;
case 681:return 'VALUE'
break;
case 682:return 'VALUED'
break;
case 683:return 84
break;
case 684:return 'VARCHAR'
break;
case 685:return 'VARIABLE'
break;
case 686:return 'VARIANCE'
break;
case 687:return 'VARINT'
break;
case 688:return 'VARYING'
break;
case 689:return 'VIEW'
break;
case 690:return 'VIEWS'
break;
case 691:return 'VIRTUAL'
break;
case 692:return 'VOID'
break;
case 693:return 'WAIT'
break;
case 694:return 'WHEN'
break;
case 695:return 'WHENEVER'
break;
case 696:return 92
break;
case 697:return 'WHILE'
break;
case 698:return 'WINDOW'
break;
case 699:return 'WITH'
break;
case 700:return 'WITHIN'
break;
case 701:return 'WITHOUT'
break;
case 702:return 'WORK'
break;
case 703:return 'WRAPPED'
break;
case 704:return 'WRITE'
break;
case 705:return 'YEAR'
break;
case 706:return 'ZONE'
break;
case 707:return 'JSON'
break;
case 708:return 28
break;
case 709:return 28
break;
case 710:return 'TILDEs'
break;
case 711:return 95
break;
case 712:return 'PLUS'
break;
case 713:return 'MINUS'
break;
case 714:return 117
break;
case 715:return 'SLASH'
break;
case 716:return 'REM'
break;
case 717:return 'RSHIFT'
break;
case 718:return 'LSHIFT'
break;
case 719:return 'NE'
break;
case 720:return 'NE'
break;
case 721:return 134
break;
case 722:return 133
break;
case 723:return 136
break;
case 724:return 135
break;
case 725:return 89
break;
case 726:return 'BITAND'
break;
case 727:return 'BITOR'
break;
case 728:return 70
break;
case 729:return 72
break;
case 730:return 60
break;
case 731:return 62
break;
case 732:return 50
break;
case 733:return 52
break;
case 734:return 23
break;
case 735:return 53
break;
case 736:return 64
break;
case 737:return 6
break;
case 738:return 'DOLLAR'
break;
case 739:return 'QUESTION'
break;
case 740:return 'CARET'
break;
case 741:return 20
break;
case 742:return 5
break;
case 743:return 'INVALID'
break;
}
},
rules: [/^(?:([`](\\.|[^"]|\\")*?[`])+)/i,/^(?:(['](\\.|[^']|\\')*?['])+)/i,/^(?:(["](\\.|[^"]|\\")*?["])+)/i,/^(?:--(.*?)($|\r\n|\r|\n))/i,/^(?:\s+)/i,/^(?:ABORT\b)/i,/^(?:ADD\b)/i,/^(?:AFTER\b)/i,/^(?:ALTER\b)/i,/^(?:ANALYZE\b)/i,/^(?:AND\b)/i,/^(?:AS\b)/i,/^(?:ASC\b)/i,/^(?:ATTACH\b)/i,/^(?:BEFORE\b)/i,/^(?:BEGIN\b)/i,/^(?:BETWEEN\b)/i,/^(?:BY\b)/i,/^(?:CASCADE\b)/i,/^(?:CASE\b)/i,/^(?:CAST\b)/i,/^(?:CHECK\b)/i,/^(?:COLLATE\b)/i,/^(?:COLUMN\b)/i,/^(?:CONFLICT\b)/i,/^(?:CONSISTENT_READ\b)/i,/^(?:CONSTRAINT\b)/i,/^(?:CREATE\b)/i,/^(?:CROSS\b)/i,/^(?:CURRENT_DATE\b)/i,/^(?:CURRENT_TIME\b)/i,/^(?:CURRENT_TIMESTAMP\b)/i,/^(?:DATABASE\b)/i,/^(?:DEFAULT\b)/i,/^(?:DEFERRABLE\b)/i,/^(?:DEFERRED\b)/i,/^(?:DELETE\b)/i,/^(?:DESC\b)/i,/^(?:DETACH\b)/i,/^(?:DISTINCT\b)/i,/^(?:DROP\b)/i,/^(?:DESCRIBE\b)/i,/^(?:EACH\b)/i,/^(?:ELSE\b)/i,/^(?:END\b)/i,/^(?:ESCAPE\b)/i,/^(?:EXCEPT\b)/i,/^(?:EXCLUSIVE\b)/i,/^(?:EXISTS\b)/i,/^(?:EXPLAIN\b)/i,/^(?:FAIL\b)/i,/^(?:FOR\b)/i,/^(?:FOREIGN\b)/i,/^(?:FROM\b)/i,/^(?:FULL\b)/i,/^(?:GLOB\b)/i,/^(?:GROUP\b)/i,/^(?:HAVING\b)/i,/^(?:IF\b)/i,/^(?:IGNORE\b)/i,/^(?:IMMEDIATE\b)/i,/^(?:IN\b)/i,/^(?:USE\b)/i,/^(?:INDEX\b)/i,/^(?:INDEXED\b)/i,/^(?:INITIALLY\b)/i,/^(?:INNER\b)/i,/^(?:INSERT\b)/i,/^(?:INSTEAD\b)/i,/^(?:INTERSECT\b)/i,/^(?:INTO\b)/i,/^(?:IS\b)/i,/^(?:ISNULL\b)/i,/^(?:JOIN\b)/i,/^(?:KEY\b)/i,/^(?:LEFT\b)/i,/^(?:LIKE\b)/i,/^(?:CONTAINS\b)/i,/^(?:LIMIT\b)/i,/^(?:MATCH\b)/i,/^(?:NATURAL\b)/i,/^(?:NO\b)/i,/^(?:NOT\b)/i,/^(?:NOTNULL\b)/i,/^(?:NULL\b)/i,/^(?:UNDEFINED\b)/i,/^(?:OF\b)/i,/^(?:OFFSET\b)/i,/^(?:ON\b)/i,/^(?:OR\b)/i,/^(?:ORDER\b)/i,/^(?:OUTER\b)/i,/^(?:PLAN\b)/i,/^(?:PRAGMA\b)/i,/^(?:PRIMARY\b)/i,/^(?:QUERY\b)/i,/^(?:RAISE\b)/i,/^(?:RECURSIVE\b)/i,/^(?:REFERENCES\b)/i,/^(?:REGEXP\b)/i,/^(?:REINDEX\b)/i,/^(?:RELEASE\b)/i,/^(?:RENAME\b)/i,/^(?:REPLACE\b)/i,/^(?:RESTRICT\b)/i,/^(?:RIGHT\b)/i,/^(?:ROLLBACK\b)/i,/^(?:ROW\b)/i,/^(?:SELECT\b)/i,/^(?:SCAN\b)/i,/^(?:SET\b)/i,/^(?:TABLE\b)/i,/^(?:TEMP\b)/i,/^(?:THEN\b)/i,/^(?:TO\b)/i,/^(?:TRIGGER\b)/i,/^(?:UNION\b)/i,/^(?:UNIQUE\b)/i,/^(?:UPDATE\b)/i,/^(?:USING\b)/i,/^(?:VACUUM\b)/i,/^(?:VALUES\b)/i,/^(?:VIEW\b)/i,/^(?:WHEN\b)/i,/^(?:WHERE\b)/i,/^(?:WITH\b)/i,/^(?:TRUE\b)/i,/^(?:FALSE\b)/i,/^(?:SHOW\b)/i,/^(?:TABLES\b)/i,/^(?:STRING\b)/i,/^(?:NUMBER\b)/i,/^(?:STRINGSET\b)/i,/^(?:NUMBERSET\b)/i,/^(?:BINARYSET\b)/i,/^(?:THROUGHPUT\b)/i,/^(?:GSI\b)/i,/^(?:LSI\b)/i,/^(?:PROJECTION\b)/i,/^(?:ALL\b)/i,/^(?:KEYS_ONLY\b)/i,/^(?:NEW\b)/i,/^(?:ALLOCATE\b)/i,/^(?:ALTER\b)/i,/^(?:ANALYZE\b)/i,/^(?:AND\b)/i,/^(?:ANY\b)/i,/^(?:ARCHIVE\b)/i,/^(?:ARE\b)/i,/^(?:ARRAY\b)/i,/^(?:AS\b)/i,/^(?:ASC\b)/i,/^(?:ASCII\b)/i,/^(?:ASENSITIVE\b)/i,/^(?:ASSERTION\b)/i,/^(?:ASYMMETRIC\b)/i,/^(?:AT\b)/i,/^(?:ATOMIC\b)/i,/^(?:ATTACH\b)/i,/^(?:ATTRIBUTE\b)/i,/^(?:AUTH\b)/i,/^(?:AUTHORIZATION\b)/i,/^(?:AUTHORIZE\b)/i,/^(?:AUTO\b)/i,/^(?:AVG\b)/i,/^(?:BACK\b)/i,/^(?:BACKUP\b)/i,/^(?:BASE\b)/i,/^(?:BATCH\b)/i,/^(?:BEFORE\b)/i,/^(?:BEGIN\b)/i,/^(?:BETWEEN\b)/i,/^(?:BIGINT\b)/i,/^(?:BINARY\b)/i,/^(?:BIT\b)/i,/^(?:BLOB\b)/i,/^(?:BLOCK\b)/i,/^(?:BOOLEAN\b)/i,/^(?:BOTH\b)/i,/^(?:BREADTH\b)/i,/^(?:BUCKET\b)/i,/^(?:BULK\b)/i,/^(?:BY\b)/i,/^(?:BYTE\b)/i,/^(?:CALL\b)/i,/^(?:CALLED\b)/i,/^(?:CALLING\b)/i,/^(?:CAPACITY\b)/i,/^(?:CASCADE\b)/i,/^(?:CASCADED\b)/i,/^(?:CASE\b)/i,/^(?:CAST\b)/i,/^(?:CATALOG\b)/i,/^(?:CHAR\b)/i,/^(?:CHARACTER\b)/i,/^(?:CHECK\b)/i,/^(?:CLASS\b)/i,/^(?:CLOB\b)/i,/^(?:CLOSE\b)/i,/^(?:CLUSTER\b)/i,/^(?:CLUSTERED\b)/i,/^(?:CLUSTERING\b)/i,/^(?:CLUSTERS\b)/i,/^(?:COALESCE\b)/i,/^(?:COLLATE\b)/i,/^(?:COLLATION\b)/i,/^(?:COLLECTION\b)/i,/^(?:COLUMN\b)/i,/^(?:COLUMNS\b)/i,/^(?:COMBINE\b)/i,/^(?:COMMENT\b)/i,/^(?:COMMIT\b)/i,/^(?:COMPACT\b)/i,/^(?:COMPILE\b)/i,/^(?:COMPRESS\b)/i,/^(?:CONDITION\b)/i,/^(?:CONFLICT\b)/i,/^(?:CONNECT\b)/i,/^(?:CONNECTION\b)/i,/^(?:CONSISTENCY\b)/i,/^(?:CONSISTENT\b)/i,/^(?:CONSTRAINT\b)/i,/^(?:CONSTRAINTS\b)/i,/^(?:CONSTRUCTOR\b)/i,/^(?:CONSUMED\b)/i,/^(?:CONTINUE\b)/i,/^(?:CONVERT\b)/i,/^(?:COPY\b)/i,/^(?:CORRESPONDING\b)/i,/^(?:COUNT\b)/i,/^(?:COUNTER\b)/i,/^(?:CREATE\b)/i,/^(?:CROSS\b)/i,/^(?:CUBE\b)/i,/^(?:CURRENT\b)/i,/^(?:CURSOR\b)/i,/^(?:CYCLE\b)/i,/^(?:DATA\b)/i,/^(?:DATABASE\b)/i,/^(?:DATE\b)/i,/^(?:DATETIME\b)/i,/^(?:DAY\b)/i,/^(?:DEALLOCATE\b)/i,/^(?:DEC\b)/i,/^(?:DECIMAL\b)/i,/^(?:DECLARE\b)/i,/^(?:DEFAULT\b)/i,/^(?:DEFERRABLE\b)/i,/^(?:DEFERRED\b)/i,/^(?:DEFINE\b)/i,/^(?:DEFINED\b)/i,/^(?:DEFINITION\b)/i,/^(?:DELETE\b)/i,/^(?:DELIMITED\b)/i,/^(?:DEPTH\b)/i,/^(?:DEREF\b)/i,/^(?:DESC\b)/i,/^(?:DESCRIBE\b)/i,/^(?:DESCRIPTOR\b)/i,/^(?:DETACH\b)/i,/^(?:DETERMINISTIC\b)/i,/^(?:DIAGNOSTICS\b)/i,/^(?:DIRECTORIES\b)/i,/^(?:DISABLE\b)/i,/^(?:DISCONNECT\b)/i,/^(?:DISTINCT\b)/i,/^(?:DISTRIBUTE\b)/i,/^(?:DO\b)/i,/^(?:DOMAIN\b)/i,/^(?:DOUBLE\b)/i,/^(?:DROP\b)/i,/^(?:DUMP\b)/i,/^(?:DURATION\b)/i,/^(?:DYNAMIC\b)/i,/^(?:EACH\b)/i,/^(?:ELEMENT\b)/i,/^(?:ELSE\b)/i,/^(?:ELSEIF\b)/i,/^(?:EMPTY\b)/i,/^(?:ENABLE\b)/i,/^(?:END\b)/i,/^(?:EQUAL\b)/i,/^(?:EQUALS\b)/i,/^(?:ERROR\b)/i,/^(?:ESCAPE\b)/i,/^(?:ESCAPED\b)/i,/^(?:EVAL\b)/i,/^(?:EVALUATE\b)/i,/^(?:EXCEEDED\b)/i,/^(?:EXCEPT\b)/i,/^(?:EXCEPTION\b)/i,/^(?:EXCEPTIONS\b)/i,/^(?:EXCLUSIVE\b)/i,/^(?:EXEC\b)/i,/^(?:EXECUTE\b)/i,/^(?:EXISTS\b)/i,/^(?:EXIT\b)/i,/^(?:EXPLAIN\b)/i,/^(?:EXPLODE\b)/i,/^(?:EXPORT\b)/i,/^(?:EXPRESSION\b)/i,/^(?:EXTENDED\b)/i,/^(?:EXTERNAL\b)/i,/^(?:EXTRACT\b)/i,/^(?:FAIL\b)/i,/^(?:FALSE\b)/i,/^(?:FAMILY\b)/i,/^(?:FETCH\b)/i,/^(?:FIELDS\b)/i,/^(?:FILE\b)/i,/^(?:FILTER\b)/i,/^(?:FILTERING\b)/i,/^(?:FINAL\b)/i,/^(?:FINISH\b)/i,/^(?:FIRST\b)/i,/^(?:FIXED\b)/i,/^(?:FLATTERN\b)/i,/^(?:FLOAT\b)/i,/^(?:FOR\b)/i,/^(?:FORCE\b)/i,/^(?:FOREIGN\b)/i,/^(?:FORMAT\b)/i,/^(?:FORWARD\b)/i,/^(?:FOUND\b)/i,/^(?:FREE\b)/i,/^(?:FROM\b)/i,/^(?:FULL\b)/i,/^(?:FUNCTION\b)/i,/^(?:FUNCTIONS\b)/i,/^(?:GENERAL\b)/i,/^(?:GENERATE\b)/i,/^(?:GET\b)/i,/^(?:GLOB\b)/i,/^(?:GLOBAL\b)/i,/^(?:GO\b)/i,/^(?:GOTO\b)/i,/^(?:GRANT\b)/i,/^(?:GREATER\b)/i,/^(?:GROUP\b)/i,/^(?:GROUPING\b)/i,/^(?:HANDLER\b)/i,/^(?:HASH\b)/i,/^(?:HAVE\b)/i,/^(?:HAVING\b)/i,/^(?:HEAP\b)/i,/^(?:HIDDEN\b)/i,/^(?:HOLD\b)/i,/^(?:HOUR\b)/i,/^(?:IDENTIFIED\b)/i,/^(?:IDENTITY\b)/i,/^(?:IF\b)/i,/^(?:IGNORE\b)/i,/^(?:IMMEDIATE\b)/i,/^(?:IMPORT\b)/i,/^(?:IN\b)/i,/^(?:INCLUDING\b)/i,/^(?:INCLUSIVE\b)/i,/^(?:INCREMENT\b)/i,/^(?:INCREMENTAL\b)/i,/^(?:INDEX\b)/i,/^(?:INDEXED\b)/i,/^(?:INDEXES\b)/i,/^(?:INDICATOR\b)/i,/^(?:INFINITE\b)/i,/^(?:INITIALLY\b)/i,/^(?:INLINE\b)/i,/^(?:INNER\b)/i,/^(?:INNTER\b)/i,/^(?:INOUT\b)/i,/^(?:INPUT\b)/i,/^(?:INSENSITIVE\b)/i,/^(?:INSERT\b)/i,/^(?:INSTEAD\b)/i,/^(?:INT\b)/i,/^(?:INTEGER\b)/i,/^(?:INTERSECT\b)/i,/^(?:INTERVAL\b)/i,/^(?:INTO\b)/i,/^(?:INVALIDATE\b)/i,/^(?:IS\b)/i,/^(?:ISOLATION\b)/i,/^(?:ITEM\b)/i,/^(?:ITEMS\b)/i,/^(?:ITERATE\b)/i,/^(?:JOIN\b)/i,/^(?:KEY\b)/i,/^(?:KEYS\b)/i,/^(?:LAG\b)/i,/^(?:LANGUAGE\b)/i,/^(?:LARGE\b)/i,/^(?:LAST\b)/i,/^(?:LATERAL\b)/i,/^(?:LEAD\b)/i,/^(?:LEADING\b)/i,/^(?:LEAVE\b)/i,/^(?:LEFT\b)/i,/^(?:LENGTH\b)/i,/^(?:LESS\b)/i,/^(?:LEVEL\b)/i,/^(?:LIKE\b)/i,/^(?:LIMIT\b)/i,/^(?:LIMITED\b)/i,/^(?:LINES\b)/i,/^(?:LIST\b)/i,/^(?:LOAD\b)/i,/^(?:LOCAL\b)/i,/^(?:LOCALTIME\b)/i,/^(?:LOCALTIMESTAMP\b)/i,/^(?:LOCATION\b)/i,/^(?:LOCATOR\b)/i,/^(?:LOCK\b)/i,/^(?:LOCKS\b)/i,/^(?:LOG\b)/i,/^(?:LOGED\b)/i,/^(?:LONG\b)/i,/^(?:LOOP\b)/i,/^(?:LOWER\b)/i,/^(?:MAP\b)/i,/^(?:MATCH\b)/i,/^(?:MATERIALIZED\b)/i,/^(?:MAX\b)/i,/^(?:MAXLEN\b)/i,/^(?:MEMBER\b)/i,/^(?:MERGE\b)/i,/^(?:METHOD\b)/i,/^(?:METRICS\b)/i,/^(?:MIN\b)/i,/^(?:MINUS\b)/i,/^(?:MINUTE\b)/i,/^(?:MISSING\b)/i,/^(?:MOD\b)/i,/^(?:MODE\b)/i,/^(?:MODIFIES\b)/i,/^(?:MODIFY\b)/i,/^(?:MODULE\b)/i,/^(?:MONTH\b)/i,/^(?:MULTI\b)/i,/^(?:MULTISET\b)/i,/^(?:NAME\b)/i,/^(?:NAMES\b)/i,/^(?:NATIONAL\b)/i,/^(?:NATURAL\b)/i,/^(?:NCHAR\b)/i,/^(?:NCLOB\b)/i,/^(?:NEW\b)/i,/^(?:NEXT\b)/i,/^(?:NO\b)/i,/^(?:NONE\b)/i,/^(?:NOT\b)/i,/^(?:NULL\b)/i,/^(?:NULLIF\b)/i,/^(?:NUMBER\b)/i,/^(?:NUMERIC\b)/i,/^(?:OBJECT\b)/i,/^(?:OF\b)/i,/^(?:OFFLINE\b)/i,/^(?:OFFSET\b)/i,/^(?:OLD\b)/i,/^(?:ON\b)/i,/^(?:ONLINE\b)/i,/^(?:ONLY\b)/i,/^(?:OPAQUE\b)/i,/^(?:OPEN\b)/i,/^(?:OPERATOR\b)/i,/^(?:OPTION\b)/i,/^(?:OR\b)/i,/^(?:ORDER\b)/i,/^(?:ORDINALITY\b)/i,/^(?:OTHER\b)/i,/^(?:OTHERS\b)/i,/^(?:OUT\b)/i,/^(?:OUTER\b)/i,/^(?:OUTPUT\b)/i,/^(?:OVER\b)/i,/^(?:OVERLAPS\b)/i,/^(?:OVERRIDE\b)/i,/^(?:OWNER\b)/i,/^(?:PAD\b)/i,/^(?:PARALLEL\b)/i,/^(?:PARAMETER\b)/i,/^(?:PARAMETERS\b)/i,/^(?:PARTIAL\b)/i,/^(?:PARTITION\b)/i,/^(?:PARTITIONED\b)/i,/^(?:PARTITIONS\b)/i,/^(?:PATH\b)/i,/^(?:PERCENT\b)/i,/^(?:PERCENTILE\b)/i,/^(?:PERMISSION\b)/i,/^(?:PERMISSIONS\b)/i,/^(?:PIPE\b)/i,/^(?:PIPELINED\b)/i,/^(?:PLAN\b)/i,/^(?:POOL\b)/i,/^(?:POSITION\b)/i,/^(?:PRECISION\b)/i,/^(?:PREPARE\b)/i,/^(?:PRESERVE\b)/i,/^(?:PRIMARY\b)/i,/^(?:PRIOR\b)/i,/^(?:PRIVATE\b)/i,/^(?:PRIVILEGES\b)/i,/^(?:PROCEDURE\b)/i,/^(?:PROCESSED\b)/i,/^(?:PROJECT\b)/i,/^(?:PROJECTION\b)/i,/^(?:PROPERTY\b)/i,/^(?:PROVISIONING\b)/i,/^(?:PUBLIC\b)/i,/^(?:PUT\b)/i,/^(?:QUERY\b)/i,/^(?:QUIT\b)/i,/^(?:QUORUM\b)/i,/^(?:RAISE\b)/i,/^(?:RANDOM\b)/i,/^(?:RANGE\b)/i,/^(?:RANK\b)/i,/^(?:RAW\b)/i,/^(?:READ\b)/i,/^(?:READS\b)/i,/^(?:REAL\b)/i,/^(?:REBUILD\b)/i,/^(?:RECORD\b)/i,/^(?:RECURSIVE\b)/i,/^(?:REDUCE\b)/i,/^(?:REF\b)/i,/^(?:REFERENCE\b)/i,/^(?:REFERENCES\b)/i,/^(?:REFERENCING\b)/i,/^(?:REGEXP\b)/i,/^(?:REGION\b)/i,/^(?:REINDEX\b)/i,/^(?:RELATIVE\b)/i,/^(?:RELEASE\b)/i,/^(?:REMAINDER\b)/i,/^(?:RENAME\b)/i,/^(?:REPEAT\b)/i,/^(?:REPLACE\b)/i,/^(?:REQUEST\b)/i,/^(?:RESET\b)/i,/^(?:RESIGNAL\b)/i,/^(?:RESOURCE\b)/i,/^(?:RESPONSE\b)/i,/^(?:RESTORE\b)/i,/^(?:RESTRICT\b)/i,/^(?:RESULT\b)/i,/^(?:RETURN\b)/i,/^(?:RETURNING\b)/i,/^(?:RETURNS\b)/i,/^(?:REVERSE\b)/i,/^(?:REVOKE\b)/i,/^(?:RIGHT\b)/i,/^(?:ROLE\b)/i,/^(?:ROLES\b)/i,/^(?:ROLLBACK\b)/i,/^(?:ROLLUP\b)/i,/^(?:ROUTINE\b)/i,/^(?:ROW\b)/i,/^(?:ROWS\b)/i,/^(?:RULE\b)/i,/^(?:RULES\b)/i,/^(?:SAMPLE\b)/i,/^(?:SATISFIES\b)/i,/^(?:SAVE\b)/i,/^(?:SAVEPOINT\b)/i,/^(?:SCAN\b)/i,/^(?:SCHEMA\b)/i,/^(?:SCOPE\b)/i,/^(?:SCROLL\b)/i,/^(?:SEARCH\b)/i,/^(?:SECOND\b)/i,/^(?:SECTION\b)/i,/^(?:SEGMENT\b)/i,/^(?:SEGMENTS\b)/i,/^(?:SELECT\b)/i,/^(?:SELF\b)/i,/^(?:SEMI\b)/i,/^(?:SENSITIVE\b)/i,/^(?:SEPARATE\b)/i,/^(?:SEQUENCE\b)/i,/^(?:SERIALIZABLE\b)/i,/^(?:SESSION\b)/i,/^(?:SET\b)/i,/^(?:SETS\b)/i,/^(?:SHARD\b)/i,/^(?:SHARE\b)/i,/^(?:SHARED\b)/i,/^(?:SHORT\b)/i,/^(?:SHOW\b)/i,/^(?:SIGNAL\b)/i,/^(?:SIMILAR\b)/i,/^(?:SIZE\b)/i,/^(?:SKEWED\b)/i,/^(?:SMALLINT\b)/i,/^(?:SNAPSHOT\b)/i,/^(?:SOME\b)/i,/^(?:SOURCE\b)/i,/^(?:SPACE\b)/i,/^(?:SPACES\b)/i,/^(?:SPARSE\b)/i,/^(?:SPECIFIC\b)/i,/^(?:SPECIFICTYPE\b)/i,/^(?:SPLIT\b)/i,/^(?:SQL\b)/i,/^(?:SQLCODE\b)/i,/^(?:SQLERROR\b)/i,/^(?:SQLEXCEPTION\b)/i,/^(?:SQLSTATE\b)/i,/^(?:SQLWARNING\b)/i,/^(?:START\b)/i,/^(?:STATE\b)/i,/^(?:STATIC\b)/i,/^(?:STATUS\b)/i,/^(?:STORAGE\b)/i,/^(?:STORE\b)/i,/^(?:STORED\b)/i,/^(?:STREAM\b)/i,/^(?:STRING\b)/i,/^(?:STRUCT\b)/i,/^(?:STYLE\b)/i,/^(?:SUB\b)/i,/^(?:SUBMULTISET\b)/i,/^(?:SUBPARTITION\b)/i,/^(?:SUBSTRING\b)/i,/^(?:SUBTYPE\b)/i,/^(?:SUM\b)/i,/^(?:SUPER\b)/i,/^(?:SYMMETRIC\b)/i,/^(?:SYNONYM\b)/i,/^(?:SYSTEM\b)/i,/^(?:TABLE\b)/i,/^(?:TABLESAMPLE\b)/i,/^(?:TEMP\b)/i,/^(?:TEMPORARY\b)/i,/^(?:TERMINATED\b)/i,/^(?:TEXT\b)/i,/^(?:THAN\b)/i,/^(?:THEN\b)/i,/^(?:THROUGHPUT\b)/i,/^(?:TIME\b)/i,/^(?:TIMESTAMP\b)/i,/^(?:TIMEZONE\b)/i,/^(?:TINYINT\b)/i,/^(?:TO\b)/i,/^(?:TOKEN\b)/i,/^(?:TOTAL\b)/i,/^(?:TOUCH\b)/i,/^(?:TRAILING\b)/i,/^(?:TRANSACTION\b)/i,/^(?:TRANSFORM\b)/i,/^(?:TRANSLATE\b)/i,/^(?:TRANSLATION\b)/i,/^(?:TREAT\b)/i,/^(?:TRIGGER\b)/i,/^(?:TRIM\b)/i,/^(?:TRUE\b)/i,/^(?:TRUNCATE\b)/i,/^(?:TTL\b)/i,/^(?:TUPLE\b)/i,/^(?:TYPE\b)/i,/^(?:UNDER\b)/i,/^(?:UNDO\b)/i,/^(?:UNION\b)/i,/^(?:UNIQUE\b)/i,/^(?:UNIT\b)/i,/^(?:UNKNOWN\b)/i,/^(?:UNLOGGED\b)/i,/^(?:UNNEST\b)/i,/^(?:UNPROCESSED\b)/i,/^(?:UNSIGNED\b)/i,/^(?:UNTIL\b)/i,/^(?:UPDATE\b)/i,/^(?:UPPER\b)/i,/^(?:URL\b)/i,/^(?:USAGE\b)/i,/^(?:USE\b)/i,/^(?:USER\b)/i,/^(?:USERS\b)/i,/^(?:USING\b)/i,/^(?:UUID\b)/i,/^(?:VACUUM\b)/i,/^(?:VALUE\b)/i,/^(?:VALUED\b)/i,/^(?:VALUES\b)/i,/^(?:VARCHAR\b)/i,/^(?:VARIABLE\b)/i,/^(?:VARIANCE\b)/i,/^(?:VARINT\b)/i,/^(?:VARYING\b)/i,/^(?:VIEW\b)/i,/^(?:VIEWS\b)/i,/^(?:VIRTUAL\b)/i,/^(?:VOID\b)/i,/^(?:WAIT\b)/i,/^(?:WHEN\b)/i,/^(?:WHENEVER\b)/i,/^(?:WHERE\b)/i,/^(?:WHILE\b)/i,/^(?:WINDOW\b)/i,/^(?:WITH\b)/i,/^(?:WITHIN\b)/i,/^(?:WITHOUT\b)/i,/^(?:WORK\b)/i,/^(?:WRAPPED\b)/i,/^(?:WRITE\b)/i,/^(?:YEAR\b)/i,/^(?:ZONE\b)/i,/^(?:JSON\b)/i,/^(?:[-]?(\d*[.])?\d+[eE]\d+)/i,/^(?:[-]?(\d*[.])?\d+)/i,/^(?:~)/i,/^(?:\+=)/i,/^(?:\+)/i,/^(?:-)/i,/^(?:\*)/i,/^(?:\/)/i,/^(?:%)/i,/^(?:>>)/i,/^(?:<<)/i,/^(?:<>)/i,/^(?:!=)/i,/^(?:>=)/i,/^(?:>)/i,/^(?:<=)/i,/^(?:<)/i,/^(?:=)/i,/^(?:&)/i,/^(?:\|)/i,/^(?:\()/i,/^(?:\))/i,/^(?:\{)/i,/^(?:\})/i,/^(?:\[)/i,/^(?:\])/i,/^(?:\.)/i,/^(?:,)/i,/^(?::)/i,/^(?:;)/i,/^(?:\$)/i,/^(?:\?)/i,/^(?:\^)/i,/^(?:[a-zA-Z_][a-zA-Z_0-9]*)/i,/^(?:$)/i,/^(?:.)/i],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439,440,441,442,443,444,445,446,447,448,449,450,451,452,453,454,455,456,457,458,459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513,514,515,516,517,518,519,520,521,522,523,524,525,526,527,528,529,530,531,532,533,534,535,536,537,538,539,540,541,542,543,544,545,546,547,548,549,550,551,552,553,554,555,556,557,558,559,560,561,562,563,564,565,566,567,568,569,570,571,572,573,574,575,576,577,578,579,580,581,582,583,584,585,586,587,588,589,590,591,592,593,594,595,596,597,598,599,600,601,602,603,604,605,606,607,608,609,610,611,612,613,614,615,616,617,618,619,620,621,622,623,624,625,626,627,628,629,630,631,632,633,634,635,636,637,638,639,640,641,642,643,644,645,646,647,648,649,650,651,652,653,654,655,656,657,658,659,660,661,662,663,664,665,666,667,668,669,670,671,672,673,674,675,676,677,678,679,680,681,682,683,684,685,686,687,688,689,690,691,692,693,694,695,696,697,698,699,700,701,702,703,704,705,706,707,708,709,710,711,712,713,714,715,716,717,718,719,720,721,722,723,724,725,726,727,728,729,730,731,732,733,734,735,736,737,738,739,740,741,742,743],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = sqlparser;
exports.Parser = sqlparser.Parser;
exports.parse = function () { return sqlparser.parse.apply(sqlparser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require('_process'))
},{"_process":4,"fs":1,"path":3}],8:[function(require,module,exports){
(function (Buffer){

var DynamoUtil = function() {};

DynamoUtil.config = {
	stringset_parse_as_set: false,
	numberset_parse_as_set: false,
	empty_string_replace_as: "",
}

// works for nodeJS 0.x and iojs,
// Array.from( Set ) doesnt
var array_from_set = function(s) {
	var r = []
	s.forEach(function(n){ r.push(n) })
	return r
} 
DynamoUtil.Raw = function(data) {
	this.data = data
}

DynamoUtil.anormalizeList = function(list) {
	var $ret = []
	for (var $i in list) {
		$ret.push(DynamoUtil.anormalizeItem(list[$i]))
	}
	return $ret;
}

DynamoUtil.anormalizeItem = function(item) {
	var anormal = {}
	for (var key in item) {
		if (item.hasOwnProperty(key)) {
			anormal[key] = DynamoUtil.stringify(item[key])
		}
	}
	return anormal;
}


DynamoUtil.stringify = function( $value ) {
	if (typeof $value == 'boolean')
		return {'BOOL' : $value }

	if (typeof $value == 'number')
		return {'N' : $value.toString() }

	if (typeof $value == 'string') {
		if ($value.length === 0) {
			if (DynamoUtil.config.empty_string_replace_as === "") {
				return {'S' : $value }
			} else if (DynamoUtil.config.empty_string_replace_as === undefined) {
				return undefined
			}
			return DynamoUtil.stringify( DynamoUtil.config.empty_string_replace_as )
		}
		return {'S' : $value }
	}

	if ($value === null)
		return {'NULL' : true }

	if (Buffer.isBuffer($value))
		return {'B' : $value }

	// stringSet, numberSet
	if ((typeof $value == 'object') && ($value instanceof DynamoUtil.Raw) ) {
		return $value.data
	}

	if (typeof $value == 'object') {
		if(Array.isArray($value) ) {
			var to_ret = {'L': [] }
			for (var i in $value) {
				if ($value.hasOwnProperty(i)) {
					to_ret.L[i] = DynamoUtil.stringify($value[i] )
				}
			}
			return to_ret
		}

		if ($value instanceof Set) {
			var is_ss = true;
			var is_ns = true;
			
			// count elements in Set
			if ($value.size === 0) {
				is_ss = false;
				is_ns = false;
			}
			
			$value.forEach(function (v) { 
				if ( typeof v === "string" ) {
					is_ns = false;
				} else if ( typeof v === "number" ) {
					is_ss = false;
				} else {
					is_ss = false;
					is_ns = false;
				}
			})
			if (is_ss)
				return { 'SS': array_from_set($value) }

			if (is_ns)
				return { 
					'NS': array_from_set($value).map(function(item) { return item.toString() }) 
				}
			
			return { 
				'L': array_from_set($value).map(function(item) { return DynamoUtil.stringify(item) })
			}
		}

		var to_ret = {'M': {} }
		for (var i in $value) {
			if ($value.hasOwnProperty(i)) {
					var val = DynamoUtil.stringify($value[i] )
					
					if (val !== undefined ) // when empty string is replaced with undefined
						to_ret.M[i] = val
				}
			}
			return to_ret
	}

	// @todo: support other types
}


DynamoUtil.anormalizeType = function( $value ) {
	if (typeof $value == 'boolean')
		return 'BOOL'

	if (typeof $value == 'number')
		return 'N'

	if (typeof $value == 'string')
		return 'S'

	if (Array.isArray($value))
		return 'L'

	if ($value === null) {
		return 'NULL'
	}
	// @todo: support other types
}

DynamoUtil.normalizeList = function($items) {
	var $list = []
	for (var i in $items) {
		$list.push(DynamoUtil.normalizeItem($items[i]))
	}
	return $list;
}

DynamoUtil.parse = function(v) {
	if (typeof v !== 'object')
		throw 'expecting object';

	if (Object.keys(v).length !== 1)
		throw 'expecting only one property in object: S, N, BOOL, NULL, L, M, etc ';

	if (v.hasOwnProperty('S')) {
		if ( v.S === DynamoUtil.config.empty_string_replace_as )
			return '';

		return v.S
	}

	if (v.hasOwnProperty('N'))
		return parseInt(v.N)

	if (v.hasOwnProperty('BOOL'))
		return v.BOOL

	if (v.hasOwnProperty('NULL'))
		return null

	if (v.hasOwnProperty('B'))
		return v.B

	if (v.hasOwnProperty('SS')) {
		if (DynamoUtil.config.stringset_parse_as_set)
			return new Set(v.SS)

		return v.SS
	}

	if (v.hasOwnProperty('NS')) {
		if (DynamoUtil.config.numberset_parse_as_set)
			return new Set(v.NS.map(function(el) { return parseFloat(el)}))

		return v.NS.map(function(el) { return parseFloat(el)})
	}

	if (v.hasOwnProperty('L')){
		var normal = [];
		for (var i in v.L ) {
			if (v.L.hasOwnProperty(i)) {
				normal[i] = DynamoUtil.parse(v.L[i])
			}
		}
		return normal;
	}

	if (v.hasOwnProperty('M')) {
		var normal = {}
		for (var i in v.M ) {
			if (v.M.hasOwnProperty(i)) {
				normal[i] = DynamoUtil.parse(v.M[i])
			}
		}
		return normal;
	}
}

DynamoUtil.normalizeItem = function($item) {
	// disabled for now so we dont break compatibility with older versions, should return null on undefined $item
	//if (!$item)
	//	return null

	var normal = {}
	for (var key in $item) {
		if ($item.hasOwnProperty(key)) {
			if ($item[key].hasOwnProperty('S'))
				normal[key] = $item[key]['S']

			if ($item[key].hasOwnProperty('N'))
				normal[key] = +($item[key]['N'])

			if ($item[key].hasOwnProperty('BOOL'))
				normal[key] = $item[key]['BOOL']

			if ($item[key].hasOwnProperty('NULL'))
				normal[key] = null

			if ($item[key].hasOwnProperty('B'))
				normal[key] = $item[key]['B']

			if ($item[key].hasOwnProperty('SS'))
				normal[key] = $item[key]['SS']

			if ($item[key].hasOwnProperty('NS')) {
				normal[key] = []
				$item[key]['NS'].forEach(function(el,idx) {
					normal[key].push(parseFloat(el))
				})
			}

			if ($item[key].hasOwnProperty('L')){
				normal[key] = []
				for (var i in $item[key]['L'] ) {
					if ($item[key]['L'].hasOwnProperty(i)) {
						normal[key][i] = DynamoUtil.normalizeItem({
								key: $item[key]['L'][i]
						}).key
					}
				}
			}

			if ($item[key].hasOwnProperty('M')) {
				normal[key] = {}
				for (var i in $item[key]['M'] ) {
					if ($item[key]['M'].hasOwnProperty(i)) {
						normal[key][i] = DynamoUtil.normalizeItem({
								key: $item[key]['M'][i]
						}).key
					}
				}
			}
		}
	}
	return normal;
}


DynamoUtil.buildExpected = function( $expected ) {
	var anormal = {}

	for (var key in $expected ) {
		if ($expected.hasOwnProperty(key)) {

				var whereVal = {}

				if ((typeof $expected[key] == 'object') && ($expected[key] instanceof DynamoUtil.Raw) ) {
					anormal[key] = $expected[key].data
				} else if ($expected[key].hasOwnProperty('value2') && $expected[key].value2 !== undefined ) {
					anormal[key] = {
						ComparisonOperator: $expected[key].operator,
						AttributeValueList: [ DynamoUtil.stringify( $expected[key].value ), DynamoUtil.stringify( $expected[key].value2 ) ]
					}
				} else {
					anormal[key] = {
						ComparisonOperator: $expected[key].operator,
						AttributeValueList: [ DynamoUtil.stringify( $expected[key].value ) ]
					}
				}
		}
	}
	return anormal
}


DynamoUtil.expression_name_split = function(item) {
	var ret = []
	var split = ''
	var in_brackets = false
	for (var i = 0;i<item.length;i++) {
		if (in_brackets) {
			if (item[i] == '"') {
				in_brackets = false
				ret.push(split)
				split = ''
			} else {
				split+=item[i]
			}
		} else {
			if (item[i] == '"') {
				in_brackets = true
			} else {
				if (item[i] == '.') {
					ret.push(split)
					split = ''
				} else {
					split+=item[i]
				}
			}
		}
	}
	ret.push(split)
	return ret.filter(function(v) { return v.trim() !== '' })
}
DynamoUtil.clone = function ( source) {

	var from;
	var to = Object({});
	var symbols;

	for (var s = 0; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (Object.prototype.hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (Object.prototype.propertyIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
}






// backword compatibitity
DynamoUtil.anormalizeValue = DynamoUtil.stringify;
DynamoUtil.normalizeValue  = DynamoUtil.parse;

module.exports = DynamoUtil

}).call(this,{"isBuffer":require("../../../../../../../../.npm/lib/node_modules/browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js")})
},{"../../../../../../../../.npm/lib/node_modules/browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js":2}]},{},[5]);
