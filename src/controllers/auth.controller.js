const { promisify } = require("node:util");
const auth = require("../services/auth.service");
const { readText } = require("../lib/validation");

function showLogin(req, res) {
    res.render("login", { error: null, data: {} });
}

async function login(req, res) {
    const user = await auth.login(req.body);
    if (!user) {
        return res.status(401).render("login", {
            error: "E-mail e/ou senha incorretos.",
            data: { email: readText(req.body?.email) },
        });
    }

    await promisify(req.session.regenerate.bind(req.session))();
    req.session.user = user;
    await promisify(req.session.save.bind(req.session))();
    return res.redirect(303, "/products");
}

async function logout(req, res) {
    await promisify(req.session.destroy.bind(req.session))();
    res.clearCookie("kosmetigames.sid", {
        httpOnly: true,
        sameSite: "lax",
        secure: req.app.get("secure session cookie"),
    });
    res.redirect(303, "/products");
}

module.exports = { showLogin, login, logout };
