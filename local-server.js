const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const port = Number(process.env.PORT || 5500);

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml"
};

function sendFile(response, filePath)
{
    fs.readFile(filePath, (error, data) =>
    {
        if (error)
        {
            response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            response.end("Không tìm thấy file.");
            return;
        }

        response.writeHead(200, {
            "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
        });
        response.end(data);
    });
}

const server = http.createServer((request, response) =>
{
    const urlPath = decodeURIComponent((request.url || "/").split("?")[0]);
    const safePath = path.normalize(urlPath === "/" ? "/index.html" : urlPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(rootDir, safePath);

    if (!filePath.startsWith(rootDir))
    {
        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Không được phép truy cập.");
        return;
    }

    sendFile(response, filePath);
});

server.listen(port, () =>
{
    console.log(`ScamCheck local đang chạy tại http://localhost:${port}`);
    console.log("Nhấn Ctrl+C để tắt.");
});
