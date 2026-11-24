require("dotenv").config();

const { createHash } = require("node:crypto");
const mysql = require("mysql2/promise");
const config = require("./config");

const ORDER = "`order`";
const MAX_PRICE = "9999999999.99";

function identifier(name) {
    return "`" + name.replaceAll("`", "``") + "`";
}

async function firstRow(connection, sql, params = []) {
    const [rows] = await connection.execute(sql, params);
    return rows[0];
}

async function columns(connection, table) {
    const [rows] = await connection.execute(
        `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable
     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [table],
    );
    if (!rows.length) {
        throw new Error(
            "Tabela ausente: " +
                table +
                ". Em um banco novo, importe schema.sql.",
        );
    }
    return new Map(rows.map((row) => [row.name, row]));
}

async function foreignKeys(connection, table) {
    const [rows] = await connection.execute(
        `SELECT k.CONSTRAINT_NAME AS name, k.COLUMN_NAME AS columnName,
            k.REFERENCED_TABLE_NAME AS target, k.REFERENCED_COLUMN_NAME AS targetColumn,
            r.DELETE_RULE AS onDelete, r.UPDATE_RULE AS onUpdate
     FROM information_schema.KEY_COLUMN_USAGE AS k
     INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS AS r
       ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
       AND r.TABLE_NAME = k.TABLE_NAME
     WHERE k.TABLE_SCHEMA = DATABASE() AND k.TABLE_NAME = ?`,
        [table],
    );
    return rows;
}

async function assertEmpty(connection, sql, message, params) {
    const row = await firstRow(connection, sql, params);
    if (row) {
        throw new Error(
            message + " Registro: " + Object.values(row).join(", ") + ".",
        );
    }
}

async function addColumns(connection, table, current, definitions) {
    const additions = Object.entries(definitions)
        .filter(([name]) => !current.has(name))
        .map(
            ([name, definition]) =>
                "ADD COLUMN " + identifier(name) + " " + definition,
        );
    if (additions.length) {
        await connection.query(
            "ALTER TABLE " + identifier(table) + " " + additions.join(", "),
        );
    }
}

async function addConstraint(connection, table, name, definition) {
    const exists = await firstRow(
        connection,
        `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
        [table, name],
    );
    if (!exists) {
        await connection.query(
            "ALTER TABLE " + identifier(table) + " ADD " + definition,
        );
    }
}

function normalizeForeignKey(keys, { name, column, target, onDelete }) {
    const matches = keys.filter((key) => key.columnName === column);
    if (
        matches.length === 1 &&
        matches[0].target === target &&
        matches[0].targetColumn === "id" &&
        matches[0].onDelete === onDelete &&
        matches[0].onUpdate === "CASCADE"
    ) {
        return null;
    }
    return {
        drops: matches.map((key) => "DROP FOREIGN KEY " + identifier(key.name)),
        add: `ADD CONSTRAINT ${identifier(name)} FOREIGN KEY (${identifier(column)}) REFERENCES
      ${identifier(target)} (id) ON DELETE ${onDelete} ON UPDATE CASCADE`,
    };
}

async function applyForeignKeys(connection, table, changes) {
    const activeChanges = changes.filter(Boolean);
    const drops = activeChanges.flatMap((change) => change.drops);
    const additions = activeChanges.map((change) => change.add);
    const alter = "ALTER TABLE " + identifier(table) + " ";
    if (drops.length) {
        await connection.query(alter + drops.join(", "));
    }
    if (additions.length) {
        await connection.query(alter + additions.join(", "));
    }
}

async function preflight(connection, { order, item, orderKeys }) {
    const legacyOwner = orderKeys.some(
        (key) =>
            key.columnName === "id" &&
            key.target === "user" &&
            key.targetColumn === "id",
    );
    const buyerColumn = order.get("user_id");
    const buyerId = buyerColumn
        ? legacyOwner
            ? "COALESCE(o.user_id, o.id)"
            : "o.user_id"
        : legacyOwner
          ? "o.id"
          : "NULL";

    await assertEmpty(
        connection,
        `SELECT o.id FROM ${ORDER} AS o LEFT JOIN user AS u ON u.id = ${buyerId} WHERE u.id IS NULL LIMIT 1`,
        "Pedido sem comprador identificável.",
    );
    await assertEmpty(
        connection,
        `SELECT o.id FROM ${ORDER} AS o WHERE o.status NOT IN ('open', 'closed') LIMIT 1`,
        "Pedido com status desconhecido.",
    );
    await assertEmpty(
        connection,
        `SELECT ${buyerId} AS buyer FROM ${ORDER} AS o WHERE o.status = 'open'
     GROUP BY buyer HAVING COUNT(*) > 1 LIMIT 1`,
        "Comprador com mais de um carrinho aberto.",
    );
    await assertEmpty(
        connection,
        `SELECT i.id FROM order_item AS i LEFT JOIN ${ORDER} AS o ON o.id = i.order_id
     LEFT JOIN product AS p ON p.id = i.product_id WHERE o.id IS NULL OR p.id IS NULL LIMIT 1`,
        "Item sem pedido ou produto correspondente.",
    );
    await assertEmpty(
        connection,
        `SELECT p.id FROM product AS p LEFT JOIN game AS g ON g.id = p.game_id
     LEFT JOIN category AS c ON c.id = p.category_id LEFT JOIN user AS u ON u.id = p.user_id
     WHERE g.id IS NULL OR c.id IS NULL OR u.id IS NULL LIMIT 1`,
        "Produto sem jogo, categoria ou vendedor correspondente.",
    );
    if (!item.has("quantity")) {
        await assertEmpty(
            connection,
            "SELECT id FROM order_item LIMIT 1",
            "Item sem quantidade registrada.",
        );
    } else {
        await assertEmpty(
            connection,
            "SELECT id FROM order_item WHERE quantity IS NULL OR quantity < 1 LIMIT 1",
            "Item com quantidade inválida.",
        );
    }
    await assertEmpty(
        connection,
        `SELECT order_id, product_id FROM order_item
     GROUP BY order_id, product_id HAVING COUNT(*) > 1 LIMIT 1`,
        "Pedido com itens duplicados.",
    );
    await assertEmpty(
        connection,
        "SELECT id FROM product WHERE price < 0 OR ROUND(CAST(price AS DECIMAL(60,12)), 2) > ? LIMIT 1",
        "Preço fora do intervalo suportado.",
        [MAX_PRICE],
    );

    return legacyOwner;
}

async function applyMigration(connection) {
    const order = await columns(connection, "order");
    const item = await columns(connection, "order_item");
    const product = await columns(connection, "product");
    const orderKeys = await foreignKeys(connection, "order");
    const itemKeys = await foreignKeys(connection, "order_item");
    const legacyOwner = await preflight(connection, { order, item, orderKeys });

    await addColumns(connection, "product", product, {
        image_path: "VARCHAR(255) NULL",
        archived_at: "TIMESTAMP NULL",
        version: "INT UNSIGNED NOT NULL DEFAULT 0",
    });
    if (product.get("price")?.type !== "decimal(12,2)") {
        await connection.query(
            "ALTER TABLE product MODIFY COLUMN price DECIMAL(12,2) NOT NULL",
        );
    }
    await addConstraint(
        connection,
        "product",
        "product_nonnegative_price",
        "CONSTRAINT product_nonnegative_price CHECK (price >= 0)",
    );

    await addColumns(connection, "order", order, {
        user_id: "INT UNSIGNED NULL",
        closed_at: "TIMESTAMP NULL",
    });
    if (legacyOwner) {
        await connection.execute(
            `UPDATE ${ORDER} SET user_id = id WHERE user_id IS NULL`,
        );
    }
    if (order.get("user_id")?.nullable !== "NO") {
        await connection.query(
            `ALTER TABLE ${ORDER} MODIFY COLUMN user_id INT UNSIGNED NOT NULL`,
        );
    }
    await applyForeignKeys(connection, "order", [
        normalizeForeignKey(orderKeys, {
            name: "order_user_fk",
            column: "user_id",
            target: "user",
            onDelete: "CASCADE",
        }),
    ]);
    if (legacyOwner) {
        const drops = orderKeys
            .filter((key) => key.columnName === "id" && key.target === "user")
            .map((key) => "DROP FOREIGN KEY " + identifier(key.name));
        await connection.query(`ALTER TABLE ${ORDER} ${drops.join(", ")}`);
    }
    await addColumns(connection, "order", order, {
        open_user_id:
            "INT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status = 'open' THEN user_id END) VIRTUAL",
    });
    await addConstraint(
        connection,
        "order",
        "order_one_open_per_user",
        "UNIQUE KEY order_one_open_per_user (open_user_id)",
    );
    const historyIndex = await firstRow(
        connection,
        `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order' AND INDEX_NAME = 'order_user_status' LIMIT 1`,
    );
    if (!historyIndex) {
        await connection.query(
            `ALTER TABLE ${ORDER} ADD KEY order_user_status (user_id, status)`,
        );
    }

    await addColumns(connection, "order_item", item, {
        quantity: "INT UNSIGNED NOT NULL",
        snapshot_name: "VARCHAR(255) NULL",
        snapshot_description: "LONGTEXT NULL",
        snapshot_price: "DECIMAL(12,2) NULL",
        snapshot_image_path: "VARCHAR(255) NULL",
        snapshot_game: "VARCHAR(255) NULL",
        snapshot_category: "VARCHAR(255) NULL",
    });
    await applyForeignKeys(connection, "order_item", [
        normalizeForeignKey(itemKeys, {
            name: "item_order_fk",
            column: "order_id",
            target: "order",
            onDelete: "CASCADE",
        }),
        normalizeForeignKey(itemKeys, {
            name: "item_product_fk",
            column: "product_id",
            target: "product",
            onDelete: "RESTRICT",
        }),
    ]);
    await addConstraint(
        connection,
        "order_item",
        "order_item_once_per_product",
        "UNIQUE KEY order_item_once_per_product (order_id, product_id)",
    );
    await addConstraint(
        connection,
        "order_item",
        "order_item_positive_quantity",
        "CONSTRAINT order_item_positive_quantity CHECK (quantity > 0)",
    );

    await connection.execute(
        `UPDATE order_item AS i INNER JOIN ${ORDER} AS o ON o.id = i.order_id
     INNER JOIN product AS p ON p.id = i.product_id
     INNER JOIN game AS g ON g.id = p.game_id
     INNER JOIN category AS c ON c.id = p.category_id
     SET i.snapshot_name = p.name, i.snapshot_description = p.description, i.snapshot_price = p.price,
         i.snapshot_image_path = p.image_path, i.snapshot_game = g.name, i.snapshot_category = c.name
     WHERE o.status = 'closed' AND i.snapshot_name IS NULL`,
    );
}

async function migrate(connection) {
    const { name } = await firstRow(connection, "SELECT DATABASE() AS name");
    if (!name) {
        throw new Error("Selecione o banco a migrar.");
    }
    const lock = createHash("sha256")
        .update("KosmetiGames migration " + name)
        .digest("hex");
    const { acquired } = await firstRow(
        connection,
        "SELECT GET_LOCK(?, 0) AS acquired",
        [lock],
    );
    if (acquired !== 1) {
        throw new Error("Já há uma migração em execução para este banco.");
    }
    try {
        await applyMigration(connection);
    } finally {
        await connection.execute("DO RELEASE_LOCK(?)", [lock]);
    }
}

async function main() {
    const connection = await mysql.createConnection(config);
    try {
        await migrate(connection);
        console.log("Esquema do KosmetiGames atualizado.");
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error("Migração interrompida.", error.message);
        process.exitCode = 1;
    });
}

module.exports = migrate;
