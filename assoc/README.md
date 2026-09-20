# OS association for `.rdoc`

Media type: `application/vnd.rdoc+html` (see [RFC 0001](../docs/rfc-0001-rdoc.md)).

## Recommended: CLI

After `npm run build` (and optionally `npm link`):

```bash
# register
node dist/cli.js associate

# open a file
node dist/cli.js open my_article.rdoc

# unregister
node dist/cli.js associate --undo
```

`rdoc open` copies a bare `.rdoc` to a temporary `*.rdoc.html` so browsers apply HTML semantics, then launches the system opener.

## Manual helpers

| Platform | Files |
| --- | --- |
| Windows | `windows/register.ps1`, `windows/unregister.ps1` |
| Linux | `linux/rdoc-mime.xml`, `linux/install.sh` |
| macOS | `macos/register.sh` |

On Windows the association is written to **HKCU** (no admin). The open command points at the Node binary + `dist/cli.js open "%1"`.
