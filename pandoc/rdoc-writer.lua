--[[
  Pandoc custom writer: emit RDOC-oriented intermediate Markdown (GFM).

  Usage:
    pandoc input.tex -t pandoc/rdoc-writer.lua -o intermediate.md
    node dist/cli.js build intermediate.md -o out.rdoc.html

  Or via wrappers:
    ./pandoc/pandoc-rdoc.sh input.tex -o out.rdoc.html
    .\pandoc\pandoc-rdoc.ps1 input.tex -o out.rdoc.html

  This writer does NOT produce a complete .rdoc (no CSP, manifest, hash, chrome).
  Always finish with `rdoc build` / `node dist/cli.js build`.
]]

local this_dir = PANDOC_SCRIPT_FILE and PANDOC_SCRIPT_FILE:match("(.*[/\\])") or ""
local ok, rdoc = pcall(dofile, this_dir .. "rdoc.lua")
if not ok then
  -- Fallback when loaded by basename from another cwd
  ok, rdoc = pcall(dofile, "pandoc/rdoc.lua")
end
if not ok then
  rdoc = {
    ensure_title = function(meta) return meta end,
  }
end

--- Classic Doc() writer API (Pandoc ≤ 2.x style still widely used).
function Doc(body, metadata, variables)
  local parts = {}
  local title = variables.title or metadata.title
  if title and title ~= "" then
    parts[#parts + 1] = "# " .. tostring(title)
    parts[#parts + 1] = ""
  end
  parts[#parts + 1] = body
  return table.concat(parts, "\n")
end

-- Prefer modern Writer when available (Pandoc ≥ 3 / 2.17+).
function Writer(doc, opts)
  if rdoc.ensure_title then
    doc.meta = rdoc.ensure_title(doc.meta)
  end
  -- GFM is the closest match to what `rdoc build` (marked GFM) expects.
  opts = opts or {}
  return pandoc.write(doc, "gfm", opts)
end

function Template()
  return pandoc.template.default("gfm")
end
