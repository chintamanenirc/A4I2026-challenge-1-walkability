import fs from "fs";
import path from "path";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

const rootDir = process.cwd();

async function buildTailwind() {
  const inputCss = `@import "tailwindcss";`;
  const compiler = await compile(inputCss, {
    base: rootDir,
    onDependency: () => {},
  });

  const scanner = new Scanner({
    sources: [
      { base: path.join(rootDir, "app"), pattern: "**/*", negated: false },
      { base: path.join(rootDir, "components"), pattern: "**/*", negated: false },
    ],
  });

  const candidates = scanner.scan();
  const compiledCss = compiler.build(candidates);
  const outPath = path.join(rootDir, "app", "tailwind.generated.css");
  fs.writeFileSync(outPath, compiledCss, "utf8");
  console.log(
    `[build-tailwind] Scanned ${candidates.length} candidates -> wrote ${compiledCss.length} bytes to app/tailwind.generated.css`
  );
}

buildTailwind().catch((err) => {
  console.error("[build-tailwind] Error:", err);
  process.exit(1);
});
