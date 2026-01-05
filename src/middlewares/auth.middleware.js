/**
 * Middleware de Autenticação
 *
 * Fornece middlewares para controle de acesso às rotas,
 * verificando se o usuário está autenticado e se tem permissão
 * para acessar determinados recursos.
 *
 * @author Matheus Santos Silva
 */

/**
 * Verifica se um objeto está vazio
 *
 * @param {Object} obj - Objeto a ser verificado
 * @returns {boolean} True se o objeto estiver vazio
 */
function isEmptyObject(obj) {
   return Object.values(obj).length == 0;
}

class AuthMiddleware {
  /**
   * Middleware de autenticação
   *
   * Verifica se o usuário está autenticado através da sessão.
   * Se não estiver, redireciona para a página de login.
   *
   * @param {Object} req - Request do Express
   * @param {Object} res - Response do Express
   * @param {Function} next - Próximo middleware
   */
  auth(req, res, next) {
    if (req.session.user && !isEmptyObject(req.session.user)) {
      next();
    } else {
      res.redirect('/login');
    }
  }

  /**
   * Middleware de não-autenticação
   *
   * Verifica se o usuário NÃO está autenticado.
   * Útil para páginas como login e registro que só devem
   * ser acessadas por usuários não autenticados.
   *
   * @param {Object} req - Request do Express
   * @param {Object} res - Response do Express
   * @param {Function} next - Próximo middleware
   */
  unauth(req, res, next) {
    if (req.session.user && !isEmptyObject(req.session.user)) {
      res.redirect('/');
    } else {
      next();
    }
  }

  /**
   * Middleware de verificação de propriedade
   *
   * Verifica se o usuário autenticado é o dono do recurso
   * que está tentando acessar (baseado no ID da URL).
   * Previne que usuários acessem recursos de outros usuários.
   *
   * @param {Object} req - Request do Express
   * @param {Object} res - Response do Express
   * @param {Function} next - Próximo middleware
   */
  owner(req, res, next) {
    if (req.session.user.id == req.params.id) {
      next();
    } else {
      res.redirect('/');
    }
  }


}

module.exports = new AuthMiddleware();
