const { HttpError } = require("./http");

const MAX_UINT = 4_294_967_295;

function readUInt(value, minimum = 1) {
    if (
        typeof value !== "number" &&
        (typeof value !== "string" || !/^\d+$/.test(value))
    ) {
        return null;
    }

    const number = Number(value);
    return Number.isInteger(number) && number >= minimum && number <= MAX_UINT
        ? number
        : null;
}

function requireId(value) {
    const id = readUInt(value);
    if (id === null) {
        throw new HttpError(400, "Identificador inválido.");
    }
    return id;
}

function readText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function readPrice(value) {
    const price = readText(value).replace(",", ".");
    if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(price)) {
        return null;
    }
    const [whole, decimals = ""] = price.split(".");
    return `${Number(whole)}.${decimals.padEnd(2, "0")}`;
}

function priceInCents(price) {
    const [whole, decimals = ""] = String(price).split(".");
    return BigInt(whole + decimals.padEnd(2, "0"));
}

function formatCents(cents) {
    return `${cents / 100n},${String(cents % 100n).padStart(2, "0")}`;
}

module.exports = {
    readUInt,
    requireId,
    readText,
    readPrice,
    priceInCents,
    formatCents,
};
