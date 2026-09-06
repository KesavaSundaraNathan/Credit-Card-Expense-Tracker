const fs = require("fs");
const path = require("path");

const root = __dirname;
const buildDir = path.join(root, "build");

if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir, { recursive: true });

fs.cpSync(path.join(root, "public"), buildDir, { recursive: true });
fs.cpSync(path.join(root, "src"), path.join(buildDir, "src"), { recursive: true });
fs.copyFileSync(path.join(root, "service-worker.js"), path.join(buildDir, "service-worker.js"));

console.log("Build complete -> ./build");
