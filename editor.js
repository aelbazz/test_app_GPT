const fs = require("fs");
const path = require("path");

// Read the contents of editor.html
const html = fs.readFileSync("editor.html", "utf8");

// Search for HTML files in demo and my-pages folders
const htmlFiles = [
  ...glob.sync("my-pages/*.html"),
  ...glob.sync("demo/**/*.html"),
  ...glob.sync("demo/*.html"),
];

let files = "";
htmlFiles.forEach((file) => {
  if (
    ["new-page-blank-template.html", "editor.html"].includes(
      path.basename(file)
    )
  ) {
    return; // Skip template files
  }

  const pathInfo = path.parse(file);
  const filename = pathInfo.name;
  const folder = path.dirname(file).replace(/.*\//, "");
  const subfolder = path.dirname(file).replace(/^.*\//, "");
  const name = filename === "index" && subfolder ? subfolder : filename;
  const url = path.join(pathInfo.dir, pathInfo.base);

  files += `{ name: '${name}', file: '${file}', title: '${name}', url: '${url}', folder: '${folder}' },`;
});

// Replace files list in html with the dynamic list from the demo folder
const replacedHtml = html.replace("(pages);", `[${files}]`);

console.log(replacedHtml);
