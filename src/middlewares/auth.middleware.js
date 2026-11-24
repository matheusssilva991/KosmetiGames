const { randomBytes, timingSafeEqual } = require("node:crypto");
const { HttpError } = require("../lib/http");

function requireUser(req, res, next) {
    if (!req.session.user?.id) {
        return res.redirect(
            req.method === "GET" || req.method === "HEAD" ? 302 : 303,
            "/login",
        );
    }
    return next();
}

function requireGuest(req, res, next) {
    if (req.session.user?.id) {
        return res.redirect(
            req.method === "GET" || req.method === "HEAD" ? 302 : 303,
            "/products",
        );
    }
    return next();
}

function exposeSession(req, res, next) {
    res.locals.user = req.session.user ?? null;
    if (req.session.user || /^\/(login|register)\/?$/i.test(req.path)) {
        res.set("Cache-Control", "no-store");
        res.locals.csrfToken = req.session.csrfToken ??=
            randomBytes(32).toString("hex");
    }
    next();
}

function verifyCsrf(req, res, next) {
    const token = req.body?._csrf;
    const expected = req.session.csrfToken;
    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/.test(token) ||
        !expected ||
        !timingSafeEqual(
            Buffer.from(token, "hex"),
            Buffer.from(expected, "hex"),
        )
    ) {
        return next(
            new HttpError(
                403,
                "Formulário inválido ou expirado. Recarregue a página e tente novamente.",
            ),
        );
    }
    return next();
}

module.exports = { requireUser, requireGuest, exposeSession, verifyCsrf };
