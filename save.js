const http = require("http");
const fs = require("fs");
const path = require("path");

const MAX_FILE_LIMIT = 1024 * 1024 * 2; // 2 Megabytes max html file size

function sanitizeFileName(file, allowedExtension = "html") {
  // Sanitize, remove double dot .. and remove query parameters if any
  file = path.join(
    __dirname,
    "/",
    file
      .replace(/\?.*$/, "")
      .replace(/\.{2,}/g, "")
      .replace(/[^\/\\a-zA-Z0-9\-\._]/g, "")
  );

  // Allow only .html extension
  if (allowedExtension) {
    file = file.replace(/\..+$/, "") + `.${allowedExtension}`;
  }

  return file;
}

function showError(error) {
  console.error(error);
}

const server = http.createServer((request, response) => {
  const { method, url } = request;

  if (method === "POST") {
    let html = "";
    let file = "";
    let action = "";

    request.on("data", (chunk) => {
      html += chunk;
      // Limit html content to MAX_FILE_LIMIT
      if (html.length > MAX_FILE_LIMIT) {
        request.connection.destroy();
      }
    });

    request.on("end", () => {
      if (
        request.headers["content-type"] === "application/x-www-form-urlencoded"
      ) {
        const postData = new URLSearchParams(html);
        if (
          postData.has("startTemplateUrl") &&
          postData.get("startTemplateUrl")
        ) {
          const startTemplateUrl = sanitizeFileName(
            postData.get("startTemplateUrl")
          );
          html = fs.readFileSync(startTemplateUrl, "utf-8");
        } else if (postData.has("html")) {
          html = postData.get("html").substring(0, MAX_FILE_LIMIT);
        }

        if (postData.has("file")) {
          file = sanitizeFileName(postData.get("file"), false);
        }
      }

      if (url.startsWith("/?action=")) {
        action = url.substring(url.indexOf("=") + 1);
      }

      if (action) {
        // File manager actions: delete and rename
        switch (action) {
          case "rename": {
            const newfile = sanitizeFileName(request.headers["newfile"], false);
            if (file && newfile) {
              fs.rename(file, newfile, (error) => {
                if (error) {
                  showError(`Error renaming file '${file}' to '${newfile}'`);
                } else {
                  response.end(`File '${file}' renamed to '${newfile}'`);
                }
              });
            }
            break;
          }
          case "delete":
            if (file) {
              fs.unlink(file, (error) => {
                if (error) {
                  showError(`Error deleting file '${file}'`);
                } else {
                  response.end(`File '${file}' deleted`);
                }
              });
            }
            break;
          default:
            showError(`Invalid action '${action}'!`);
            break;
        }
      } else {
        // Save page
        if (html) {
          if (file) {
            const dir = path.dirname(file);
            fs.mkdir(dir, { recursive: true }, (error) => {
              if (error && error.code !== "EEXIST") {
                showError(`Error creating folder '${dir}'`);
              } else {
                fs.writeFile(file, html, "utf-8", (error) => {
                  if (error) {
                    showError(
                      `Error saving file '${file}'\nPossible causes are missing write permission or incorrect file path!`
                    );
                  } else {
                    response.end(`File saved '${file}'`);
                  }
                });
              }
            });
          } else {
            showError("Filename is empty!");
          }
        } else {
          showError("Html content is empty!");
        }
      }
    });
  } else {
    showError(`Unsupported method: ${method}`);
  }
});

const port = 3000; // Set the desired port number
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
