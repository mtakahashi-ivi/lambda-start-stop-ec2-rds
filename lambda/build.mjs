import { build } from "esbuild";
import { rmSync } from "fs";

rmSync("dist", { recursive: true, force: true });

const isTestLocal = process.env.BUILD_TEST_LOCAL === "1";
const entryPoints = isTestLocal
  ? ["src/index.ts", "src/testLocal.ts"]
  : ["src/index.ts"];

build({
  entryPoints,
  bundle: true,
  platform: "node",
  target: "node22",
  outdir: "../dist",
  format: "cjs",
  sourcemap: true,
  minify: false,
  treeShaking: true,
  external: ['aws-sdk'], // Lambda環境に組み込み済み
}).catch(() => process.exit(1));
