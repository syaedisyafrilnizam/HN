exports.main = function(req, res) {
  const user_id = req.session.user_id;

  res.render('chat.ejs', {
    user_id: user_id,
    sess: req.session
  });
};
