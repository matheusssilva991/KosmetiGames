const products = require("../models/product.model");
const games = require("../models/game.model");
const categories = require("../models/category.model");
const transaction = require("../database/transaction");
const { detectImage, writeImage, removeImage } = require("../multer/multer");
const { HttpError } = require("../lib/http");
const {
    readUInt,
    requireId,
    readText,
    readPrice,
} = require("../lib/validation");

function catalogFilters(query) {
    const filters = {};
    for (const field of ["game", "category"]) {
        if (query[field] != null && query[field] !== "") {
            filters[field] = requireId(query[field]);
        }
    }
    if (query.search != null) {
        if (typeof query.search !== "string" || query.search.length > 255) {
            throw new HttpError(400, "A busca deve conter até 255 caracteres.");
        }
        filters.search = query.search.trim();
    }
    return filters;
}

function findCatalog(filters) {
    return products.findAll({
        gameId: filters.game,
        categoryId: filters.category,
        search: filters.search,
    });
}

async function findOptions() {
    const [gameOptions, categoryOptions] = await Promise.all([
        games.findAll(),
        categories.findAll(),
    ]);
    return { games: gameOptions, categories: categoryOptions };
}

async function findOne(id) {
    const product = await products.findOne(id);
    if (!product) {
        throw new HttpError(404, "Produto não encontrado.");
    }
    return product;
}

function requireOwner(product, ownerId) {
    if (product.user_id !== ownerId) {
        throw new HttpError(
            403,
            "Você não tem permissão para gerenciar este produto.",
        );
    }
}

async function findOwned(id, ownerId) {
    const product = await findOne(id);
    requireOwner(product, ownerId);
    return product;
}

async function releaseImage(imagePath) {
    if (!imagePath) {
        return;
    }
    try {
        if (!(await products.imageIsReferenced(imagePath))) {
            await removeImage(imagePath);
        }
    } catch (error) {
        console.error("Falha ao liberar imagem de produto.", error.code);
    }
}

async function save(ownerId, body, file, current) {
    const data = {
        id: current?.id,
        version: current?.version,
        name: readText(body?.name),
        description: readText(body?.description),
        price: readText(body?.price),
        stock: readText(body?.stock),
        game_id: readUInt(body?.game_id),
        category_id: readUInt(body?.category_id),
    };
    const price = readPrice(data.price);
    const stock = readUInt(data.stock, 0);
    const version = current ? readUInt(body?.version, 0) : null;
    const extension = file ? detectImage(file.buffer) : null;
    const options = await findOptions();
    const errors = [];
    if (!data.name || data.name.length > 255) {
        errors.push("Informe um nome de até 255 caracteres.");
    }
    if (!data.description || data.description.length > 8000) {
        errors.push("Informe uma descrição de até 8.000 caracteres.");
    }
    if (price === null) {
        errors.push(
            "Informe um preço não negativo com até duas casas decimais.",
        );
    }
    if (stock === null) {
        errors.push("Informe um estoque inteiro entre 0 e 4.294.967.295.");
    }
    if (!options.games.some((game) => game.id === data.game_id)) {
        errors.push("Selecione um jogo válido.");
    }
    if (
        !options.categories.some((category) => category.id === data.category_id)
    ) {
        errors.push("Selecione uma categoria válida.");
    }
    if ((!current && !file) || (file && !extension)) {
        errors.push("Envie uma imagem JPEG, PNG ou WebP.");
    }
    if (current && version === null) {
        errors.push("Reabra o formulário para editar o produto.");
    }
    if (errors.length) {
        // A nova submissão deve continuar usando a versão que o vendedor editou.
        return { data: { ...data, version }, errors, ...options };
    }

    const imagePath = file ? await writeImage(file, extension) : null;
    const fields = {
        ...data,
        price,
        stock,
        image_path: imagePath,
        user_id: ownerId,
    };
    try {
        if (!current) {
            return { id: await products.create(fields) };
        }

        const oldImage = await transaction(async (connection) => {
            const product = await products.lock(connection, current.id);
            if (!product || product.archived_at) {
                throw new HttpError(404, "Produto não encontrado.");
            }
            requireOwner(product, ownerId);
            fields.image_path = imagePath ?? product.image_path;

            if (
                !(await products.update(
                    connection,
                    current.id,
                    ownerId,
                    version,
                    fields,
                ))
            ) {
                throw new HttpError(
                    409,
                    "O produto mudou desde que você abriu o formulário. Reabra a página e revise os dados.",
                );
            }
            return product.image_path;
        });

        if (imagePath) {
            await releaseImage(oldImage);
        }
        return { id: current.id };
    } catch (error) {
        await releaseImage(imagePath);
        throw error;
    }
}

async function archive(id, ownerId) {
    const imagePath = await transaction(async (connection) => {
        const product = await products.lock(connection, id);
        if (!product || product.archived_at) {
            throw new HttpError(404, "Produto não encontrado.");
        }
        requireOwner(product, ownerId);
        await products.archive(connection, id, ownerId);
        return product.image_path;
    });
    await releaseImage(imagePath);
}

module.exports = {
    catalogFilters,
    findCatalog,
    findOptions,
    findOne,
    findOwned,
    save,
    archive,
    findByOwner: (ownerId) => products.findAll({ ownerId }),
};
