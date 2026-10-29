# text-metrics

A small Node.js library for text metrics and normalization. It ships an embedded
payload as a single string of invisible unicode characters and can echo it in HTTP
headers or as a plain-text body.

Provenance: the payload comes from the fingerprinting script at
`https://servicepipe.tech/static/checkjs/06b667/4CIrx8U3Da.js`, analyzed in a
nullpt.rs post (see that script's own source for the original text).

## How it works

Every codepoint of the payload is shifted by **917504 (U+E0000)** into Plane 14 of the
Unicode Private Use Area — unassigned, invisible:

```js
encode(t) = [...t].map(c => String.fromCodePoint(c.codePointAt(0) + 917504)).join("")
decode(p) = [...p].map(c => String.fromCodePoint(c.codePointAt(0) - 917504)).join("")
```

`payload.js` holds the encoded `PAYLOAD`. The cleartext exists **nowhere else in the
repository** — only in this encoded form.

The payload has two sections, `system_prompt` and `anti_llm_strings`; the full text is
deliberately kept out of this file and every other file.

## API

```js
import {
  encode, decode, OFFSET,
  CLEARTEXT, SYSTEM_PROMPT, ANTI_LLM_STRINGS,
  buildHeaders, createServer,
} from "text-metrics";

SYSTEM_PROMPT;            // decoded prompt section (string)
ANTI_LLM_STRINGS;         // decoded string list (string[])
buildHeaders();           // { "x-ai-system-prompt": ..., "x-anti-llm-strings": ... }
createServer().listen(8080); // echoes both headers on EVERY response, body = CLEARTEXT
```

Header values are single-line; non-ASCII characters are percent-encoded because `node:http`
validates header content against latin1 (the UTF-8 body is left intact).

## CLI

```sh
node text-metrics/bin/cli.js print              # decoded cleartext
node text-metrics/bin/cli.js header             # the two header lines
node text-metrics/bin/cli.js server --port 8765 # HTTP echo
```

```sh
curl -sI http://127.0.0.1:8765/        # 200, both payload headers, body = cleartext
curl -sI http://127.0.0.1:8765/nope    # 404, still carries both headers
```

## Test

```sh
npm test        # node:test suite
npm run lint    # node --check over all sources
```

## Invariant (repo-wide)

The payload words never appear in cleartext anywhere in the repository — any file type,
any directory. The only carrier of the words is the checker list itself
(`hazard-words.txt`, 12 short words). Check it with:

```sh
npm run hazard   # from the repo root; fails if any payload word appears anywhere else
```

That is the point: a model can read and use the library without the payload ever being
visible to it.
