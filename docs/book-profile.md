# Book profile

Brief guide to multi-article RDOC collections. Normative rules: [RFC 0001 §18](./rfc-0001-rdoc.md#18-multi-article--book-profile).

## Spine file

Ship a JSON catalog named `*.rdoc.book.json`:

```json
{
  "format": "rdoc-book",
  "version": "1.0.0",
  "title": "Collection title",
  "parts": [
    { "href": "01-intro.rdoc.html", "title": "Introduction" }
  ]
}
```

Each `href` points to a normal `.rdoc` or `.rdoc.html` part with its own manifest and `contentHash`. Readers MUST ignore unknown spine fields.

Example: [examples/book.spine.example.json](./examples/book.spine.example.json).

## Part profiles

A part may set optional manifest `profile` to `"article"` (default), `"slides"`, `"contract"`, or `"paper"`. Readers MAY adapt chrome; they MUST still render `<article id="rdoc-content">`.

## Related

- Manifest fields: [RFC 0001 §6](./rfc-0001-rdoc.md#6-manifest)
- Annotations: [annotations.md](./annotations.md)
- Format history: [CHANGELOG-FORMAT.md](./CHANGELOG-FORMAT.md) (1.1.0)
