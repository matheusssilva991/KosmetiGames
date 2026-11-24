const carts = require("../services/cart.service");
const { requireId } = require("../lib/validation");
const { HttpError } = require("../lib/http");

async function show(req, res) {
    const cart = await carts.findCart(req.session.user.id);
    res.render("user/view_cart", { cart, error: null });
}

async function addItem(req, res) {
    await carts.addItem(req.session.user.id, req.body);
    res.redirect(303, "/cart");
}

async function removeItem(req, res) {
    await carts.removeItem(req.session.user.id, requireId(req.params.itemId));
    res.redirect(303, "/cart");
}

async function checkout(req, res) {
    try {
        await carts.checkout(req.session.user.id, requireId(req.body?.orderId));
    } catch (error) {
        if (error instanceof HttpError && error.status === 409) {
            const cart = await carts.findCart(req.session.user.id);
            return res
                .status(409)
                .render("user/view_cart", { cart, error: error.message });
        }
        throw error;
    }
    return res.redirect(303, "/account/orders");
}

async function showOrders(req, res) {
    const items = await carts.findPurchases(req.session.user.id);
    const orders = Object.groupBy(items, (item) => item.order_id);
    res.render("product/user_purchased_products", {
        orders: Object.values(orders).sort(
            (first, second) => second[0].order_id - first[0].order_id,
        ),
    });
}

module.exports = { show, addItem, removeItem, checkout, showOrders };
