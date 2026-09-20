#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { associate, openRdoc } from "./associate.js";
import { buildRdoc } from "./compiler.js";
import { DEMO_MARKDOWN } from "./demo.js";
import { inspectRdoc } from "./validator.js";
import { RDOC_VERSION } from "./types.js";

const program = new Command();

program
  .name("rdoc")
  .description("CLI для формата .rdoc — адаптивных офлайн-документов")
  .version(RDOC_VERSION);

program
  .command("build")
  .description("Собрать Markdown в самодостаточный .rdoc / .rdoc.html")
  .argument("<input>", "Входной Markdown (.md)")
  .option("-o, --output <file>", "Выходной файл", "output.rdoc.html")
  .option("-t, --title <title>", "Заголовок документа")
  .option("-a, --author <author>", "Автор")
  .option("-l, --lang <lang>", "Язык (BCP 47)", "ru")
  .option("-d, --description <text>", "Краткое описание")
  .action(async (input: string, opts) => {
    try {
      const result = await buildRdoc({
        inputPath: input,
        outputPath: opts.output,
        title: opts.title,
        author: opts.author,
        lang: opts.lang,
        description: opts.description,
      });
      const kb = (result.bytes / 1024).toFixed(1);
      console.log(`✓ Собран: ${result.outputPath} (${kb} КБ)`);
      console.log(`  title:  ${result.manifest.title}`);
      console.log(`  hash:   ${result.manifest.contentHash}`);
      console.log(
        `  words:  ${result.manifest.wordCount} (~${result.manifest.readingMinutes} мин)`,
      );
    } catch (err) {
      console.error("Ошибка сборки:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("inspect")
  .description("Показать манифест, размер, хеш и время чтения")
  .argument("<file>", "Файл .rdoc / .rdoc.html")
  .action(async (file: string) => {
    try {
      const info = await inspectRdoc(file);
      const m = info.manifest;
      console.log(`Файл:           ${info.path}`);
      console.log(`Размер:         ${(info.fileSize / 1024).toFixed(1)} КБ (${info.fileSize} байт)`);
      console.log(`Формат:         ${m.format} v${m.version}`);
      console.log(`Заголовок:      ${m.title}`);
      console.log(`Автор:          ${m.author}`);
      console.log(`Создан:         ${m.created}`);
      console.log(`Язык:           ${m.lang}`);
      console.log(`Слов:           ${m.wordCount}`);
      console.log(`Чтение:         ~${m.readingMinutes} мин`);
      console.log(`SHA-256:        ${m.contentHash}`);
      console.log(`Хеш валиден:    ${info.hashValid ? "да ✓" : "НЕТ ✗"}`);
      if (m.description) console.log(`Описание:       ${m.description}`);
      if (!info.hashValid) process.exitCode = 2;
    } catch (err) {
      console.error("Ошибка inspect:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("serve")
  .description("Локальный preview .rdoc в браузере")
  .argument("<file>", "Файл .rdoc / .rdoc.html")
  .option("-p, --port <port>", "Порт", "4173")
  .action(async (file: string, opts) => {
    try {
      const abs = path.resolve(file);
      await access(abs);
      const port = Number(opts.port) || 4173;
      const html = await readFile(abs);

      const server = createServer((req, res) => {
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": html.byteLength,
          "Cache-Control": "no-store",
        });
        res.end(html);
      });

      server.listen(port, () => {
        console.log(`Preview: http://127.0.0.1:${port}`);
        console.log(`Файл:    ${abs}`);
        console.log("Ctrl+C — остановить");
      });
    } catch (err) {
      console.error("Ошибка serve:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("init")
  .description("Инициализация демо или заготовки")
  .argument("<what>", "Что создать: demo")
  .option("-o, --output <file>", "Путь к sample.md", "sample.md")
  .action(async (what: string, opts) => {
    if (what !== "demo") {
      console.error('Поддерживается только: rdoc init demo');
      process.exitCode = 1;
      return;
    }
    try {
      const out = path.resolve(opts.output);
      try {
        await access(out);
        console.error(`Файл уже существует: ${out}`);
        process.exitCode = 1;
        return;
      } catch {
        // ok — file does not exist
      }
      await writeFile(out, DEMO_MARKDOWN, "utf8");
      console.log(`✓ Создан демо-документ: ${out}`);
      console.log(`  Дальше: node dist/cli.js build ${path.basename(out)} -o my_article.rdoc.html`);
    } catch (err) {
      console.error("Ошибка init:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("open")
  .description("Открыть .rdoc в браузере (через временный .html при необходимости)")
  .argument("<file>", "Файл .rdoc / .rdoc.html")
  .action(async (file: string) => {
    try {
      await openRdoc(file);
      console.log(`✓ Открыто: ${path.resolve(file)}`);
    } catch (err) {
      console.error("Ошибка open:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("associate")
  .description("Зарегистрировать (или снять) ассоциацию расширения .rdoc в ОС")
  .option("--undo", "Удалить ассоциацию")
  .action(async (opts) => {
    try {
      const result = await associate({ undo: Boolean(opts.undo) });
      console.log(`✓ ${result.message}`);
    } catch (err) {
      console.error(
        "Ошибка associate:",
        err instanceof Error ? err.message : err,
      );
      process.exitCode = 1;
    }
  });

program.parse();
