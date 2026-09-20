# rdoc

**Самодостаточные · Адаптивные · Офлайн · В браузере**

[English README](README.md) · [Live Demo](https://dokaiimob.github.io/rdoc/) · [RFC 0001](docs/rfc-0001-rdoc.md) · [Политика языков](docs/README-POLICY.md)

> Канонический обзор проекта — на английском в [`README.md`](README.md). Этот файл — перевод для русскоязычных читателей.

---

## Зачем `.rdoc`?

PDF заточен под **бумагу A4**. На телефоне приходится щипать и панорамировать.  
Веб-страницы перетекают — пока не отвалится CDN, не пропадёт шрифт или не проснутся трекеры.

**`.rdoc`** — самодостаточный UTF-8 **HTML-полиглот**:

| | PDF | Веб-страница | **`.rdoc`** |
| --- | :---: | :---: | :---: |
| Один файл офлайн | ✅ | ❌ часто | **✅** |
| Перетекание на мобильных | ❌ | ✅ | **✅** |
| Без CDN / веб-шрифтов / трекеров | ✅ | ❌ часто | **✅** |
| Открывается в любом браузере | ❌ нужен reader | ✅ | **✅** |
| Целостность контента (SHA-256) | опционально | ❌ | **✅** |

> Сегодня удобнее отдавать `.rdoc.html` — без трения. Ассоциацию голого `.rdoc` можно добавить позже.

---

## Быстрый старт

```bash
git clone https://github.com/DokaiiMob/rdoc.git
cd rdoc
npm install
npm run build

node dist/cli.js init demo
node dist/cli.js build sample.md -o my_article.rdoc.html
node dist/cli.js inspect my_article.rdoc.html
node dist/cli.js serve my_article.rdoc.html
```

Откройте `my_article.rdoc.html` в браузере — или перешлите файл на телефон.

### Требования

- [Node.js](https://nodejs.org/) **18+**
- npm (идёт вместе с Node)

### Сборка

```bash
npm run build          # CLI → dist/
npm run build:site     # playground для GitHub Pages → docs/
npm run build:obsidian # плагин Obsidian → plugins/obsidian-rdoc/main.js
```

### Глобальная команда (опционально)

```bash
npm link
rdoc --help
```

Bun: см. [docs/BUN-DENO.md](docs/BUN-DENO.md).

---

## CLI

| Команда | Назначение |
| --- | --- |
| `rdoc build <in.md> -o <out>` | Markdown → `.rdoc` / `.rdoc.html`, локальные картинки в `data:` |
| `rdoc inspect <file>` | Манифест, размер, SHA-256, время чтения |
| `rdoc validate <file>` | Проверка документа (строгие коды выхода для CI; в roadmap) |
| `rdoc serve <file> [-p port]` | Локальный HTTP preview |
| `rdoc open <file>` | Открыть в браузере (голый `.rdoc` → временный `.html`) |
| `rdoc associate [--undo]` | Зарегистрировать / снять ассоциацию в ОС |
| `rdoc init demo` | Записать богатый фикстурный `sample.md` |

### Флаги `build`

```bash
node dist/cli.js build article.md -o article.rdoc.html \
  --title "Заголовок" \
  --author "Имя" \
  --lang ru \
  --description "Краткое описание"
```

| Флаг | Описание |
| --- | --- |
| `-o, --output` | Выходной файл (по умолчанию `output.rdoc.html`) |
| `-t, --title` | Заголовок документа |
| `-a, --author` | Автор |
| `-l, --lang` | Язык (BCP 47) |
| `-d, --description` | Краткое описание |
| `-w, --watch` | Пересборка при изменениях (планируется) |

---

## Возможности reader

- Удобная мера строки (~**65–75** символов)
- Системный стек шрифтов (без Google Fonts)
- Тема: светлая / тёмная / системная
- Сворачиваемое **оглавление** (bottom sheet на мобильных, сайдбар на десктопе)
- Полоса **прогресса** чтения
- Размер шрифта **A− / A+**
- **Поповеры** сносок
- **Печать → PDF** через `window.print()` без chrome UI

---

## Целостность и безопасность

По [RFC 0001](docs/rfc-0001-rdoc.md):

- `contentHash` = SHA-256 после **Unicode NFC** и нормализации переносов в **LF**
- Жёсткий **CSP** в каждом файле
- Компилятор вырезает `<script>` / `<iframe>` / inline-обработчики из HTML статьи

---

## Плагин Obsidian

```bash
npm run build:obsidian
# скопируйте main.js + manifest.json → {Vault}/.obsidian/plugins/rdoc-export/
```

Command Palette → **Export current note to .rdoc**

Подробнее: [`plugins/obsidian-rdoc/`](plugins/obsidian-rdoc/)

---

## Ассоциация в ОС

```bash
node dist/cli.js associate
node dist/cli.js open my_article.rdoc
```

В мессенджерах и AirDrop предпочтительнее **`.rdoc.html`**.

---

## Участие

- [ROADMAP.md](ROADMAP.md) и good first issues
- Формат должен оставаться **offline-first** и открываться в браузере
- Хеширование, CSP и структура — по [RFC 0001](docs/rfc-0001-rdoc.md)

```bash
npm run build && node dist/cli.js inspect path/to/file.rdoc.html
```

---

## Лицензия

[MIT](LICENSE)

**Хватит зумить. Начните читать.**
