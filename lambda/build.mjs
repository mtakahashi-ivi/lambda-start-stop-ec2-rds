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
  minify: false,
  treeShaking: true,
  external: ['aws-sdk'], // Lambda環境に組み込み済み
}).catch(() => process.exit(1));
