#!/usr/bin/env node
/**
 * Bash ve PowerShell araçları için PreToolUse koruma hook'u.
 *
 * Neden var: settings.json içindeki deny kuralları komut metninin başına bakar.
 * `git -C . push`, `git -c k=v push` ya da `git 'push'` gibi biçimler bu kurallara
 * takılmaz (resmî belgelerde de "güvenlik sınırı değildir" diye geçer). Read/Edit
 * deny kuralları da `Get-Content .env.local` gibi shell okumalarını kapsamaz.
 * Bu script komut metnini çalışmadan önce inceler ve iki şeyi engeller:
 *   1. Geçmişi değiştiren ya da uzağa gönderen git işlemleri (global seçeneklerden bağımsız).
 *   2. `.env*` (yalnızca `.env.example` serbest) ve `.credentials.json` geçen shell komutları.
 *
 * Sınır: Bu bir metin denetimidir, mutlak güvenlik garantisi değildir. Parçalanarak
 * birleştirilen metinler, git alias'ları ya da Start-Process gibi dolaylı çağrılar
 * yakalanmayabilir.
 *
 * Çıktı: Engellenecekse PreToolUse "deny" JSON'u basılır. Aksi halde hiçbir şey
 * basılmaz ve normal izin akışı (allow/ask/deny kuralları) devam eder.
 */

'use strict';

// Global seçeneklerden bağımsız olarak her zaman engellenen git alt komutları.
const ALWAYS_BLOCKED = new Set([
  'push',
  'rebase',
  'clean',
  'filter-branch',
  'filter-repo',
  'update-ref',
]);

// Ayrı bir değer argümanı alan git global seçenekleri (`git -C <yol> push` gibi).
// Bunlar atlanmazsa değer, alt komut sanılır ve denetim boşa çıkar.
const GLOBAL_OPTS_WITH_VALUE = new Set([
  '-C',
  '-c',
  '--git-dir',
  '--work-tree',
  '--namespace',
  '--super-prefix',
  '--config-env',
]);

// git uzun seçeneklerin belirsiz olmayan kısaltmalarını kabul eder (`--amen` = `--amend`).
// Bu yüzden tam eşleşme yerine en az 4 karakterlik önek eşleşmesi kullanılır.
function isLongOpt(arg, full) {
  const name = arg.split('=')[0];
  return name.startsWith('--') && name.length >= 4 && full.startsWith(name);
}

function basename(p) {
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1];
}

// Shell kaçış karakterlerini (tırnak, PowerShell backtick'i, cmd ^) temizler.
// Böylece `git pu'sh'` ya da `git p^ush` gibi biçimler de düz metne indirgenir.
function clean(token) {
  return token.replace(/["'`^]/g, '');
}

function tokenize(segment) {
  const tokens = [];
  const re = /"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(segment)) !== null) {
    tokens.push(m[1] ?? m[2] ?? m[3]);
  }
  return tokens;
}

// Komutu operatörlerden parçalara ayırır. Tırnak içi metinler de ayrıca incelenir,
// böylece `sh -c 'git push'` ya da `cmd /c "git push"` gibi sarmalanmış çağrılar kaçmaz.
function collectSegments(text, depth = 0, out = []) {
  for (const seg of text.split(/\$\(|&&|\|\||[;&|\n\r(){}`]/)) {
    if (seg.trim()) out.push(seg);
  }
  if (depth < 3) {
    const quoted = /"((?:[^"\\]|\\.)*)"|'([^']*)'/g;
    let m;
    while ((m = quoted.exec(text)) !== null) {
      const inner = m[1] ?? m[2];
      if (inner && inner.trim()) collectSegments(inner, depth + 1, out);
    }
  }
  return out;
}

function checkGit(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    if (!/^git(\.exe)?$/i.test(clean(basename(tokens[i])))) continue;

    // Global seçenekleri atlayıp asıl alt komutu bul.
    let j = i + 1;
    while (j < tokens.length && clean(tokens[j]).startsWith('-')) {
      const opt = clean(tokens[j]);
      j += GLOBAL_OPTS_WITH_VALUE.has(opt) ? 2 : 1;
    }
    if (j >= tokens.length) continue;

    const sub = clean(tokens[j]).toLowerCase();
    const rest = tokens.slice(j + 1).map(clean);

    if (ALWAYS_BLOCKED.has(sub)) return `git ${sub}`;
    if (sub === 'reset' && rest.some((a) => isLongOpt(a, '--hard'))) return 'git reset --hard';
    if (sub === 'commit' && rest.some((a) => isLongOpt(a, '--amend'))) return 'git commit --amend';
    if (
      sub === 'branch' &&
      rest.some((a) => isLongOpt(a, '--delete') || /^-[a-zA-Z]*[dD][a-zA-Z]*$/.test(a))
    ) {
      return 'git branch silme';
    }
    if (sub === 'reflog' && ['expire', 'delete'].includes((rest[0] || '').toLowerCase())) {
      return `git reflog ${rest[0]}`;
    }
  }
  return null;
}

// `.env`, `.env.local`, `.env.production`, `.env*` vb. eşleşir. `process.env.X`,
// `$env:X`, `next-env.d.ts` ve `.environment` eşleşmez. Yalnızca `.env.example` serbesttir.
function checkSecrets(command) {
  const envRe = /(?<![\w.-])\.env((?:\.[\w-]+)*)(?![\w-])/gi;
  let m;
  while ((m = envRe.exec(command)) !== null) {
    const name = ('.env' + m[1]).toLowerCase();
    if (name !== '.env.example') return name;
  }
  if (/\.credentials\.json/i.test(command)) return '.credentials.json';
  return null;
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    // Girdi çözülemiyorsa güvenli tarafta kalınır: komut engellenir.
    deny('guard-commands: hook girdisi çözülemedi, komut güvenlik için engellendi.');
  }

  const command = data && data.tool_input && data.tool_input.command;
  if (typeof command !== 'string' || !command.trim()) process.exit(0);

  const secret = checkSecrets(command);
  if (secret) {
    deny(
      `guard-commands: komut gizli dosyaya (${secret}) başvuruyor. Gizli dosyalar shell ile ` +
        'okunmaz ve yazılmaz. Değişken adları için .env.example kullanılır.',
    );
  }

  // Backtick bash'te komut ikamesi, PowerShell'de kaçış karakteridir (`pu`sh` = push).
  // İki yorumu da kapsamak için backtick'siz kopya da ayrıca denetlenir.
  const variants = command.includes('`') ? [command, command.replace(/`/g, '')] : [command];
  const segments = variants.flatMap((v) => collectSegments(v));

  for (const seg of segments) {
    const hit = checkGit(tokenize(seg));
    if (hit) {
      deny(
        `guard-commands: "${hit}" işlemi Claude için engellidir (CLAUDE.md, Git bölümü). ` +
          'Gerekirse kullanıcı bu komutu kendisi çalıştırır.',
      );
    }
  }

  process.exit(0);
});
