# Obsidian plugin: RDOC Export

Экспорт текущей заметки в самодостаточный `.rdoc` / `.rdoc.html` (см. [RFC 0001](../../docs/rfc-0001-rdoc.md)).

## Возможности

- Команда **Export current note to .rdoc** и кнопка на ribbon
- Рендер через движок Markdown Obsidian (включая wiki-links в HTML)
- Локальные изображения из vault инлайнятся в base64
- Внешние `http(s)`-картинки отбрасываются
- Вшитые стили и микро-рантайм из `src/template/`
- Манифест + SHA-256 как в CLI-компиляторе

## Сборка

Из корня репозитория или из этой папки:

```bash
cd plugins/obsidian-rdoc
npm install
npm run build
```

Артефакты: `main.js` + `manifest.json`.

## Установка в vault

1. Скопируйте папку плагина в:
   `{Vault}/.obsidian/plugins/rdoc-export/`
2. Положите туда `main.js` и `manifest.json`.
3. Settings → Community plugins → включите **RDOC Export**  
   (при необходимости разрешите safe mode / unlisted plugins).

Быстрый копир (PowerShell, подставьте путь к vault):

```powershell
$vault = "D:\Notes\MyVault\.obsidian\plugins\rdoc-export"
New-Item -ItemType Directory -Force -Path $vault | Out-Null
Copy-Item manifest.json, main.js $vault -Force
```

## Использование

1. Откройте `.md` заметку.
2. Ribbon «Export note to .rdoc» или Command Palette → **Export current note to .rdoc**.
3. Рядом с заметкой появится `NoteName.rdoc.html` (настраивается в Settings).

## Settings

| Параметр | Описание |
| --- | --- |
| Author | Поле `author` манифеста |
| Language | BCP-47 (`ru`, `en`, …) |
| Extension | `.rdoc.html` или `.rdoc` |
| Output folder | Пусто = рядом с заметкой |

## Ограничения MVP

- Callout-синтаксис Obsidian (`> [!note]`) уходит как HTML callout Obsidian, не как `::: tip` CLI.
- Мобильный Obsidian поддерживается (`isDesktopOnly: false`), но большие вложения увеличат размер файла.
