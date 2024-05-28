class AuthMiddleware {
  auth(req, res, next) {
    if (req.session.user) {
      next();
    } else {
      res.redirect('/login');
    }
  }

  unauth(req, res, next) {
    if (req.session.user) {
      res.redirect('/');
    } else {
      next();
    }
  }
}

module.exports = new AuthMiddleware();
