const bcrypt = require("bcrypt");
const users = require("../models/user.model");
const { readText } = require("../lib/validation");

async function login(body) {
    const email = readText(body?.email);
    const password = body?.password;
    if (
        !email ||
        email.length > 255 ||
        typeof password !== "string" ||
        !password
    ) {
        return null;
    }

    const user = await users.findCredentials(email);
    if (user && (await bcrypt.compare(password, user.password))) {
        return { id: user.id, name: user.name };
    }
    return null;
}

module.exports = { login };
