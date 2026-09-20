#!/usr/bin/env node
/**
 * Fast fuzz / malicious-HTML vectors for sanitizeArticleHtml.
 * Intended for CI (`npm run test:fuzz`) — keep runtime under a few seconds.
 */
import { sanitizeArticleHtml } from "../../dist/normalize.js";

/** @type {string[]} */
const FIXED_VECTORS = [
  `<script>alert(1)</script><p>ok</p>`,
  `<SCRIPT SRC=x></SCRIPT>`,
  `<p onclick="alert(1)">x</p>`,
  `<img src=x onerror=alert(1)>`,
  `<iframe src="https://evil.test"></iframe>`,
  `<object data="https://evil.test"></object>`,
  `<embed src="https://evil.test">`,
  `<svg><script>alert(1)</script></svg>`,
  `<a href="javascript:alert(1)">x</a>`,
  `<div onmouseover='alert(1)'>x</div>`,
  `<p ONCLICK=alert(1)>x</p>`,
  `<!-- <script>alert(1)</script> --><p>x</p>`,
  `<img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' onload='alert(1)'/>">`,
  `<math><mi>x</mi></math><script>evil()</script>`,
  `<p style="background:url(https://evil.test/x)">x</p>`,
];

const TAGS = ["script", "iframe", "object", "embed", "div", "p", "img", "svg", "a"];
const EVENTS = ["onclick", "onerror", "onload", "onmouseover", "ONFOCUS"];

function randomMalicious(seed) {
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const tag = TAGS[(rnd() * TAGS.length) | 0];
  const ev = EVENTS[(rnd() * EVENTS.length) | 0];
  const payloads = [
    `<${tag}>alert(${seed})</${tag}>`,
    `<p ${ev}="alert(${seed})">t</p>`,
    `<iframe src="https://x/${seed}"></iframe><p>t</p>`,
    `<embed src=x><script>x${seed}</script>`,
    `<object data=x></object><div ${ev}='x'>z</div>`,
  ];
  return payloads[(rnd() * payloads.length) | 0];
}

function assertClean(label, input) {
  const out = sanitizeArticleHtml(input);
  const lower = out.toLowerCase();
  if (/<script\b/.test(lower)) {
    throw new Error(`${label}: script tag survived\nIN: ${input}\nOUT: ${out}`);
  }
  if (/<\/script>/.test(lower)) {
    throw new Error(`${label}: closing script survived\nIN: ${input}\nOUT: ${out}`);
  }
  if (/<iframe\b/.test(lower)) {
    throw new Error(`${label}: iframe survived\nIN: ${input}\nOUT: ${out}`);
  }
  if (/<object\b/.test(lower)) {
    throw new Error(`${label}: object survived\nIN: ${input}\nOUT: ${out}`);
  }
  if (/<embed\b/.test(lower)) {
    throw new Error(`${label}: embed survived\nIN: ${input}\nOUT: ${out}`);
  }
  if (/\son[a-z]+\s*=/i.test(out)) {
    throw new Error(`${label}: inline handler survived\nIN: ${input}\nOUT: ${out}`);
  }
}

let failed = 0;
for (let i = 0; i < FIXED_VECTORS.length; i++) {
  try {
    assertClean(`fixed[${i}]`, FIXED_VECTORS[i]);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    failed++;
  }
}

const N = 200;
for (let i = 0; i < N; i++) {
  try {
    assertClean(`rand[${i}]`, randomMalicious(i + 1));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    failed++;
  }
}

if (failed) {
  console.error(`✗ sanitize fuzz: ${failed} failure(s)`);
  process.exit(1);
}
console.log(`✓ sanitize fuzz: ${FIXED_VECTORS.length} fixed + ${N} random vectors`);
