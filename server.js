import http from "node:http";
import { buildHeaders, CLEARTEXT } from "./index.js";

// Every response carries the payload headers, 200 or 404 alike.
export function createServer() {
  const headers = buildHeaders();
  return http.createServer((req, res) => {
    res.setHeader("cache-control", "no-store");
    for (const [name, value] of Object.entries(headers)) {
      res.setHeader(name, value);
    }
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      res.end(CLEARTEXT);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
}
