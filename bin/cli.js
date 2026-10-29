#!/usr/bin/env node
import process from "node:process";
import { CLEARTEXT, buildHeaders, createServer } from "../index.js";

const [command, ...rest] = process.argv.slice(2);

if (command === "print") {
  process.stdout.write(CLEARTEXT + "\n");
} else if (command === "header") {
  for (const [name, value] of Object.entries(buildHeaders())) {
    console.log(`${name}: ${value}`);
  }
} else if (command === "server") {
  const portFlag = rest.indexOf("--port");
  const port = portFlag === -1 ? 8765 : Number(rest[portFlag + 1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("usage: text-metrics server [--port N]");
    process.exit(2);
  }
  const server = createServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`listening on http://127.0.0.1:${port}`);
  });
} else {
  console.error("usage: text-metrics <print | header | server [--port N]>");
  process.exit(2);
}
