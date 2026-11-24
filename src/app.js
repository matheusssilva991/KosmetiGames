require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("node:path");
const { MulterError } = require("multer");
const router = require("./routes/routes");
const { exposeSession } = require("./middlewares/auth.middleware");
const { imagesDirectory, imageUrl } = require("./multer/multer");
const { HttpError } = require("./lib/http");
const { priceInCents, formatCents } = require("./lib/validation");

function overrideMethod(req, res, next) {
    if (req.method === "POST" && req.query._method !== undefined) {
        if (req.query._method !== "PATCH" && req.query._method !== "DELETE") {
            return next(new HttpError(400, "Método do formulário inválido."));
        }
        req.method = req.query._method;
    }
    return next();
}

function createApp({
    sessionSecret = process.env.SESSION_SECRET,
    secureCookies = process.env.SESSION_COOKIE_SECURE === "true",
    trustProxy = process.env.TRUST_PROXY === "true",
} = {}) {
    if (!sessionSecret) {
        throw new Error("Defina SESSION_SECRET antes de iniciar a aplicação.");
    }

    const app = express();
    const root = path.join(__dirname, "..");
    app.disable("x-powered-by");
    app.set("query parser", "simple");
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "ejs");
    app.set("secure session cookie", secureCookies);
    if (trustProxy) {
        app.set("trust proxy", 1);
    }

    Object.assign(app.locals, {
        imageUrl,
        formatCents,
        formatPrice: (price) => formatCents(priceInCents(price)),
    });
    app.use((req, res, next) => {
        res.set("X-Content-Type-Options", "nosniff");
        next();
    });
    app.use("/css", express.static(path.join(root, "public/css")));
    app.use(
        "/images",
        (req, res, next) => {
            const image = imageUrl("/images" + decodeURIComponent(req.path));
            if (!image) {
                return next(new HttpError(404, "Imagem não encontrada."));
            }
            return next();
        },
        express.static(imagesDirectory, { index: false, redirect: false }),
    );

    app.use(overrideMethod);
    app.use(express.json({ limit: "64kb" }));
    app.use(
        express.urlencoded({
            extended: false,
            limit: "64kb",
            parameterLimit: 30,
        }),
    );
    app.use(
        session({
            name: "kosmetigames.sid",
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                sameSite: "lax",
                secure: secureCookies,
                maxAge: 24 * 60 * 60 * 1000,
            },
        }),
    );
    app.use(exposeSession);
    app.use(router);

    app.use((req, res, next) =>
        next(new HttpError(404, "Página não encontrada.")),
    );
    app.use((error, req, res, next) => {
        if (res.headersSent) {
            return next(error);
        }
        let status = 500;
        let message = "Não foi possível concluir a solicitação.";
        if (error instanceof HttpError) {
            ({ status, message } = error);
        } else if (
            error instanceof MulterError ||
            error.message === "Unexpected end of form"
        ) {
            status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            message =
                status === 413
                    ? "A imagem deve ter até 5 MiB."
                    : "Não foi possível ler o formulário de imagem.";
        } else if (
            error.status === 400 ||
            error.status === 413 ||
            error instanceof URIError
        ) {
            status = error.status || 400;
            message = "O formulário ou endereço é inválido.";
        } else {
            console.error("Falha na aplicação.", error.code ?? error.name);
        }
        return res
            .status(status)
            .render("error", {
                message,
                status,
                user: res.locals.user ?? null,
            });
    });

    return app;
}

module.exports = createApp;
