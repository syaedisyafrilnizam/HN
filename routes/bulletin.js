exports.main = function(req, res) {
  const user_id = req.session.user_id;

  res.render('bulletin.ejs', {
    user_id: user_id,
    sess: req.session
  });
};

exports.viewPost = function(req, res) {
  const user_id = req.session.user_id;

  res.render('post.ejs', {
    user_id: user_id,
    sess: req.session
  });
};
