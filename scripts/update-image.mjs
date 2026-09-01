#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , environment, imageName, newName, newTag] = process.argv;
if (![environment, imageName, newName, newTag].every(Boolean)) {
  throw new Error('Uso: update-image.mjs <ambiente> <imagen> <repositorio> <sha>');
}
if (!/^[a-f0-9]{40}$/.test(newTag)) {
  throw new Error('La etiqueta debe ser un SHA completo de 40 caracteres');
}

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repositoryRoot, 'overlays', environment, 'kustomization.yaml');
const lines = fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/);
const imageLine = lines.findIndex((line) => line.trim() === `- name: ${imageName}`);
if (imageLine < 0 || imageLine + 2 >= lines.length) {
  throw new Error(`No se encontró la imagen ${imageName} en ${manifestPath}`);
}
lines[imageLine + 1] = `    newName: ${newName}`;
lines[imageLine + 2] = `    newTag: ${newTag}`;
fs.writeFileSync(manifestPath, `${lines.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
