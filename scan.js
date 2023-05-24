const http = require("http");
const fs = require("fs");
const path = require("path");

const UPLOAD_PATH = process.env.mediaPath || "media";
const scandir = path.join(__dirname, UPLOAD_PATH);

// Run the recursive function
// This function scans the files folder recursively, and builds a large array
const scan = (dir) => {
  const files = [];

  // Check if the folder/file actually exists
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((f) => {
      if (!f || f[0] === ".") {
        return; // Ignore hidden files
      }

      const filePath = path.join(dir, f);
      const stat = fs.statSync(filePath);
      const isDirectory = stat.isDirectory();

      if (isDirectory) {
        // The path is a folder
        const subFolder = {
          name: f,
          type: "folder",
          path: path.join(dir, f).replace(scandir, ""),
          items: scan(filePath), // Recursively get the contents of the folder
        };
        files.push(subFolder);
      } else {
        // It is a file
        const file = {
          name: f,
          type: "file",
          path: path.join(dir, f).replace(scandir, ""),
          size: stat.size, // Gets the size of this file
        };
        files.push(file);
      }
    });
  }

  return files;
};

const server = http.createServer((request, response) => {
  // Set the response header for JSON content
  response.setHeader("Content-Type", "application/json");

  // Generate the directory listing as JSON
  const dirListing = {
    name: "",
    type: "folder",
    path: "",
    items: scan(scandir),
  };

  // Send the JSON response
  response.end(JSON.stringify(dirListing));
});

const port = 3000; // Set the desired port number
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
