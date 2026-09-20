# Annotations

Brief guide to optional RDOC highlights. Normative rules: [RFC 0001 §17](./rfc-0001-rdoc.md#17-sidecar-and-embedded-annotations).

## Carriage

| Form | How |
| --- | --- |
| Sidecar | `{basename}.rdoc.ann.json` beside the `.rdoc` / `.rdoc.html` file |
| Embedded | `<script type="application/rdoc-annotations+json" id="rdoc-annotations">…</script>` |

If both exist, the embedded script takes precedence. Annotations do **not** affect `contentHash`.

## Minimal shape

```json
{
  "version": "1.0.0",
  "documentHash": "<optional contentHash>",
  "highlights": [
    {
      "id": "hl-1",
      "startPath": "optional",
      "startOffset": 0,
      "endOffset": 12,
      "text": "optional",
      "color": "optional",
      "created": "optional ISO-8601"
    }
  ]
}
```

Readers MUST ignore unknown fields. Full example: [examples/annotations.example.json](./examples/annotations.example.json).

## Related

- Format history: [CHANGELOG-FORMAT.md](./CHANGELOG-FORMAT.md) (1.1.0)
- Book collections: [book-profile.md](./book-profile.md)
