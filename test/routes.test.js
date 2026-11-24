const assert = require("node:assert/strict");
const { test } = require("node:test");
const { browser, startApp, assertRedirect } = require("./browser");

test("rotas públicas, proteção de formulários e redirecionamentos sem banco", async (t) => {
    const createApp = require("../src/app");
    const client = browser(await startApp(t, createApp));
    assertRedirect(
        await client.request("/?game=2&search=A%26B"),
        302,
        "/products?game=2&search=A%26B",
    );
    assertRedirect(await client.request("/product/15"), 302, "/products/15");
    assert.equal((await client.request("/product/oito")).status, 400);
    assertRedirect(await client.request("/cart"), 302, "/login");
    assertRedirect(await client.request("/user/1/cart"), 302, "/login");
    const alternateLogin = await client.request("/Login/");
    assert.equal(alternateLogin.status, 200);
    assert.match(alternateLogin.html, /name="_csrf" value="[a-f0-9]{64}"/);
    assert.equal((await client.request("/register")).status, 200);
    assert.equal(
        (await client.post("/register", {}, { withToken: false })).status,
        403,
    );
    const logout = await client.request("/logout");
    assert.equal(logout.status, 405);
    assert.equal(logout.headers.get("allow"), "POST");
    assert.equal(
        (await client.post("/user/1/cart/checkout", {}, { withToken: false }))
            .status,
        404,
    );
    assert.equal(
        (await client.post("/account?_method=GET", {}, { withToken: false }))
            .status,
        400,
    );
});
