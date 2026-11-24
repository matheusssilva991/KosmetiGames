const products = require("../services/product.service");
const { requireId } = require("../lib/validation");

async function list(req, res) {
    const filters = products.catalogFilters(req.query);
    const [items, options] = await Promise.all([
        products.findCatalog(filters),
        products.findOptions(),
    ]);
    res.render("home", { products: items, filters, ...options });
}

async function show(req, res) {
    const product = await products.findOne(requireId(req.params.productId));
    res.render("product/view_product", { product });
}

async function listOwned(req, res) {
    const items = await products.findByOwner(req.session.user.id);
    res.render("product/user_products", { products: items });
}

async function requireOwner(req, res, next) {
    req.product = await products.findOwned(
        requireId(req.params.productId),
        req.session.user.id,
    );
    next();
}

async function showNew(req, res) {
    res.render("product/product_form", {
        data: {},
        errors: [],
        ...(await products.findOptions()),
    });
}

async function showEdit(req, res) {
    res.render("product/product_form", {
        data: req.product,
        errors: [],
        ...(await products.findOptions()),
    });
}

async function save(req, res) {
    const result = await products.save(
        req.session.user.id,
        req.body,
        req.file,
        req.product,
    );
    if (result.errors) {
        return res.status(422).render("product/product_form", result);
    }
    return res.redirect(303, "/account/products");
}

async function archive(req, res) {
    await products.archive(req.product.id, req.session.user.id);
    res.redirect(303, "/account/products");
}

module.exports = {
    list,
    show,
    listOwned,
    requireOwner,
    showNew,
    showEdit,
    save,
    archive,
};
