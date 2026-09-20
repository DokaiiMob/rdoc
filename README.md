# rdoc — Responsive Document

Самодостаточный адаптивный офлайн-формат документов и CLI для его сборки.

`.rdoc` / `.rdoc.html` — UTF-8 HTML-полиглот: открывается **в любом браузере** двойным кликом, не требует сети, CDN и стороннего ридера. Внутри — JSON-манифест с SHA-256, семантический HTML, адаптивный CSS и микро-рантайм (< 10 КБ JS).

Спецификация: [docs/rfc-0001-rdoc.md](docs/rfc-0001-rdoc.md).

## Требования

- [Node.js](https://nodejs.org/) 18+
- npm (идёт вместе с Node.js)

## Установка

```bash
cd rdoc
npm install
npm run build
```

После сборки CLI доступен как:

```bash
node dist/cli.js --help
```

Опционально — глобальная ссылка:

```bash
npm link
rdoc --help
```

## Быстрый старт

```bash
# 1. Демо-Markdown со сложной вёрсткой
node dist/cli.js init demo

# 2. Сборка в автономный документ
node dist/cli.js build sample.md -o my_article.rdoc.html

# 3. Проверка манифеста и целостности
node dist/cli.js inspect my_article.rdoc.html

# 4. Локальный preview
node dist/cli.js serve my_article.rdoc.html

# 5. Ассоциация расширения .rdoc в ОС (открытие через браузер)
node dist/cli.js associate
node dist/cli.js open my_article.rdoc
```

Откройте `my_article.rdoc.html` в браузере или отправьте файл на телефон (Telegram / AirDrop).

## Команды CLI

| Команда | Описание |
| --- | --- |
| `rdoc build <input.md> -o <out>` | Markdown → `.rdoc` / `.rdoc.html`, инлайн локальных картинок в base64 |
| `rdoc inspect <file>` | Метаданные, размер, SHA-256, время чтения |
| `rdoc serve <file> [-p port]` | Локальный HTTP-preview |
| `rdoc open <file>` | Открыть в браузере (`.rdoc` → временный `.html`) |
| `rdoc associate [--undo]` | Зарегистрировать / снять ассоциацию `.rdoc` в ОС |
| `rdoc init demo` | Создаёт `sample.md` с таблицами, врезками, SVG-формулой, кодом и сносками |

Опции `build`:

```bash
node dist/cli.js build article.md -o article.rdoc.html \
  --title "Заголовок" \
  --author "Имя" \
  --lang ru \
  --description "Кратко о документе"
```

## Ассоциация `.rdoc`

После `associate` двойной клик по `.rdoc` вызывает `rdoc open`, который копирует файл во временный `*.rdoc.html` и открывает системным браузером (чтобы HTML-семантика не зависела от расширения).

Подробности и ручные скрипты: [assoc/README.md](assoc/README.md).

| ОС | Что делает CLI |
| --- | --- |
| Windows | ProgID в `HKCU\Software\Classes` |
| Linux | MIME `application/vnd.rdoc+html` + `.desktop` |
| macOS | wrapper `~/.local/bin/rdoc-open` |

Для мессенджеров по-прежнему удобнее слать `.rdoc.html` — ридер не нужен.

## Плагин Obsidian

Экспорт заметки одной кнопкой: [plugins/obsidian-rdoc/](plugins/obsidian-rdoc/).

```bash
npm run build:obsidian
# скопируйте main.js + manifest.json в
# {Vault}/.obsidian/plugins/rdoc-export/
```

Command Palette → **Export current note to .rdoc**.

## Возможности ридера

- Ширина строки ≈ 65–75 символов, системные шрифты (SF / Segoe UI / Roboto / Inter)
- Светлая / тёмная тема (с учётом `prefers-color-scheme`)
- Оглавление (снизу на мобильном, сбоку на десктопе)
- Индикатор прогресса чтения
- Размер шрифта (A− / A+)
- Сноски-popover вместо прыжка вниз страницы
- Печать / «экспорт в PDF» через диалог браузера
- `@media print` без UI-хрома

## Структура проекта

```
rdoc/
├── docs/rfc-0001-rdoc.md   # спецификация формата
├── assoc/                  # MIME / registry / desktop helpers
├── plugins/obsidian-rdoc/  # плагин экспорта
├── src/
│   ├── cli.ts
│   ├── compiler.ts
│   ├── associate.ts
│   ├── validator.ts
│   ├── demo.ts
│   ├── types.ts
│   └── template/
├── scripts/copy-assets.mjs
├── package.json
└── tsconfig.json
```

## Формат файла (кратко)

1. Валидный HTML5, UTF-8  
2. Манифест в `<script type="application/rdoc+json">`  
3. Контент в `<article id="rdoc-content">`  
4. `contentHash` = SHA-256 от внутреннего HTML статьи  
5. CSS и JS вшиты inline — внешних URL нет  

Полная спецификация: [RFC 0001](docs/rfc-0001-rdoc.md).

## Markdown-расширения компилятора

- **Сноски:** `[^id]` в тексте и `[^id]: текст` в определении → popover  
- **Врезки:**

  ````markdown
  ::: tip
  Текст совета
  :::
  ````

  Виды: `tip`, `info`, `warning` (и произвольные).

- **Картинки:** только локальные пути; будут встроены как `data:` URI. Внешние `http(s)` отклоняются.

## Лицензия

MIT
