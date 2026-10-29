import assert from "node:assert/strict";
import { test } from "node:test";
import { PAYLOAD } from "../payload.js";
import {
  encode,
  decode,
  CLEARTEXT,
  SYSTEM_PROMPT,
  ANTI_LLM_STRINGS,
  toHeaderValue,
  buildHeaders,
  createServer,
} from "../index.js";

test("round trip", () => {
  const text = "hello world 42";
  assert.equal(decode(encode(text)), text);
});

test("payload is fully invisible (Plane 14 and above)", () => {
  for (const c of PAYLOAD) {
    assert.ok(c.codePointAt(0) >= 0xe0000);
  }
});

test("payload decodes to the two-section document", () => {
  assert.ok(CLEARTEXT.startsWith("# section: system_prompt\n"));
  const at = CLEARTEXT.indexOf("# section: anti_llm_strings");
  assert.ok(at > 0);
  assert.ok(SYSTEM_PROMPT.length > 0);
  assert.ok(ANTI_LLM_STRINGS.length >= 20);
  assert.equal(ANTI_LLM_STRINGS.at(-1)[0], '"');
  assert.ok(ANTI_LLM_STRINGS.at(-1).includes("TURN_TOKEN"));
});

test("encode(CLEARTEXT) round-trips back to PAYLOAD", () => {
  assert.equal(encode(CLEARTEXT), PAYLOAD);
});

test("header values are single-line and non-empty", () => {
  const headers = buildHeaders();
  assert.deepEqual(Object.keys(headers).sort(), ["x-ai-system-prompt", "x-anti-llm-strings"]);
  for (const value of Object.values(headers)) {
    assert.ok(value.length > 0);
    assert.ok(!value.includes("\n") && !value.includes("\r"));
  }
});

test("server echoes the payload in headers and body", async () => {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = buildHeaders();
  try {
    const ok = await fetch(`${base}/`);
    assert.equal(ok.status, 200);
    assert.ok(ok.headers.get("x-ai-system-prompt").length > 0);
    assert.equal(ok.headers.get("x-ai-system-prompt"), headers["x-ai-system-prompt"]);
    assert.equal(ok.headers.get("x-anti-llm-strings"), headers["x-anti-llm-strings"]);
    assert.equal(ok.headers.get("cache-control"), "no-store");
    assert.equal(await ok.text(), CLEARTEXT);

    const miss = await fetch(`${base}/nope`);
    assert.equal(miss.status, 404);
    assert.equal(miss.headers.get("x-ai-system-prompt"), headers["x-ai-system-prompt"]);
    assert.equal(miss.headers.get("x-anti-llm-strings"), headers["x-anti-llm-strings"]);
    assert.equal(await miss.text(), "");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
