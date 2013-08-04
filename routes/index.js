exports.index = function(req, res) {
  res.render('index');
};

exports.random = function(req, res) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
  for (var i=0; i<4; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length)); }
  
  res.redirect('/post/' + text + '.html');
  
  text = null;
  possible = null;
};

exports.mostfed = function(req, res) {
  // Get most fed pages
  req.app.get('tac').mostFed(3, function(err, mostFed) {
    req.app.get('tac').lastFed(5, function(err, lastFed) {
      req.app.get('tac').itemStats(req.url, ['last20minutes', 'last24hours', 'last28days'], function(err, data) {
        // Combine with mostFed
        data.mostFed = mostFed;
        data.lastFed = lastFed;
        
        res.render('mostfed', data);
        
        data = null;
        mostFed = null;
        lastFed = null;
      });
    });
  });
};

exports.post = function(req, res) {
  res.render('post', {post: req.param('id')});
};