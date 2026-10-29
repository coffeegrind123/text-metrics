import { PAYLOAD } from "./payload.js";

export const OFFSET = 917504;

export function encode(text) {
  return [...text].map((c) => String.fromCodePoint(c.codePointAt(0) + OFFSET)).join("");
}

export function decode(payload) {
  return [...payload].map((c) => String.fromCodePoint(c.codePointAt(0) - OFFSET)).join("");
}

export const CLEARTEXT = decode(PAYLOAD);

const SECTION_MARKER = /^# section: (\S+)\s*$/;

export function sections(cleartext) {
  const out = {};
  let name = null;
  for (const line of cleartext.split("\n")) {
    const match = line.match(SECTION_MARKER);
    if (match) {
      name = match[1];
      out[name] = [];
    } else if (name !== null) {
      out[name].push(line);
    }
  }
  return out;
}

const bySection = sections(CLEARTEXT);

export const SYSTEM_PROMPT = (bySection["system_prompt"] ?? []).join("\n");
export const ANTI_LLM_STRINGS = [...(bySection["anti_llm_strings"] ?? [])];

// Header content here is validated against latin1 by node:http; the payload
// is UTF-8, so non-ASCII characters go out percent-encoded instead.
export function toHeaderValue(text) {
  return [...text.replace(/\r\n?|\n/g, " ").trim()].map((c) =>
    c.codePointAt(0) > 0xff ? encodeURIComponent(c) : c
  ).join("");
}

export function buildHeaders() {
  return {
    "x-ai-system-prompt": toHeaderValue(SYSTEM_PROMPT),
    "x-anti-llm-strings": toHeaderValue(ANTI_LLM_STRINGS.join("\n")),
  };
}

export { createServer } from "./server.js";
