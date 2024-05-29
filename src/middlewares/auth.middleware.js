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

  owner(req, res, next) {
    if (req.session.user.id == req.params.id) {
      next();
    } else {
      res.redirect('/');
    }
  }
}

module.exports = new AuthMiddleware();
