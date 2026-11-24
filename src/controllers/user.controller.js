const users = require("../services/user.service");
const { HttpError } = require("../lib/http");

function showRegistration(req, res) {
    res.render("user/register_user", { errors: [], data: {} });
}

async function register(req, res) {
    const result = await users.save(req.body);
    if (result.errors.length) {
        return res.status(422).render("user/register_user", result);
    }
    return res.redirect(303, "/login");
}

async function showAccount(req, res) {
    const data = await users.findOne(req.session.user.id);
    if (!data) {
        throw new HttpError(404, "Conta não encontrada.");
    }
    res.render("user/edit_user", { errors: [], data });
}

async function updateAccount(req, res) {
    const result = await users.save(req.body, req.session.user.id);
    if (result.errors.length) {
        return res.status(422).render("user/edit_user", result);
    }
    req.session.user.name = result.data.name;
    return res.redirect(303, "/account");
}

module.exports = { showRegistration, register, showAccount, updateAccount };
