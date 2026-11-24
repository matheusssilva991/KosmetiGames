const assert = require("node:assert/strict");
const { test } = require("node:test");
const { tmpdir } = require("node:os");
const { mkdtemp, readdir, rm } = require("node:fs/promises");
const path = require("node:path");
const { testUrl, createDatabase, seedFresh } = require("./database");
const { browser, startApp, assertRedirect } = require("./browser");

function field(html, name) {
    const value = html.match(
        new RegExp('name="' + name + '" value="([^"]+)"'),
    )?.[1];
    assert.ok(value, "Campo ausente no formulário: " + name);
    return value;
}

const account = {
    name: "Pessoa de teste",
    password: "senha-de-teste",
    address: "Rua do teste",
    phone_number: "",
};

async function registerAndLogin(base, email) {
    const client = browser(base);
    assert.equal((await client.request("/register")).status, 200);
    assertRedirect(
        await client.post("/register", { ...account, name: email, email }),
        303,
        "/login",
    );
    await client.request("/login");
    assertRedirect(
        await client.post("/login", { email, password: account.password }),
        303,
        "/products",
    );
    assert.equal((await client.request("/account")).status, 200);
    return client;
}

test(
    "conta, catálogo, uploads, carrinho concorrente e histórico",
    { skip: !testUrl },
    async (t) => {
        const { connection, config } = await createDatabase(t);
        await seedFresh(connection);
        const uploadDirectory = await mkdtemp(
            path.join(tmpdir(), "kosmeti-test-images-"),
        );
        t.after(() => rm(uploadDirectory, { recursive: true, force: true }));
        Object.assign(process.env, {
            MYSQL_HOST: config.host,
            MYSQL_PORT: String(config.port),
            MYSQL_USER: config.user,
            MYSQL_PASSWORD: config.password,
            MYSQL_DATABASE: config.database,
            UPLOAD_DIR: uploadDirectory,
        });
        const pool = require("../src/database/connection");
        t.after(() => pool.end());
        const base = await startApp(t, require("../src/app"));
        const seller = await registerAndLogin(base, "seller@example.test");
        const buyer = await registerAndLogin(base, "buyer@example.test");
        const second = await registerAndLogin(base, "runner-up@example.test");
        const guest = browser(base);

        const png = new Blob(
            [
                Buffer.from(
                    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3d0AAAAASUVORK5CYII=",
                    "base64",
                ),
            ],
            { type: "image/png" },
        );
        const fields = {
            name: "Skin d'Água",
            description: "Edição especial",
            price: "10,25",
            stock: "4",
            game_id: 1,
            category_id: 1,
        };
        const multipart = { multipart: true };
        const getProduct = async (name) => {
            const [rows] = await connection.execute(
                "SELECT * FROM product WHERE name = ?",
                [name],
            );
            return rows[0];
        };
        const add = (client, id, quantity) =>
            client.post("/cart/items", {
                productId: id,
                ...(quantity && { quantity }),
            });
        const checkout = async (client) =>
            field((await client.request("/cart")).html, "orderId");
        const images = async () => (await readdir(uploadDirectory)).sort();

        await t.test(
            "valida formulários e troca a senha com o mesmo e-mail",
            async () => {
                const login = browser(base);
                await login.request("/login");
                const rejected = await login.post("/login", {
                    email: "unknown@example.test",
                    password: "private-test-password",
                });
                assert.equal(rejected.status, 401);
                assert.doesNotMatch(rejected.html, /private-test-password/);
                const newPassword = "updated-test-password";
                assertRedirect(
                    await buyer.post("/account?_method=PATCH", {
                        ...account,
                        name: "Comprador",
                        email: "buyer@example.test",
                        password: newPassword,
                    }),
                    303,
                    "/account",
                );
                assert.match(
                    (await buyer.request("/account")).html,
                    /Comprador/,
                );
                assertRedirect(
                    await buyer.post("/account?_method=PATCH", {
                        ...account,
                        name: "Comprador",
                        email: "buyer@example.test",
                        password: "",
                    }),
                    303,
                    "/account",
                );
                const newSession = browser(base);
                await newSession.request("/login");
                assert.equal(
                    (
                        await newSession.post("/login", {
                            email: "buyer@example.test",
                            password: account.password,
                        })
                    ).status,
                    401,
                );
                assertRedirect(
                    await newSession.post("/login", {
                        email: "buyer@example.test",
                        password: newPassword,
                    }),
                    303,
                    "/products",
                );
                assert.equal(
                    (await newSession.request("/products")).status,
                    200,
                );
                assertRedirect(
                    await newSession.post("/logout"),
                    303,
                    "/products",
                );
                assertRedirect(
                    await newSession.request("/cart"),
                    302,
                    "/login",
                );
            },
        );

        let product;
        let lastUnit;
        await t.test(
            "usa links canônicos, valida imagens e confere a propriedade dos produtos",
            async () => {
                assert.equal(
                    (await seller.request("/products/new")).status,
                    200,
                );
                assert.equal(
                    (await seller.post("/products", fields, multipart)).status,
                    422,
                );
                assert.equal(
                    (
                        await seller.post(
                            "/products",
                            {
                                ...fields,
                                image: new Blob(["plain text"], {
                                    type: "image/png",
                                }),
                            },
                            multipart,
                        )
                    ).status,
                    422,
                );
                const oversized = new Blob(
                    [Buffer.alloc(5 * 1024 * 1024 + 1)],
                    { type: "image/png" },
                );
                assert.equal(
                    (
                        await seller.post(
                            "/products",
                            { ...fields, image: oversized },
                            multipart,
                        )
                    ).status,
                    413,
                );
                assert.deepEqual(await images(), []);
                assertRedirect(
                    await seller.post(
                        "/products",
                        { ...fields, image: png },
                        multipart,
                    ),
                    303,
                    "/account/products",
                );
                product = await getProduct(fields.name);
                assert.ok(product?.id);
                assert.equal(
                    (await guest.request(product.image_path)).status,
                    200,
                );

                assertRedirect(
                    await seller.post(
                        "/products",
                        {
                            ...fields,
                            name: "Só uma unidade",
                            stock: "1",
                            image: png,
                        },
                        multipart,
                    ),
                    303,
                    "/account/products",
                );
                lastUnit = await getProduct("Só uma unidade");

                const filtered = await guest.request(
                    "/products?game=1&category=1&search=" +
                        encodeURIComponent("d'Água"),
                );
                assert.equal(filtered.status, 200);
                assert.match(filtered.html, /Skin d/);
                assert.doesNotMatch(filtered.html, /Só uma unidade/);
                assert.match(
                    filtered.html,
                    new RegExp("/products/" + product.id),
                );
                assert.equal(
                    (await guest.request("/products?category=1&category=2"))
                        .status,
                    400,
                );
                assert.equal(
                    (await guest.request("/products/4294967295")).status,
                    404,
                );
                assertRedirect(
                    await seller.request(
                        "/user/" + product.user_id + "/products",
                    ),
                    302,
                    "/account/products",
                );
                assertRedirect(
                    await seller.request(
                        "/user/" +
                            product.user_id +
                            "/product/" +
                            product.id +
                            "/edit",
                    ),
                    302,
                    "/products/" + product.id + "/edit",
                );
                assert.equal(
                    (
                        await buyer.request(
                            "/user/" + product.user_id + "/products",
                        )
                    ).status,
                    403,
                );
                assert.equal(
                    (await buyer.request("/products/" + product.id + "/edit"))
                        .status,
                    403,
                );
                assert.equal(
                    (
                        await buyer.post(
                            "/products/" + product.id + "?_method=PATCH",
                            { ...fields, image: png },
                            multipart,
                        )
                    ).status,
                    403,
                );
                assert.equal(
                    (
                        await buyer.post(
                            "/products/" + product.id + "?_method=DELETE",
                        )
                    ).status,
                    403,
                );
                assert.equal(
                    (
                        await seller.post(
                            "/products/" + product.id + "?_method=PATCH",
                            {
                                ...fields,
                                version: product.version,
                                image: png,
                            },
                            { ...multipart, withToken: false },
                        )
                    ).status,
                    403,
                );
                assert.equal(await images().then((files) => files.length), 2);
            },
        );

        await t.test(
            "preserva a atomicidade da compra e vende a última unidade uma única vez",
            async () => {
                assert.match(
                    (await buyer.request("/cart")).html,
                    /carrinho está vazio/,
                );
                assert.equal((await add(seller, product.id, "1")).status, 403);
                assert.equal((await add(buyer, product.id, "-1")).status, 422);
                const additions = await Promise.all([
                    add(buyer, product.id, "2"),
                    add(second, lastUnit.id),
                    add(buyer, product.id),
                ]);
                for (const result of additions) {
                    assertRedirect(result, 303, "/cart");
                }
                assert.equal((await add(buyer, product.id, "2")).status, 409);
                assert.match(
                    (await buyer.request("/cart")).html,
                    /Total: R\$ 30,75/,
                );

                // This cart has a second product so failure can never decrement only part of it.
                assertRedirect(await add(buyer, lastUnit.id), 303, "/cart");
                const buyerCart = await checkout(buyer);
                const secondCart = await checkout(second);
                const buyerItemId = (await buyer.request("/cart")).html.match(
                    /\/cart\/items\/(\d+)\?_method=DELETE/,
                )[1];
                assert.equal(
                    (
                        await second.post(
                            "/cart/items/" + buyerItemId + "?_method=DELETE",
                        )
                    ).status,
                    404,
                );
                assert.equal(
                    (
                        await second.post("/cart/checkout", {
                            orderId: buyerCart,
                        })
                    ).status,
                    404,
                );

                await connection.query(
                    "CREATE TRIGGER fail_snapshot BEFORE UPDATE ON order_item FOR EACH ROW " +
                        "SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Falha simulada ao gravar o histórico'",
                );
                try {
                    assert.equal(
                        (
                            await buyer.post("/cart/checkout", {
                                orderId: buyerCart,
                            })
                        ).status,
                        500,
                    );
                    assert.equal((await getProduct(product.name)).stock, 4);
                    assert.equal((await getProduct(lastUnit.name)).stock, 1);
                    const [[unchanged]] = await connection.execute(
                        "SELECT status, closed_at FROM `order` WHERE id = ?",
                        [buyerCart],
                    );
                    assert.deepEqual(unchanged, {
                        status: "open",
                        closed_at: null,
                    });
                } finally {
                    await connection.query("DROP TRIGGER fail_snapshot");
                }

                const purchases = await Promise.all([
                    buyer.post("/cart/checkout", { orderId: buyerCart }),
                    second.post("/cart/checkout", { orderId: secondCart }),
                ]);
                assert.deepEqual(
                    purchases.map((result) => result.status).sort(),
                    [303, 409],
                );
                assert.equal((await getProduct(lastUnit.name)).stock, 0);
                const buyerWon = purchases[0].status === 303;
                const stockAfterRace = (await getProduct(product.name)).stock;
                assert.equal(stockAfterRace, buyerWon ? 1 : 4);

                const winner = buyerWon ? buyer : second;
                const winningCart = buyerWon ? buyerCart : secondCart;
                assertRedirect(
                    await winner.post("/cart/checkout", {
                        orderId: winningCart,
                    }),
                    303,
                    "/account/orders",
                );
                assert.equal((await getProduct(lastUnit.name)).stock, 0);
                assert.equal(
                    (await getProduct(product.name)).stock,
                    stockAfterRace,
                );

                if (!buyerWon) {
                    const [items] = await connection.execute(
                        "SELECT id FROM order_item WHERE order_id = ? AND product_id = ?",
                        [buyerCart, lastUnit.id],
                    );
                    assertRedirect(
                        await buyer.post(
                            "/cart/items/" + items[0].id + "?_method=DELETE",
                        ),
                        303,
                        "/cart",
                    );
                    assertRedirect(
                        await buyer.post("/cart/checkout", {
                            orderId: buyerCart,
                        }),
                        303,
                        "/account/orders",
                    );
                }
                assert.equal((await getProduct(product.name)).stock, 1);

                // Remove the only item from a new cart and then submit its old checkout form.
                assertRedirect(await add(buyer, product.id), 303, "/cart");
                const open = await buyer.request("/cart");
                const emptyOrder = field(open.html, "orderId");
                assertRedirect(
                    await buyer.post("/cart/checkout", { orderId: buyerCart }),
                    303,
                    "/account/orders",
                );
                assert.equal(await checkout(buyer), emptyOrder);
                const openItem = open.html.match(
                    /\/cart\/items\/(\d+)\?_method=DELETE/,
                )[1];
                assertRedirect(
                    await buyer.post(
                        "/cart/items/" + openItem + "?_method=DELETE",
                    ),
                    303,
                    "/cart",
                );
                assert.equal(
                    (
                        await buyer.post("/cart/checkout", {
                            orderId: emptyOrder,
                        })
                    ).status,
                    409,
                );
            },
        );

        await t.test(
            "preserva o histórico após editar, trocar a imagem e arquivar o produto",
            async () => {
                const productEndpoint = "/products/" + product.id;
                const updateUrl = productEndpoint + "?_method=PATCH";
                const currentVersion = field(
                    (await seller.request(productEndpoint + "/edit")).html,
                    "version",
                );
                const storedFiles = await images();
                const newFields = {
                    ...fields,
                    name: "Nome atualizado",
                    price: "99,00",
                    stock: "1",
                };

                assert.equal(
                    (
                        await seller.post(
                            updateUrl,
                            {
                                ...newFields,
                                version: product.version,
                                image: png,
                            },
                            multipart,
                        )
                    ).status,
                    409,
                );
                assert.deepEqual(await images(), storedFiles);
                assertRedirect(
                    await seller.post(
                        updateUrl,
                        { ...newFields, version: currentVersion },
                        multipart,
                    ),
                    303,
                    "/account/products",
                );
                assert.equal(
                    (await getProduct(newFields.name)).image_path,
                    product.image_path,
                );
                const replacementVersion = field(
                    (await seller.request(productEndpoint + "/edit")).html,
                    "version",
                );
                assertRedirect(
                    await seller.post(
                        updateUrl,
                        {
                            ...newFields,
                            version: replacementVersion,
                            image: png,
                        },
                        multipart,
                    ),
                    303,
                    "/account/products",
                );
                const replacement = await getProduct(newFields.name);
                assert.notEqual(replacement.image_path, product.image_path);
                assert.equal(
                    (await guest.request(product.image_path)).status,
                    200,
                );

                assertRedirect(await add(second, product.id), 303, "/cart");
                const otherCart = await checkout(second);
                assertRedirect(
                    await seller.post(productEndpoint + "?_method=DELETE"),
                    303,
                    "/account/products",
                );
                assert.equal(
                    (await guest.request(productEndpoint)).status,
                    404,
                );
                assert.equal(
                    (await guest.request(replacement.image_path)).status,
                    404,
                );
                assert.match(
                    (await second.request("/cart")).html,
                    /Produto indisponível/,
                );
                assert.equal(
                    (
                        await second.post("/cart/checkout", {
                            orderId: otherCart,
                        })
                    ).status,
                    409,
                );

                const history = await buyer.request("/account/orders");
                assert.equal(history.status, 200);
                assert.match(history.html, /Skin d/);
                assert.match(history.html, /Quantidade: 3/);
                assert.match(history.html, /10,25/);
                assert.match(history.html, new RegExp(product.image_path));
                assert.doesNotMatch(history.html, /Nome atualizado/);
            },
        );
    },
);
