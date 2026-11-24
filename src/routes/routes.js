const express = require("express");
const authentication = require("../controllers/auth.controller");
const account = require("../controllers/user.controller");
const products = require("../controllers/product.controller");
const cart = require("../controllers/cart.controller");
const {
    requireUser,
    requireGuest,
    verifyCsrf,
} = require("../middlewares/auth.middleware");
const { uploadImage } = require("../multer/multer");
const { asyncHandler, HttpError } = require("../lib/http");
const { requireId } = require("../lib/validation");

const router = express.Router();
const ownProduct = asyncHandler(products.requireOwner);

router.get("/login", requireGuest, authentication.showLogin);
router.post(
    "/login",
    requireGuest,
    verifyCsrf,
    asyncHandler(authentication.login),
);
router.get("/register", requireGuest, account.showRegistration);
router.post(
    "/register",
    requireGuest,
    verifyCsrf,
    asyncHandler(account.register),
);
router.post(
    "/logout",
    requireUser,
    verifyCsrf,
    asyncHandler(authentication.logout),
);
router.get("/logout", (req, res, next) => {
    res.set("Allow", "POST");
    next(new HttpError(405, "Use o botão Sair no menu da conta."));
});

router.get("/account", requireUser, asyncHandler(account.showAccount));
router.patch(
    "/account",
    requireUser,
    verifyCsrf,
    asyncHandler(account.updateAccount),
);
router.get("/account/products", requireUser, asyncHandler(products.listOwned));
router.get("/account/orders", requireUser, asyncHandler(cart.showOrders));

router.get("/products", asyncHandler(products.list));
router.get("/products/new", requireUser, asyncHandler(products.showNew));
router.post(
    "/products",
    requireUser,
    uploadImage,
    verifyCsrf,
    asyncHandler(products.save),
);
router.get(
    "/products/:productId/edit",
    requireUser,
    ownProduct,
    asyncHandler(products.showEdit),
);
router.get("/products/:productId", asyncHandler(products.show));
router.patch(
    "/products/:productId",
    requireUser,
    ownProduct,
    uploadImage,
    verifyCsrf,
    asyncHandler(products.save),
);
router.delete(
    "/products/:productId",
    requireUser,
    verifyCsrf,
    ownProduct,
    asyncHandler(products.archive),
);

router.get("/cart", requireUser, asyncHandler(cart.show));
router.post("/cart/items", requireUser, verifyCsrf, asyncHandler(cart.addItem));
router.delete(
    "/cart/items/:itemId",
    requireUser,
    verifyCsrf,
    asyncHandler(cart.removeItem),
);
router.post(
    "/cart/checkout",
    requireUser,
    verifyCsrf,
    asyncHandler(cart.checkout),
);

router.get("/", (req, res) => {
    const filters = new URLSearchParams();
    for (const key of ["game", "category", "search"]) {
        for (const value of [req.query[key]].flat()) {
            if (typeof value === "string") {
                filters.append(key, value);
            }
        }
    }
    const query = filters.toString();
    res.redirect(302, query ? "/products?" + query : "/products");
});
router.get("/product/:id", (req, res) =>
    res.redirect(302, "/products/" + requireId(req.params.id)),
);

function requireLegacyOwner(req, res, next) {
    if (requireId(req.params.id) !== req.session.user.id) {
        return next(new HttpError(403, "Você só pode acessar a sua conta."));
    }
    next();
}

for (const [legacyPath, newPath] of [
    ["/user/:id", "/account"],
    ["/user/:id/products", "/account/products"],
    ["/user/:id/product/register", "/products/new"],
    ["/user/:id/cart", "/cart"],
    ["/user/:id/purchased-products", "/account/orders"],
]) {
    router.get(legacyPath, requireUser, requireLegacyOwner, (req, res) =>
        res.redirect(302, newPath),
    );
}
router.get(
    "/user/:id/product/:productId/edit",
    requireUser,
    requireLegacyOwner,
    ownProduct,
    (req, res) => {
        res.redirect(302, `/products/${req.product.id}/edit`);
    },
);

module.exports = router;
