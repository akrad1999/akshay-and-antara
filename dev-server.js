const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const root = __dirname;
const port = Number(process.env.PORT) || 4174;
const handler = require("./api/rsvp.js");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ics": "text/calendar; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function loadEnvironment() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line) => {
      const separator = line.indexOf("=");
      if (separator < 1) return;
      const key = line.slice(0, separator).trim();
      const value = line
        .slice(separator + 1)
        .trim()
        .replace(/^(['"])(.*)\1$/, "$2");
      if (!process.env[key]) process.env[key] = value;
    });
}

function createApiResponse(response) {
  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.json = (body) => {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify(body));
  };
  return response;
}

async function parseJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_000) throw new Error("Request is too large.");
    chunks.push(chunk);
  }

  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function serveFile(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const requestedPath = decodedPath.endsWith("/") ? `${decodedPath}index.html` : decodedPath;
  const filePath = path.resolve(root, `.${requestedPath}`);

  if (!filePath.startsWith(`${root}${path.sep}`) || filePath.includes(`${path.sep}.env`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }

    response.setHeader("Content-Type", mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    response.setHeader("Cache-Control", "no-store");
    fs.createReadStream(filePath).pipe(response);
  });
}

loadEnvironment();

const server = http.createServer(async (request, response) => {
  if (request.url === "/api/rsvp") {
    try {
      request.body = await parseJson(request);
      await handler(request, createApiResponse(response));
    } catch (error) {
      console.error(error);
      createApiResponse(response).status(400).json({ error: "Invalid RSVP submission." });
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405).end("Method not allowed");
    return;
  }

  serveFile(request, response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Wedding website running at http://127.0.0.1:${port}`);
});
