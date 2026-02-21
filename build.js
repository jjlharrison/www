import { cpSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const root = import.meta.dirname;
const dist = join(root, 'dist');

const skip = new Set(['.git', '.idea', '.DS_Store', '.gitignore', 'node_modules', 'dist', 'package.json', 'package-lock.json', 'build.js']);

// Directories that have their own Vite build (output is in <dir>/dist/)
const viteProjects = new Set(['getting-ready']);

for (const entry of readdirSync(root)) {
    if (skip.has(entry)) continue;

    const src = join(root, entry);

    if (viteProjects.has(entry)) {
        // Copy the Vite build output
        const buildDir = join(src, 'dist');
        if (existsSync(buildDir)) {
            cpSync(buildDir, join(dist, entry), { recursive: true });
        }
    } else {
        // Copy static files/directories as-is
        const destPath = join(dist, entry);
        if (statSync(src).isDirectory()) {
            cpSync(src, destPath, { recursive: true });
        } else {
            cpSync(src, destPath);
        }
    }
}

console.log('Assembled dist/');
