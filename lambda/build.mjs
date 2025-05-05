import { build } from "esbuild";
import { rmSync } from "fs";

rmSync("dist", { recursive: true, force: true });

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  outfile: "../dist/index.js",
  format: "cjs",
  sourcemap: true,
  minify: true,
  treeShaking: true
}).catch(() => process.exit(1));
