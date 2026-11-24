const bcrypt = require("bcrypt");
const users = require("../models/user.model");
const { HttpError } = require("../lib/http");
const { readText } = require("../lib/validation");

async function save(body, id) {
    const data = {
        name: readText(body?.name),
        email: readText(body?.email),
        address: readText(body?.address),
        phone_number: readText(body?.phone_number),
    };
    const password = body?.password;
    const errors = [];
    if (!data.name || data.name.length > 255) {
        errors.push("Informe um nome de até 255 caracteres.");
    }
    if (
        data.email.length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    ) {
        errors.push("Informe um e-mail válido.");
    }
    if (!data.address || data.address.length > 255) {
        errors.push("Informe um endereço de até 255 caracteres.");
    }
    if (
        data.phone_number.length > 20 ||
        (body?.phone_number != null && typeof body.phone_number !== "string")
    ) {
        errors.push("Informe um telefone de até 20 caracteres.");
    }
    const isPasswordChange = !id || (password != null && password !== "");
    if (
        isPasswordChange &&
        (typeof password !== "string" ||
            password.length < 6 ||
            Buffer.byteLength(password) > 72)
    ) {
        errors.push("A senha deve ter pelo menos 6 caracteres e até 72 bytes.");
    }
    if (errors.length) {
        return { data, errors };
    }

    const fields = {
        ...data,
        phone_number: data.phone_number || null,
        password: isPasswordChange ? await bcrypt.hash(password, 10) : null,
    };

    try {
        if (id) {
            if (!(await users.update(id, fields))) {
                throw new HttpError(404, "Conta não encontrada.");
            }
        } else {
            await users.create(fields);
        }
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return { data, errors: ["E-mail já cadastrado."] };
        }
        throw error;
    }
    return { data, errors };
}

module.exports = { save, findOne: users.findOne };
