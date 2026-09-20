# Bun and Deno

`rdoc` targets **Node.js 18+**. Bun and Deno can run parts of the toolchain, but support is **best-effort**, not primary.

## Bun

Bun implements a large subset of Node’s module API and can run the published CLI after a normal TypeScript build.

### Build (same as Node)

```bash
npm install
npm run build
```

Or with Bun’s package manager:

```bash
bun install
bun run build
```

`bun run build` executes the `build` script from `package.json` (`tsc` + asset copy). Prefer this over inventing a separate Bun pipeline.

### Run the CLI

```bash
# Via npm script (uses node on dist/cli.js by default)
npm run rdoc -- --help

# Bun executing the compiled CLI
bun dist/cli.js --help
bun dist/cli.js build sample.md -o out.rdoc.html
bun dist/cli.js inspect out.rdoc.html
bun dist/cli.js serve out.rdoc.html
```

You can also use:

```bash
bun run rdoc -- build sample.md -o out.rdoc.html
```

(`bun run <script>` runs the package script; pass CLI args after `--`.)

### Compatibility status (Bun)

| Area | Status |
| --- | --- |
| `build` / `inspect` / `init` | Expected to work (fs + crypto) |
| `serve` | Expected to work (`node:http`) |
| `open` / `associate` | Likely works; depends on `child_process` + OS helpers |
| Global `rdoc` bin | Use `npm link` / npm install; Bun’s bin shim is optional |

If something fails under Bun, reproduce with `node dist/cli.js …` before filing a Bun-specific issue.

## Deno

Deno can import npm packages and has improving Node compatibility, but this repo is **not** Deno-first.

### Node APIs used by the CLI

| Module | Usage |
| --- | --- |
| `node:fs` / `node:fs/promises` | Read/write Markdown and `.rdoc` files; copy assets; association helpers |
| `node:crypto` | SHA-256 content hash (`contentHash`) |
| `node:http` | `rdoc serve` local preview server |
| `node:child_process` | `rdoc open` / `rdoc associate` (spawn browser / OS register tools) |
| `node:path`, `node:os`, `node:url`, `node:util` | Path resolution, platform detection, `fileURLToPath`, promisify |

### Compatibility status (Deno)

| Area | Status |
| --- | --- |
| Compiling TypeScript with Deno instead of `tsc` | Not supported / not documented |
| Running `dist/cli.js` under Deno with Node compat | Experimental; may need `--compat` / npm specifier flags that change over time |
| `serve` (`node:http`) | Often works under Deno’s Node compat layer |
| `associate` / `open` (`child_process`) | Fragile; OS-specific |
| Hashing (`node:crypto`) | Usually fine under compat |

**Recommendation:** treat Deno as unsupported for releases. Use Node or Bun for builds and packaging. Contributions that add a maintained `deno.json` task are welcome once CI covers them.

## Summary

| Runtime | Build | CLI run | Official support |
| --- | --- | --- | --- |
| Node.js ≥ 18 | ✅ `npm run build` | ✅ `node dist/cli.js` | **Yes** |
| Bun | ✅ `bun run build` | ✅ `bun dist/cli.js` | Best-effort |
| Deno | ❌ not documented | ⚠️ experimental | No |
