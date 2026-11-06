#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const projectRoot = process.cwd();
const sourceRoot = join(projectRoot, 'src');
const javascriptExtensions = new Set(['.js', '.jsx']);
const importPattern = /(?:import\s+(?:[^'"]*?\s+from\s+)?|export\s+[^'"]*?\s+from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g;

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function resolveImport(sourceFile, specifier) {
  const base = resolve(dirname(sourceFile), specifier);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    join(base, 'index.js'),
    join(base, 'index.jsx'),
  ];
  return candidates.find((candidate) => {
    try {
      return statSync(candidate).isFile();
    } catch {
      return false;
    }
  }) ?? null;
}

function categoryFor(file) {
  const parts = relative(sourceRoot, file).split(sep);
  if (parts[0] === 'features' && parts[1]) return `feature:${parts[1]}`;
  return parts[0];
}

function featureNameFor(file) {
  const parts = relative(sourceRoot, file).split(sep);
  return parts[0] === 'features' ? parts[1] : null;
}

function isTestFile(file) {
  const parts = relative(sourceRoot, file).split(sep);
  return parts.includes('testing') || /\.(test|spec)\./.test(file);
}

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

const files = walk(sourceRoot)
  .filter((file) => javascriptExtensions.has(extname(file)))
  .filter((file) => !isTestFile(file));

const violations = [];
const graph = new Map();

for (const sourceFile of files) {
  const sourceCategory = categoryFor(sourceFile);
  const sourceFeature = featureNameFor(sourceFile);
  const text = readFileSync(sourceFile, 'utf8');

  for (const match of text.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) continue;

    const targetFile = resolveImport(sourceFile, specifier);
    if (!targetFile) continue;

    const targetCategory = categoryFor(targetFile);
    const targetFeature = featureNameFor(targetFile);
    const location = `${relative(projectRoot, sourceFile)}:${lineAt(text, match.index)}`;

    if (sourceCategory === 'shared' && (targetCategory === 'app' || targetFeature)) {
      violations.push(`${location} — shared no puede importar ${targetCategory}`);
      continue;
    }

    if (sourceFeature && targetCategory === 'app') {
      violations.push(`${location} — una feature no puede importar app/`);
      continue;
    }

    if (sourceFeature && targetFeature && sourceFeature !== targetFeature) {
      const targetRelative = relative(sourceRoot, targetFile).split(sep).join('/');
      const publicEntry = `features/${targetFeature}/index.js`;
      const publicEntryJsx = `features/${targetFeature}/index.jsx`;

      if (targetRelative !== publicEntry && targetRelative !== publicEntryJsx) {
        violations.push(
          `${location} — ${sourceFeature} debe importar ${targetFeature} por su index público, no por ${targetRelative}`,
        );
        continue;
      }

      if (!graph.has(sourceFeature)) graph.set(sourceFeature, new Set());
      graph.get(sourceFeature).add(targetFeature);
    }
  }
}

function findCycle(start, current = start, path = [], visited = new Set()) {
  if (current === start && path.length > 0) return [...path, start];
  if (visited.has(current)) return null;
  visited.add(current);

  for (const next of graph.get(current) ?? []) {
    const cycle = findCycle(start, next, [...path, current], visited);
    if (cycle) return cycle;
  }
  return null;
}

for (const feature of graph.keys()) {
  const cycle = findCycle(feature);
  if (cycle) violations.push(`Ciclo entre features: ${cycle.join(' → ')}`);
}

if (violations.length > 0) {
  console.error('Arquitectura: se han encontrado incumplimientos:\n');
  for (const violation of [...new Set(violations)]) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`Arquitectura correcta: ${files.length} archivos de producción revisados.`);
