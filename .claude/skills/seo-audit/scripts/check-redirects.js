#!/usr/bin/env node
/**
 * SEO denetimi: next.config.mjs redirect analizi. SALT OKUNURDUR.
 *
 * Neden statik ayrıştırma: next.config.mjs import edilirse next-intl eklentisi dahil
 * yapılandırma kodu çalışır. Denetim hiçbir kod çalıştırmamalı, bu yüzden dosya düz
 * metin olarak okunur ve redirect nesneleri metinden çıkarılır.
 *
 * Neden yalnızca okuma API'leri: script yalnızca fs.readFileSync ve fs.readdirSync
 * kullanır. Dosya yazan, silen ya da süreç başlatan hiçbir API yoktur. Sonuç yalnızca
 * stdout'a basılır.
 *
 * Kullanım: node .claude/skills/seo-audit/scripts/check-redirects.js [--json]
 * Kodların anlamı: ../references/checks.md, E bölümü.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const CONFIG_FILE = path.join(ROOT, 'next.config.mjs');
const LOCALE_DIR = path.join(ROOT, 'src', 'app', '[locale]');
// Hedef ve kaynakları somutlaştırırken :locale yerine konan örnek değer (tek aktif locale).
const SAMPLE_LOCALE = 'tr';
const SAMPLE_PARAM = 'ornek';
const MAX_HOPS = 10;

// ---------------------------------------------------------------------------
// Ayrıştırma
// ---------------------------------------------------------------------------

// `async <fnName>() { return [ ... ] }` içindeki dizi metnini ve başlangıç ofsetini döndürür.
// String ve // yorumları içindeki köşeli parantezler sayılmaz.
function extractArray(text, fnName) {
  const start = text.indexOf(`async ${fnName}()`);
  if (start === -1) return null;
  const open = text.indexOf('[', start);
  if (open === -1) return null;
  let depth = 0;
  let inStr = null;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = c;
      continue;
    }
    if (c === '/' && text[i + 1] === '/') {
      const nl = text.indexOf('\n', i);
      i = nl === -1 ? text.length : nl;
      continue;
    }
    if (c === '[') depth++;
    else if (c === ']' && --depth === 0) return { body: text.slice(open, i + 1), offset: open };
  }
  return null;
}

function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

function stringField(obj, name) {
  const m = obj.match(new RegExp(name + '\\s*:\\s*(["\'`])((?:\\\\.|(?!\\1).)*)\\1'));
  return m ? m[2] : null;
}

function parseEntries(text, fnName) {
  const arr = extractArray(text, fnName);
  if (!arr) return { entries: [], sourceCount: 0, found: false };
  const entries = [];
  const objRe = /\{[^{}]*\}/g;
  let m;
  while ((m = objRe.exec(arr.body)) !== null) {
    const obj = m[0];
    const source = stringField(obj, 'source');
    if (source === null) continue;
    const perm = obj.match(/permanent\s*:\s*(true|false)/);
    entries.push({
      index: entries.length,
      line: lineAt(text, arr.offset + m.index),
      source,
      destination: stringField(obj, 'destination'),
      permanent: perm ? perm[1] === 'true' : null,
      conditional: /\b(has|missing)\s*:/.test(obj),
    });
  }
  const sourceCount = (arr.body.match(/\bsource\s*:/g) || []).length;
  return { entries, sourceCount, found: true };
}

// ---------------------------------------------------------------------------
// Desen eşleştirme (Next.js path-to-regexp alt kümesi: :p, :p*, :p+, :p?)
// ---------------------------------------------------------------------------

function toRegex(pattern) {
  let re = '';
  for (const part of pattern.split(/(:[A-Za-z_][A-Za-z0-9_]*[*+?]?)/)) {
    if (!part) continue;
    if (part.startsWith(':')) {
      const mod = part.slice(-1);
      if (mod === '*') re += '(.*)';
      else if (mod === '+') re += '(.+)';
      else if (mod === '?') re += '([^/]*)';
      else re += '([^/]+)';
    } else {
      re += part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp('^' + re + '/?$');
}

// Desendeki parametreleri örnek değerlerle doldurur: /:locale/psikolog/:slug -> /tr/psikolog/ornek
function concretize(pattern) {
  return pattern
    .replace(/:locale\b[*+?]?/g, SAMPLE_LOCALE)
    .replace(/:[A-Za-z_][A-Za-z0-9_]*[*+?]?/g, SAMPLE_PARAM);
}

function hasParams(pattern) {
  return /:[A-Za-z_]/.test(pattern);
}

// Tarayıcı isteği yüzde-kodlu gönderir. Hem ham hem kodlu biçim denenir.
function matchesAny(regex, concretePath) {
  if (regex.test(concretePath)) return true;
  try {
    const encoded = encodeURI(concretePath);
    if (encoded !== concretePath && regex.test(encoded)) return true;
  } catch {}
  try {
    const decoded = decodeURIComponent(concretePath);
    if (decoded !== concretePath && regex.test(decoded)) return true;
  } catch {}
  return false;
}

// Verilen somut yolu ilk yakalayan redirect (Next.js kayıtları sırayla dener, ilk eşleşen kazanır).
function firstMatch(entries, concretePath, excludeIndex = -1) {
  for (const e of entries) {
    if (e.index === excludeIndex) continue;
    if (matchesAny(e.regex, concretePath)) return e;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Kontroller
// ---------------------------------------------------------------------------

function routeSegments() {
  try {
    return new Set(
      fs
        .readdirSync(LOCALE_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('['))
        .map((d) => d.name),
    );
  } catch {
    return null;
  }
}

function analyze(text) {
  const findings = [];
  const add = (level, code, entry, message) =>
    findings.push({ level, code, line: entry ? entry.line : null, message });

  const { entries, sourceCount, found } = parseEntries(text, 'redirects');
  if (!found) {
    add('HATA', 'E0-PARSE', null, 'redirects() dizisi bulunamadı. Dosya yapısı değişmiş olabilir.');
    return { findings, stats: { redirects: 0 } };
  }
  if (sourceCount !== entries.length) {
    add(
      'UYARI',
      'E0-PARSE',
      null,
      `${sourceCount} "source" alanı var, ${entries.length} kayıt ayrıştırılabildi. Ayrıştırılamayan kayıtlar elle kontrol edilmeli.`,
    );
  }
  for (const e of entries) e.regex = toRegex(e.source);

  const rewrites = parseEntries(text, 'rewrites').entries;
  const segments = routeSegments();
  if (!segments) add('UYARI', 'E2-ROUTE', null, 'src/app/[locale] okunamadı, hedef rota kontrolü atlandı.');
  // Rewrite kaynaklarının ilk segmenti de geçerli bir hedeftir (ör. terapistler).
  const rewriteSegments = new Set(
    rewrites.map((r) => concretize(r.source).split('/').filter(Boolean)[1]).filter(Boolean),
  );

  for (const e of entries) {
    if (e.conditional) {
      add('BILGI', 'E0-COND', e, 'has/missing koşullu kayıt. Zincir analizi koşulları dikkate almaz.');
    }

    // E3: permanent
    if (e.permanent !== true) {
      add('UYARI', 'E3-PERM', e, `permanent: ${e.permanent === null ? 'tanımsız' : 'false'} (${e.source})`);
    }

    // E4: kaynakta ham Türkçe karakter ya da boşluk
    if (/[^\x00-\x7F]| /.test(e.source)) {
      add(
        'UYARI',
        'E4-SRC-RAW',
        e,
        `Kaynakta yüzde-kodlanmamış ASCII dışı karakter ya da boşluk var: "${e.source}". ` +
          'Dosyadaki T7 notuna göre tarayıcı isteği kodlu gelir, bu kayıt eşleşmeyebilir.',
      );
    }

    if (e.destination === null) {
      add('HATA', 'E0-PARSE', e, `destination alanı okunamadı (${e.source}).`);
      continue;
    }

    // E4: hedef slug biçimi
    const destPath = e.destination.split('?')[0];
    if (/[^\x00-\x7F]|\s|%|[A-Z]|--|-\/|-$/.test(destPath.replace(/:[A-Za-z_][A-Za-z0-9_]*[*+?]?/g, ''))) {
      add('UYARI', 'E4-DEST', e, `Hedef biçimi şüpheli: "${e.destination}"`);
    }

    // E2: hedef rota segmenti var mı
    if (segments && !/^https?:\/\//.test(e.destination)) {
      const segs = concretize(destPath).split('/').filter(Boolean);
      const first = segs[1];
      if (first && first !== SAMPLE_PARAM && !segments.has(first) && !rewriteSegments.has(first)) {
        if (segs.length === 2) {
          add('BILGI', 'E2-SEOSLUG', e, `Tek segmentli hedef "${e.destination}" [seoSlug] dinamik rotasına düşer.`);
        } else {
          add('HATA', 'E2-ROUTE', e, `Hedef rota segmenti "${first}" src/app/[locale] altında yok: "${e.destination}"`);
        }
      }
    }

    // E5: genel kaynak, var olan bir rota klasörünü tamamen yönlendiriyor mu
    if (segments) {
      const parts = e.source.split('/').filter(Boolean);
      const rest = parts.slice(2);
      if (parts[0] === ':locale' && segments.has(parts[1]) && rest.length > 0 && rest.every((p) => p.startsWith(':'))) {
        add(
          'BILGI',
          'E5-ROUTE-SHADOW',
          e,
          `"${e.source}" var olan src/app/[locale]/${parts[1]} rotasını tamamen yönlendiriyor. Redirect dosya sisteminden önce çalıştığı için o sayfa doğrudan erişilemez.`,
        );
      }
    }
  }

  // E1: tekrar eden kaynaklar
  const bySource = new Map();
  for (const e of entries) {
    if (!bySource.has(e.source)) bySource.set(e.source, []);
    bySource.get(e.source).push(e);
  }
  for (const [source, list] of bySource) {
    if (list.length < 2) continue;
    const sameDest = list.every((x) => x.destination === list[0].destination);
    add(
      sameDest ? 'BILGI' : 'HATA',
      'E1-DUP',
      list[1],
      `"${source}" ${list.length} kez tanımlı (satırlar: ${list.map((x) => x.line).join(', ')}). ` +
        (sameDest ? 'Hedefler aynı, fazlalık zararsız.' : `Yalnızca ilk kayıt (satır ${list[0].line}) çalışır, hedefler farklı.`),
    );
  }

  // E1: gölgeleme (daha önceki bir kayıt bu kaydın kaynağını zaten yakalıyor)
  for (const e of entries) {
    const concrete = concretize(e.source);
    for (const prev of entries) {
      if (prev.index >= e.index) break;
      if (prev.source === e.source) continue; // E1-DUP zaten raporladı
      if (matchesAny(prev.regex, concrete)) {
        add('HATA', 'E1-SHADOW', e, `Bu kayıt hiç çalışmaz: satır ${prev.line} ("${prev.source}") aynı isteği önce yakalıyor.`);
        break;
      }
    }
  }

  // E1: zincir ve döngü
  for (const e of entries) {
    if (e.destination === null || /^https?:\/\//.test(e.destination)) continue;
    const chain = [e];
    let current = e;
    let loop = false;
    for (let hop = 0; hop < MAX_HOPS; hop++) {
      const next = firstMatch(entries, concretize(current.destination.split('?')[0]), -1);
      if (!next) break;
      if (chain.includes(next)) {
        chain.push(next);
        loop = true;
        break;
      }
      chain.push(next);
      current = next;
    }
    if (chain.length < 2) continue;
    const trail = chain.map((x) => `satır ${x.line}`).join(' -> ');
    if (loop) add('HATA', 'E1-LOOP', e, `Redirect döngüsü: ${trail}`);
    else add('HATA', 'E1-CHAIN', e, `Redirect zinciri (${chain.length - 1} ek adım): ${trail}. Son hedef: "${current.destination}"`);
  }

  return {
    findings,
    stats: { redirects: entries.length, rewrites: rewrites.length, routeSegments: segments ? segments.size : 0 },
  };
}

// ---------------------------------------------------------------------------
// Çıktı
// ---------------------------------------------------------------------------

function main() {
  let text;
  try {
    text = fs.readFileSync(CONFIG_FILE, 'utf8');
  } catch (err) {
    process.stderr.write(`next.config.mjs okunamadı: ${err.message}\n`);
    process.exit(1);
  }

  const { findings, stats } = analyze(text);
  const order = { HATA: 0, UYARI: 1, BILGI: 2 };
  findings.sort((a, b) => order[a.level] - order[b.level] || (a.line ?? 0) - (b.line ?? 0));

  if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify({ file: 'next.config.mjs', stats, findings }, null, 2) + '\n');
    return;
  }

  const count = (lvl) => findings.filter((f) => f.level === lvl).length;
  const out = [];
  out.push('Redirect analizi: next.config.mjs (salt okunur, hiçbir dosya değiştirilmedi)');
  out.push(`Kayıt: ${stats.redirects} redirect, ${stats.rewrites} rewrite, ${stats.routeSegments} rota segmenti`);
  out.push(`Sonuç: ${count('HATA')} HATA, ${count('UYARI')} UYARI, ${count('BILGI')} BILGI`);
  out.push('HATA = doğrulanmış (metinden kesin). UYARI = olası risk (çalışma zamanına bağlı). BILGI = not.');
  out.push('Not: hedef profil slug\'larının veritabanında var olduğu bu script ile doğrulanamaz.');
  out.push('');
  for (const f of findings) {
    out.push(`[${f.level}] ${f.code}  next.config.mjs${f.line ? ':' + f.line : ''}  ${f.message}`);
  }
  process.stdout.write(out.join('\n') + '\n');
}

main();
