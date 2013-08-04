'use strict';

var fs = require('fs'),
  atob = require('atob'),
  btoa = require('btoa'),
  mongo = require('mongodb'),
  moment = require('moment'),
  binded = false;

var tacoHandler = function() { this.isBound = false; };

/**
 * Check of Taco.js is bound to element
 */
tacoHandler.prototype.binded = function() {
  return this.isBound;
};

/**
 * Bind Taco.js handler to element
 */
tacoHandler.prototype.bind = function(app) {
  var fileJavaScript = null; // fs.readFileSync(__dirname + '/taco.browser.js');
  var fileStyleSheet = null; // fs.readFileSync(__dirname + '/taco.css');
  var tac = this;
  
  // Set/Get DB Handler
  this.db = app.get('db');
  
  // Add Handler
  app.set('tac', this);
  
  if (!app.get('db')) {
    throw new Error('Missing db connection in app.get(\'db\')'); }
  
  /**
   * Serve Taco.js JavaScript for web browsers
   *
   * @method GET
   */
  app.get('/taco.js', function(req, res) {
    res.end(fs.readFileSync(__dirname + '/taco.browser.js'));
    
    res = null;
    req = null;
  });
  
  /**
   * Serve Taco.js StyleSheets for web browsers
   *
   * @method GET
   */
  app.get('/taco.css', function(req, res) {
    res.end(fs.readFileSync(__dirname + '/taco.css'));
    
    res = null;
    req = null;
  });
  
  /**
   * Get Taco.js Stats for given URL item
   *
   * @method GET
   */
  app.get('/taco.js/:item', function(req, res) {
    tac.getItemByHash(app.get('db'), req.param('item', null), function(err, data) {
      res.end(JSON.stringify(data || {}));
      
      data = null;
      err = null;
      res = null;
      req = null;
    });
  });
  
  /**
   * Update Taco.js stats for given URL item
   *
   * @method POST
   */
  app.post('/taco.js/:item', function(req, res) {
    tac.updateItem(req.param('item', null), {}, function(err, data) {
      res.end(data);
      
      data = null;
      err = null;
      res = null;
      req = null;
    });
  });
  
  // Spread love with taco.js
  this.isBound = true;
};

// Date parts for Brainfuck
var steps = ['year', 'month', 'day', 'hour', 'minute', 'second'];

/**
 * Get Taco.js stats by URL hash
 *
 * @param object db MongoDB connection handler
 * @param string URL hash
 * @param funtion callback
 */
tacoHandler.prototype.getItemByHash = function(db, hash, callback) {
  // Check and set parameters
  if (arguments.length == 2) {
    callback = hash;
    hash = db;
    db = this.db;
  }
  
  // Get needed MongoDB collection
  var collection = new mongo.Collection(db || this.db, 'tacos');
  
  // Find item by URL hash
  collection.findOne({hash: decodeURIComponent(hash)}, function(err, data) {
    callback(err, data);
    
    hash = null;
    db = null;
    callback = null;
    collection = null;
    data = null;
    err = null;
  });
};

/**
 * Update item stats 
 *
 * @param string item URL hash
 * @param object user User object for new taco
 * @param function callback
 */
tacoHandler.prototype.updateItem = function(item, user, callback) {
  var collection = new mongo.Collection(this.db, 'tacos');
  var hash = decodeURIComponent(item);
  callback = callback || function() {};
  
  /**
   * Helper function for updating time storage
   *
   * @param object URL item object
   */
  function updateDate(item) {
    var curDate = new Date();
    
    /**
     * Add 0 prefix to numbers less than 10
     *
     * @param integer i
     * @return string
     */
    function fN(i) {
      if (parseInt(i, 10) < 10) {
        return "0" + i;
      } else {
        return "" + i;
      }
    }
    
    // Update hits
    var keys = [fN(curDate.getUTCFullYear()), fN(curDate.getUTCMonth() + 1), fN(curDate.getUTCDate()), fN(curDate.getUTCHours()), fN(curDate.getUTCMinutes()), fN(curDate.getUTCSeconds())];
    var handler = item.data;
    
    // Brainfuck
    for (var n = 0, m = steps.length; n < m; n++) {
      var curKey = keys[n];
      var curStp = steps[n];
      
      handler.total++;
      
      if (!handler[curStp]) {
        handler[curStp] = {}; }
      
      if (!handler[curStp][curKey]) {
        handler[curStp][curKey] = {"total": 0}; }
      
      if (steps[n + 1]) {
        if (!handler[curStp][curKey][steps[n+1]]) {
          handler[curStp][curKey][steps[n+1]] = {}; } 
      } else {
        handler[curStp][curKey].total++; }
      
      handler = handler[curStp][curKey];
    }
    
    return curDate;
  }
  
  // Find need item object in MongoDB
  collection.findOne({hash: hash}, function(err, item) {
    if (!err && !item) {
      // If not found, create a new item object
      item = {
        hash: hash,
        url: atob(hash),
        total: 1,
        data: {'year': {}, "total": 0}
      };
      
      // Update tacos
      item.lastFed = updateDate(item);
      
      // Save
      collection.insert(item, function(err, data) {
        callback(null, JSON.stringify(data));
        
        item = null;
        err = null;
        data = null;
        callback = null;
        collection = null;
        hash = null;
      });
    } else if (item) {
      // Update tacos
      item.lastFed = updateDate(item);
      item.total++;
      
      // Save
      collection.update({hash: hash}, item, {multi: false}, function(err, num, obj) {
        callback(null, 'Thanks!');
        
        item = null;
        err = null;
        obj = null;
        num = null;
        callback = null;
        collection = null;
        hash = null;
      });
    }
  });
};

/**
 * Get most fed items
 * 
 * @param date data (Unused atm)
 * @param function callback
 */
tacoHandler.prototype.mostFed = function(max, callback) {
  if (!callback) {
    callback = nax;
  }
  
  var collection = new mongo.Collection(this.db, 'tacos');
  // Find item by URL hash
  collection.find({}).limit(max).sort('total', -1).toArray(function(err, data) {
    callback(err, data);
    
    collection = null;
    data = null;
    err = null;
    callback = null;
  });
};


/**
 * Get most fed items
 * 
 * @param date data (Unused atm)
 * @param function callback
 */
tacoHandler.prototype.lastFed = function(max, callback) {
  if (!callback) {
    callback = nax;
  }

  var collection = new mongo.Collection(this.db, 'tacos');
  // Find item by URL hash
  collection.find({}).limit(max).sort('lastFed', -1).toArray(function(err, data) {
    callback(err, data);
    
    collection = null;
    data = null;
    err = null;
    callback = null;
  });
};

/**
 * Get tacos by time query from item
 * 
 * @param object data Taco item
 * @param string qry Date query for Taco stats
 */
tacoHandler.prototype.parseTimeQuery = function(data, qry) {
  var splt = qry.split('-');
  var handler = data ? data.data || {} : {}; 
  
  // Brainfuck
  for (var n = 0, m = splt.length; n < m; n++) {
    if (!handler[steps[n]] || !handler[steps[n]][splt[n]]) {
      return 0; }
      
    handler = handler[steps[n]][splt[n]];
    
    if (!splt[n+1]) {
      return handler.total; }
  }
  
  return 0;
};

/**
 * Get Taco item stats 
 *
 * @param string url URL for stats
 * @param string stats Stats name (last20hours for example)
 * @param function callback
 */
tacoHandler.prototype.getItemStats = function(url, stats, callback) {
  var dates = this.parseStats(stats),
    hash = btoa(url),
    tac = this;
  
  /**
   * Helper function for getting stats
   *
   * @param object data Taco.js item
   * @param function callback
   */
  function __helper(data, callback) {
    var result = [];
    
    for (var n in dates) {  
      result.push(tac.parseTimeQuery(data, dates[n]));
    }
    
    callback(null, result);
    
    result = null;
    data = null;
    callback = null;
    tac = null;
    dates = null;
    hash = null;
  }
  
  // Create cache if needed
  if (!this.cache) {
    this.cache = {}; }
    
  // Check if cache is not set or out-dated
  if (!this.cache[url] || Math.abs(moment(this.cache[url].time).diff(moment(Date())))/1000 > 1) {
    // Fetch data from MongoDB
    this.getItemByHash(hash, function(err, data) {
      // Update cache
      tac.cache[url] = {data: data, time: Date()};
      
      __helper(tac.cache[url].data, callback);
    });  
  } else {
    // Use cache
    __helper(tac.cache[url].data, callback);
  }
};

/**
 * Get item stats for Taco.js URL 
 *
 * @wrapper getItemStats
 * @param string url URL
 * @param mixed stats 'last24hours' or ['last24hours', 'last7days']
 * @param function callback
 */
tacoHandler.prototype.itemStats = function(url, stats, callback) {
  if (typeof stats == 'object') {
    var items = stats;
    var storage = {};
    var tac = this;
    
    // Iterate stats array
    var __worker = function() {
      if (items.length > 0) {
        var curStats = items.pop();

        tac.getItemStats(url, curStats, function(err, data) {
          storage[curStats] = data;
          __worker();
        });
      } else {
        callback(null, storage);
        
        url = null;
        stats = null;
        callback = null;
        items = null;
        storage = null;
        tac = null;
      }
    };
    
    //  Start chain
    __worker();
  } else {
    // Return needed stats if not an array
    return this.getItemStats(url, stats, callback);
  }
};

/** 
 * Parse stats key
 *
 * @param string s Stats name
 * @return object 
 */
tacoHandler.prototype.parseStats = function(s) {
  var data = {};
  
  // Brainfuck
  if (/([a-z]*)([0-9]*)([a-z]*)/.test(s)) {
    var parts = /([a-z]*)([0-9]*)([a-z]*)/.exec(s);
    var now = new Date();
    // Parse 'lastXYlorem'
    if (parts[1] == 'last') {
      var timeSteps = [];
      var format = 'YYYY-MM-DD-HH-mm-ss';
      var values = format.split('-');
      var used = [];
      var max = parts[3].substr(0, parts[3].length-1);
      
      for (var j = 0, k = steps.length; j < k; j++) {
        used.push(values[j]);
        
        if (steps[j] == max) {
          break;
        }
      }

      for (var n = 0, m = parseInt(parts[2], 10); n < m; n++) {
        var stamp = moment(now).utc().subtract(parts[3], n);
                
        data[n] = stamp.format(used.join('-'));
      }
    }
  } else {
    // Fallback
    data = null;
  }
  
  return data;
};

var taco = new tacoHandler();

// Export module handler
module.exports = {
  express: function() {
    var patterns = arguments;
    
    /**
     * Bind taco.js URL stats
     */
    var bindInfo = function(req, res, next) {
      taco.getItemByHash(req.app.get('db'), btoa(req.url), function(err, data) {
        res.locals.taco = data || {};
        
        next();
        
        res = null;
        req = null;
        next = null;
        err = null;
        data = null;
      });
    };
    
    var declinedDefaults = function(req) {
      return (/((.*)\.css|(.*)\.js)/.test(req.url));
    };
    
    return function(req, res, next) {
      var match = false;
      
      // Skip default files for stats
      if (declinedDefaults(req)) {
        next(); 
        
        res = null;
        req = null;
        match = null;
        next = null;
        
        return;
      }
      
      // Check patterns
      for (var n = 0, m = patterns.length; n < m; n++) {
        // If pattern is string, do a simple compare
        if (typeof patterns[n] == 'string') {
          if (req.url == patterns[n]) {
            bindInfo(req, res, next);
            
            res = null;
            req = null;
            match = null;
            next = null;
            
            return;
          }
        // If pattern is not a string, it has to be a regular expression
        } else {
          if (patterns[n].test(req.url)) {
            bindInfo(req, res, next);
            
            res = null;
            req = null;
            match = null;
            next = null;
            
            return;
          }
        }
      }
      
      // Good bye
      next();
    };
  },
  bind: function(app) {
    taco.bind(app);
    app = null;
  }  
};