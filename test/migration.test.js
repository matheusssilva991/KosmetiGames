const assert = require("node:assert/strict");
const { test } = require("node:test");
const migrate = require("../src/database/migrate");
const { testUrl, createDatabase, readProjectFile } = require("./database");

async function seedLegacy(connection, hasImages) {
    await connection.query(
        `INSERT INTO user (id, name, email, password, address) VALUES
       (10, 'Compradora', 'buyer@legacy.test', 'x', 'Rua da compra'),
       (15, 'Vendedor', 'seller@legacy.test', 'x', 'Rua da venda');
     INSERT INTO game (id, name, enterprise) VALUES (1, 'Jogo', 'Empresa');
     INSERT INTO category (id, name) VALUES (1, 'Categoria');
     INSERT INTO product (id, name, description, price, stock, user_id, category_id, game_id${hasImages ? ", image_path" : ""})
       VALUES (1, 'Produto anterior', 'Descrição anterior', 10.256, 8, 15, 1, 1${hasImages ? ", '/images/old.jpg'" : ""});`,
    );
}

test(
    "migra o esquema que vinculava o ID do pedido ao ID do usuário",
    { skip: !testUrl },
    async (t) => {
        const { connection } = await createDatabase(t);
        await connection.query(await readProjectFile("test/legacy-schema.sql"));
        await seedLegacy(connection, false);
        await connection.query(
            "INSERT INTO `order` (id, status) VALUES (10, 'open')",
        );
        await migrate(connection);
        await migrate(connection);

        const [[order]] = await connection.query(
            "SELECT * FROM `order` WHERE id = 10",
        );
        assert.equal(order.user_id, 10);
        assert.equal(order.open_user_id, 10);
        const [[product]] = await connection.query(
            "SELECT price, stock, image_path FROM product WHERE id = 1",
        );
        assert.deepEqual(product, {
            price: "10.26",
            stock: 8,
            image_path: null,
        });
        const [result] = await connection.query(
            "INSERT INTO `order` (user_id, status) VALUES (15, 'open')",
        );
        assert.notEqual(result.insertId, 15);
        await assert.rejects(
            connection.query(
                "INSERT INTO `order` (user_id, status) VALUES (10, 'open')",
            ),
            { code: "ER_DUP_ENTRY" },
        );
    },
);

test(
    "preserva pedidos existentes e mantém o histórico estimado ao reaplicar",
    { skip: !testUrl },
    async (t) => {
        const { connection } = await createDatabase(t);
        const dump = await readProjectFile("dev_files/ecommerce.sql");
        // Drop the dump's original CREATE DATABASE and USE lines to keep this test isolated.
        await connection.query(dump.split(/\r?\n/).slice(2).join("\n"));
        await seedLegacy(connection, true);
        await connection.query(
            `INSERT INTO \`order\` (id, user_id, status) VALUES (100, 10, 'closed');
     INSERT INTO order_item (id, order_id, product_id, quantity) VALUES (200, 100, 1, 2);`,
        );
        await migrate(connection);
        await connection.query(
            "UPDATE product SET name = 'Alterado', stock = 7, price = 40 WHERE id = 1",
        );
        await migrate(connection);

        const [[item]] = await connection.query(
            "SELECT snapshot_name, snapshot_price, snapshot_image_path, quantity FROM order_item WHERE id = 200",
        );
        assert.deepEqual(item, {
            snapshot_name: "Produto anterior",
            snapshot_price: "10.26",
            snapshot_image_path: "/images/old.jpg",
            quantity: 2,
        });
        const [[order]] = await connection.query(
            "SELECT user_id, closed_at FROM `order` WHERE id = 100",
        );
        assert.deepEqual(order, { user_id: 10, closed_at: null });
        await assert.rejects(
            connection.query("DELETE FROM product WHERE id = 1"),
            { code: "ER_ROW_IS_REFERENCED_2" },
        );
    },
);

test(
    "interrompe antes de alterar os dados quando não é possível inferir a quantidade",
    { skip: !testUrl },
    async (t) => {
        const { connection } = await createDatabase(t);
        await connection.query(await readProjectFile("test/legacy-schema.sql"));
        await seedLegacy(connection, false);
        await connection.query(
            `INSERT INTO \`order\` (id, status) VALUES (10, 'closed');
     INSERT INTO order_item (id, order_id, product_id) VALUES (200, 10, 1);`,
        );
        await assert.rejects(
            migrate(connection),
            /Item sem quantidade registrada\. Registro: 200/,
        );
        const [[[row]], [columns]] = await Promise.all([
            connection.query("SELECT * FROM order_item WHERE id = 200"),
            connection.query("SHOW COLUMNS FROM product LIKE 'image_path'"),
        ]);
        assert.deepEqual(row, { id: 200, order_id: 10, product_id: 1 });
        assert.equal(columns.length, 0);
    },
);
