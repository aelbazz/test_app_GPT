const http = require("http");
const fs = require("fs");
const path = require("path");

const uploadDenyExtensions = ["php"];
const uploadAllowExtensions = ["ico", "jpg", "jpeg", "png", "gif", "webp"];

function showError(response, error) {
  response.writeHead(500, { "Content-Type": "text/plain" });
  response.end(error);
}

function sanitizeFileName(file) {
  file = file
    .replace(/\?.*$/, "")
    .replace(/\.{2,}/g, "")
    .replace(/[^\/\\a-zA-Z0-9\-\._]/g, "");
  return file;
}

const UPLOAD_FOLDER = __dirname + "/";
let UPLOAD_PATH = "/";
if (typeof process.env.mediaPath !== "undefined") {
  UPLOAD_PATH = sanitizeFileName(process.env.mediaPath) + "/";
}

const server = http.createServer((request, response) => {
  if (request.method === "POST") {
    const { file } = request.files;
    const fileName = file.name;
    const extension = path.extname(fileName).toLowerCase().slice(1);

    // Check if extension is on deny list
    if (uploadDenyExtensions.includes(extension)) {
      showError(response, `File type ${extension} not allowed!`);
      return;
    }

    /*
    // Uncomment this code to change to a more restrictive allowed list
    // Check if extension is on allow list
    if (!uploadAllowExtensions.includes(extension)) {
      showError(response, `File type ${extension} not allowed!`);
      return;
    }
    */

    const destination = path.join(UPLOAD_FOLDER, UPLOAD_PATH, fileName);
    file.mv(destination, (error) => {
      if (error) {
        showError(response, error);
        return;
      }

      if (typeof process.env.onlyFilename !== "undefined") {
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end(fileName);
      } else {
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end(path.join(UPLOAD_PATH, fileName));
      }
    });
  }
});

const port = 3000; // Set the desired port number
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
