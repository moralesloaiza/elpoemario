#!/usr/bin/env node
// Validates contributor PRs against several integrity rules:
//
//   1. Curador ownership on fabulas/entradas (existing behaviour).
//   2. Authorship ownership on autores/: a contributor may only create
//      their own author file, and may only modify/delete/rename their
//      own.
//   3. Locked fields on existing autores/ files: github_username,
//      nombre and tipo cannot change between BASE and HEAD.
//   4. Uniqueness of `nombre` across the whole autores/ index in HEAD
//      (integrity check; runs even for admin).
//   5. CI hardening: non-admin PRs cannot touch .github/**.
//
// Reads frontmatter directly without external deps.
//
// Required env: PR_AUTHOR, BASE_SHA, HEAD_SHA.
// Exits 0 on success, 1 on rule violation, 2 on misconfiguration.

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ADMIN = 'moralesloaiza';
const AUTHORS_DIR = 'src/content/autores';
const CONTENT_PATTERN = /^src\/content\/(poemas|entradas)\/.+\.(md|mdx)$/;
const AUTHOR_PATTERN = /^src\/content\/autores\/.+\.(md|mdx)$/;
const CI_PATTERN = /^\.github\//;
const LOCKED_AUTHOR_FIELDS = ['github_username', 'nombre', 'tipo'];

const { PR_AUTHOR, BASE_SHA, HEAD_SHA } = process.env;

if (!PR_AUTHOR || !BASE_SHA || !HEAD_SHA) {
  console.error('Missing required env: PR_AUTHOR, BASE_SHA, HEAD_SHA.');
  process.exit(2);
}

const isAdmin = PR_AUTHOR === ADMIN;
const errors = [];

// 1. Parse the full diff once.
const diff = execSync(
  `git diff --name-status ${BASE_SHA} ${HEAD_SHA}`,
  { encoding: 'utf8' }
).trim();

const allChanges = diff
  .split('\n')
  .filter(Boolean)
  .map(parseDiffLine);

// 2. CI hardening: non-admin cannot touch .github/**.
if (!isAdmin) {
  const ciTouches = allChanges.filter(c =>
    CI_PATTERN.test(c.path) ||
    (c.oldPath && CI_PATTERN.test(c.oldPath))
  );
  if (ciTouches.length > 0) {
    errors.push(
      `✗ CI files modified by non-admin\n` +
      ciTouches.map(c => `    ${c.status}  ${c.path}`).join('\n') + '\n' +
      `  Only @${ADMIN} may modify .github/**.`
    );
  }
}

// 3. Author file authorship and locked fields.
const authorChanges = allChanges.filter(c =>
  AUTHOR_PATTERN.test(c.path) ||
  (c.oldPath && AUTHOR_PATTERN.test(c.oldPath))
);

if (!isAdmin) {
  for (const change of authorChanges) {
    checkAuthorChange(change, errors);
  }
}

// 4. Build author index from HEAD and check `nombre` uniqueness.
//    Uniqueness runs for everyone (data integrity, not ownership).
const { authorIndex, duplicates } = buildAuthorIndex();

if (duplicates.length > 0) {
  errors.push(
    `✗ Duplicate "nombre" in ${AUTHORS_DIR}/\n` +
    duplicates.map(d =>
      `    "${d.nombre}" appears in: ${d.files.join(', ')}`
    ).join('\n') + '\n' +
    `  Each author file must have a unique "nombre" field.`
  );
}

// 5. Curador ownership on fabulas/entradas.
const contentChanges = allChanges.filter(c => CONTENT_PATTERN.test(c.path));

if (contentChanges.length === 0 && authorChanges.length === 0) {
  if (errors.length === 0) {
    console.log('✓ No content or author files modified — nothing to check.');
    process.exit(0);
  }
}

if (!isAdmin) {
  for (const change of contentChanges) {
    checkCuradorOwnership(change, authorIndex, errors);
  }
}

// 6. Report.
if (errors.length > 0) {
  console.error('\nValidation failed:\n');
  for (const err of errors) console.error(err + '\n');
  process.exit(1);
}

if (isAdmin) {
  console.log(`✓ PR author is @${ADMIN} (admin) — ownership rules skipped.`);
} else {
  console.log('\n✓ All checks passed.');
}

// ---------- helpers ----------

function parseDiffLine(line) {
  // Format examples:
  //   M\tpath/to/file
  //   A\tpath/to/file
  //   D\tpath/to/file
  //   R100\told/path\tnew/path
  //   C75\told/path\tnew/path
  const parts = line.split('\t');
  const status = parts[0][0]; // first letter only
  if (status === 'R' || status === 'C') {
    return { status, oldPath: parts[1], path: parts[2] };
  }
  return { status, path: parts[1] };
}

function checkAuthorChange(change, errors) {
  const { status, path, oldPath } = change;

  // The path that exists in BASE (for read of base content).
  const basePath = oldPath || path;

  if (status === 'A') {
    // New file: PR author must be its github_username in HEAD.
    const headFm = readFrontmatterAt('HEAD', path);
    if (!headFm) {
      errors.push(`✗ ${path}\n  Could not read file in HEAD.`);
      return;
    }
    if (!headFm.github_username) {
      errors.push(
        `✗ ${path}\n` +
        `  New author file is missing github_username.\n` +
        `  Set github_username: ${PR_AUTHOR} (your GitHub handle).`
      );
      return;
    }
    if (headFm.github_username !== PR_AUTHOR) {
      errors.push(
        `✗ ${path}\n` +
        `  github_username: ${headFm.github_username}\n` +
        `  PR author:       ${PR_AUTHOR}\n` +
        `  You may only create an author file for yourself.`
      );
      return;
    }
    console.log(`✓ ${path} (new) — github_username matches @${PR_AUTHOR}`);
    return;
  }

  // M / D / R: the base file must belong to the PR author.
  const baseFm = readFrontmatterAt(BASE_SHA, basePath);
  if (!baseFm) {
    errors.push(
      `✗ ${path}\n` +
      `  Could not read ${basePath} at BASE_SHA. ` +
      `If this is a new file, its diff status should be A, not ${status}.`
    );
    return;
  }
  if (baseFm.github_username !== PR_AUTHOR) {
    errors.push(
      `✗ ${path}${oldPath ? ` (renamed from ${oldPath})` : ''}\n` +
      `  github_username on file (BASE): ${baseFm.github_username || '(empty)'}\n` +
      `  PR author:                       ${PR_AUTHOR}\n` +
      `  You may only modify, rename or delete your own author file.`
    );
    return;
  }

  // For non-deletions, locked fields cannot change between BASE and HEAD.
  if (status !== 'D') {
    const headFm = readFrontmatterAt('HEAD', path);
    if (!headFm) {
      errors.push(`✗ ${path}\n  Could not read file in HEAD.`);
      return;
    }
    const changed = LOCKED_AUTHOR_FIELDS.filter(f => baseFm[f] !== headFm[f]);
    if (changed.length > 0) {
      errors.push(
        `✗ ${path}\n` +
        `  Locked field(s) changed: ${changed.join(', ')}\n` +
        changed.map(f =>
          `    ${f}: "${baseFm[f] ?? ''}" → "${headFm[f] ?? ''}"`
        ).join('\n') + '\n' +
        `  These fields cannot be modified once the author file exists. ` +
        `Open an issue if you need an admin change.`
      );
      return;
    }
  }

  console.log(
    `✓ ${path}${oldPath ? ` (renamed from ${oldPath})` : ''} — ` +
    `owned by @${PR_AUTHOR}, locked fields unchanged`
  );
}

function checkCuradorOwnership(change, authorIndex, errors) {
  const { status, path } = change;

  let content;
  try {
    if (status === 'D') {
      content = execSync(`git show ${BASE_SHA}:${path}`, { encoding: 'utf8' });
    } else {
      content = readFileSync(path, 'utf8');
    }
  } catch (err) {
    errors.push(`✗ ${path}: could not read file (${err.message})`);
    return;
  }

  const fm = parseFrontmatter(content);

  if (!fm.curador) {
    errors.push(`✗ ${path}\n  Missing required field 'curador' in frontmatter.`);
    return;
  }

  const author = authorIndex.get(fm.curador);

  if (!author) {
    errors.push(
      `✗ ${path}\n` +
      `  curador: "${fm.curador}"\n` +
      `  No file in ${AUTHORS_DIR}/ has nombre: "${fm.curador}".\n` +
      `  If you are a new contributor, include your author entry in this PR\n` +
      `  (tipo: colaborador, github_username: your-github-handle).`
    );
    return;
  }

  if (author.tipo !== 'colaborador' && author.tipo !== 'director') {
    errors.push(
      `✗ ${path}\n` +
      `  curador: "${fm.curador}" → ${AUTHORS_DIR}/${author.file}\n` +
      `  This author is tipo: "${author.tipo}". Only 'colaborador' or\n` +
      `  'director' authors may be set as curador in a contributor PR.`
    );
    return;
  }

  if (author.github_username !== PR_AUTHOR) {
    errors.push(
      `✗ ${path}\n` +
      `  curador: "${fm.curador}" → ${AUTHORS_DIR}/${author.file}\n` +
      `  github_username on file: ${author.github_username || '(empty)'}\n` +
      `  PR author:               ${PR_AUTHOR}\n` +
      `  You can only modify content where you are the curador.`
    );
    return;
  }

  console.log(`✓ ${path} — curador "${fm.curador}" matches @${PR_AUTHOR}`);
}

function buildAuthorIndex() {
  const index = new Map();
  const seen = new Map(); // nombre -> [files]

  if (!existsSync(AUTHORS_DIR)) {
    return { authorIndex: index, duplicates: [] };
  }

  for (const file of readdirSync(AUTHORS_DIR)) {
    if (!/\.(md|mdx)$/.test(file)) continue;
    const fm = parseFrontmatter(readFileSync(join(AUTHORS_DIR, file), 'utf8'));
    if (!fm.nombre) continue;

    const list = seen.get(fm.nombre) || [];
    list.push(file);
    seen.set(fm.nombre, list);

    // First write wins so later duplicate cannot hijack the entry.
    if (!index.has(fm.nombre)) {
      index.set(fm.nombre, {
        tipo: fm.tipo,
        github_username: fm.github_username,
        file,
      });
    }
  }

  const duplicates = [];
  for (const [nombre, files] of seen) {
    if (files.length > 1) duplicates.push({ nombre, files });
  }

  return { authorIndex: index, duplicates };
}

function readFrontmatterAt(ref, path) {
  // ref can be a SHA or 'HEAD' (working tree for HEAD reads is fine,
  // but we use git show for symmetry and to avoid caring about the
  // checkout state).
  try {
    const content = ref === 'HEAD'
      ? readFileSync(path, 'utf8')
      : execSync(`git show ${ref}:${path}`, { encoding: 'utf8' });
    return parseFrontmatter(content);
  } catch {
    return null;
  }
}

// --- Minimal frontmatter parser ---
// Handles only one-line scalar fields (sufficient for nombre, tipo,
// github_username, curador). Block scalars and arrays are ignored
// (their value line is empty or non-matching).
function parseFrontmatter(text) {
  const match = text.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([a-z_][a-z0-9_]*):\s*(.*)$/i);
    if (!m) continue;
    let [, key, value] = m;
    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === '') continue;
    result[key] = value;
  }
  return result;
}
