--[[
  RDOC Pandoc Lua filter / helper

  Recommended (two-step → full polyglot):
    pandoc INPUT -t gfm -L pandoc/rdoc.lua -o intermediate.md
    node dist/cli.js build intermediate.md -o out.rdoc.html

  HTML preview only (NOT a complete .rdoc — no CSP, manifest, hash, reader chrome):
    pandoc INPUT -t html5 -L pandoc/rdoc.lua -o out.rdoc.html
    Prefer: pipe the Markdown intermediate through `rdoc build` instead.

  Shared helpers are also used by pandoc/rdoc-writer.lua.
]]

local M = {}

--- Detect whether the current Pandoc output FORMAT is HTML-like.
function M.is_html_format(fmt)
  fmt = tostring(fmt or FORMAT or "")
  return fmt:match("html") ~= nil
end

--- Human-readable note embedded in intermediate HTML.
M.INTERMEDIATE_COMMENT = [[<!--
  RDOC intermediate HTML from pandoc/rdoc.lua.
  This is NOT a complete .rdoc polyglot.
  Full RDOC (CSP, manifest, contentHash, reader chrome) requires:
    pandoc <input> -t gfm -L pandoc/rdoc.lua -o intermediate.md
    node dist/cli.js build intermediate.md -o out.rdoc.html
  Or use: pandoc/pandoc-rdoc.sh | pandoc/pandoc-rdoc.ps1
-->]]

--- Ensure Meta has a usable title string for downstream tools.
function M.ensure_title(meta)
  if meta.title then
    return meta
  end
  -- Prefer first-level heading later; leave a placeholder for HTML <title>.
  meta.title = pandoc.MetaInlines({ pandoc.Str("Untitled") })
  return meta
end

--- Wrap document blocks in <article id="rdoc-content"> for HTML writers.
--- Does not invent CSP / manifest / hash — those belong to `rdoc build`.
function M.wrap_article(doc)
  local open = pandoc.RawBlock(
    "html",
    M.INTERMEDIATE_COMMENT .. '\n<article id="rdoc-content">'
  )
  local close = pandoc.RawBlock("html", "</article>")
  local blocks = { open }
  for i = 1, #doc.blocks do
    blocks[#blocks + 1] = doc.blocks[i]
  end
  blocks[#blocks + 1] = close
  doc.blocks = blocks
  return doc
end

--- Strip elements that cannot survive offline RDOC packaging.
--- External images remain; `rdoc build` will reject http(s) sources.
function M.strip_unsupported(el)
  -- Drop raw <script> / iframe fragments early when present as RawBlock.
  if el.t == "RawBlock" and (el.format == "html" or el.format == "html5") then
    local t = el.text:lower()
    if t:match("<script") or t:match("<iframe") then
      return {}
    end
  end
  return nil
end

-- ── Filter entry points (pandoc -L pandoc/rdoc.lua) ─────────────────────────
-- Returned table IS the filter; also used by rdoc-writer.lua via dofile().

function M.Meta(meta)
  return M.ensure_title(meta)
end

function M.RawBlock(el)
  return M.strip_unsupported(el)
end

function M.Pandoc(doc)
  if M.is_html_format(FORMAT) then
    return M.wrap_article(doc)
  end
  -- Markdown / GFM / other: leave AST alone so `rdoc build` can compile it.
  return doc
end

return M
