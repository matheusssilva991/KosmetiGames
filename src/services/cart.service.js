const carts = require("../models/cart.model");
const products = require("../models/product.model");
const transaction = require("../database/transaction");
const { HttpError } = require("../lib/http");
const { readUInt, requireId, priceInCents } = require("../lib/validation");

async function forBuyer(userId, work) {
    return transaction(async (connection) => {
        // Cart writes for one buyer are serialized before reading or creating their order.
        if (!(await carts.lockBuyer(connection, userId))) {
            throw new HttpError(404, "Conta não encontrada.");
        }
        return work(connection);
    });
}

async function findCart(userId) {
    const cart = await carts.findCart(userId);
    const total = cart.items.reduce((sum, item) => {
        return item.archived_at
            ? sum
            : sum + priceInCents(item.price) * BigInt(item.quantity);
    }, 0n);
    return { ...cart, total };
}

async function addItem(userId, body) {
    const productId = requireId(body?.productId);
    const submittedQuantity = body?.quantity;
    const quantity =
        submittedQuantity == null || submittedQuantity === ""
            ? 1
            : readUInt(submittedQuantity);
    if (quantity === null) {
        throw new HttpError(
            422,
            "Informe uma quantidade inteira maior que zero.",
        );
    }

    return forBuyer(userId, async (connection) => {
        const product = await products.lock(connection, productId);
        if (!product || product.archived_at) {
            throw new HttpError(404, "Produto indisponível.");
        }
        if (product.user_id === userId) {
            throw new HttpError(
                403,
                "Você não pode comprar um produto que cadastrou.",
            );
        }

        const order = await carts.findOpenOrder(connection, userId);
        const existing = order
            ? await carts.findQuantity(connection, order.id, productId)
            : 0;
        if (quantity + existing > product.stock) {
            throw new HttpError(
                409,
                "A quantidade solicitada excede o estoque disponível.",
            );
        }
        const orderId =
            order?.id ?? (await carts.createOrder(connection, userId));
        await carts.saveItem(
            connection,
            orderId,
            productId,
            quantity + existing,
            existing,
        );
    });
}

async function removeItem(userId, itemId) {
    return forBuyer(userId, async (connection) => {
        const order = await carts.findOpenOrder(connection, userId);
        if (!order || !(await carts.removeItem(connection, order.id, itemId))) {
            throw new HttpError(404, "Item não encontrado no carrinho.");
        }
    });
}

async function checkout(userId, orderId) {
    return forBuyer(userId, async (connection) => {
        const order = await carts.findOrder(connection, userId, orderId);
        if (!order) {
            throw new HttpError(404, "Carrinho não encontrado.");
        }
        if (order.status === "closed") {
            return;
        }
        if (order.status !== "open") {
            throw new HttpError(409, "O carrinho não está aberto.");
        }

        const items = await carts.findItems(connection, orderId);
        if (!items.length) {
            throw new HttpError(
                409,
                "Adicione um produto antes de finalizar a compra.",
            );
        }

        const purchases = [];
        for (const item of items) {
            const product = await products.lock(connection, item.product_id);
            if (!product || product.archived_at) {
                throw new HttpError(
                    409,
                    "Remova os produtos indisponíveis do carrinho antes de finalizar.",
                );
            }
            if (
                product.user_id === userId ||
                item.quantity < 1 ||
                product.stock < item.quantity
            ) {
                throw new HttpError(
                    409,
                    `Não foi possível comprar a quantidade solicitada de ${product.name}.`,
                );
            }
            purchases.push({ item, product });
        }

        for (const { item, product } of purchases) {
            await carts.recordPurchase(connection, item, product);
        }
        await carts.closeOrder(connection, orderId);
    });
}

module.exports = {
    findCart,
    addItem,
    removeItem,
    checkout,
    findPurchases: carts.findPurchases,
};
