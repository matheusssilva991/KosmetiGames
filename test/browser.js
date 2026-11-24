const assert = require("node:assert/strict");
const { once } = require("node:events");

function browser(base) {
    let cookie;
    let token;
    async function request(url, options = {}) {
        const response = await fetch(base + url, {
            redirect: "manual",
            ...options,
            headers: { ...(cookie && { cookie }), ...options.headers },
        });
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) {
            cookie = setCookie.split(";")[0];
        }
        const html = await response.text();
        token = html.match(/name="_csrf" value="([a-f0-9]{64})"/)?.[1] ?? token;
        return { status: response.status, headers: response.headers, html };
    }
    async function post(
        url,
        data = {},
        { withToken = true, multipart = false } = {},
    ) {
        const body = multipart ? new FormData() : new URLSearchParams();
        for (const [name, value] of Object.entries(data)) {
            body.append(name, value);
        }
        if (withToken) {
            body.append("_csrf", token);
        }
        return request(url, { method: "POST", body });
    }
    return { request, post };
}

function assertRedirect(response, status, location) {
    assert.equal(response.status, status, response.html);
    assert.equal(response.headers.get("location"), location);
}

async function startApp(t, createApp) {
    const server = createApp({
        sessionSecret: "test-only-session-secret",
    }).listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(
        () =>
            new Promise((resolve, reject) => {
                server.close((error) => (error ? reject(error) : resolve()));
            }),
    );
    return "http://127.0.0.1:" + server.address().port;
}

module.exports = { browser, startApp, assertRedirect };
