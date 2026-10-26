import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Copy only the plugin actually used. Never empty dist: it owns application code,
// outfit photos and the user's brand assets as well as generated CSS.
const root = new URL('../', import.meta.url);
const output = new URL('dist/vendor/', root);
await mkdir(output, { recursive: true });
for (const [source, target] of [
  ['node_modules/preline/dist/toggle-password-non-auto.mjs', 'toggle-password.mjs'],
  ['node_modules/preline/LICENSE', 'PRELINE-LICENSE.txt'],
  ['node_modules/gsap/dist/gsap.min.js', 'gsap.min.js'],
  ['node_modules/gsap/README.md', 'GSAP-README.md']
]) {
  await copyFile(new URL(source, root), new URL(target, output));
}
console.log(`Prepared local Preline and GSAP in ${fileURLToPath(output)}`);

// Build one local icon map from the attributed Lucide SVG files used by Preline.
// No icon network request or third-party JavaScript is needed at runtime.
const aliases = { user: 'user-round', shield: 'shield-check', bag: 'shopping-bag', cart: 'shopping-cart', chat: 'message-circle', calendar: 'calendar-days', pin: 'map-pin', close: 'x', filter: 'sliders-horizontal' };
const names = ['search', 'user', 'shield', 'bag', 'cart', 'chat', 'calendar', 'pin', 'check', 'close', 'plus', 'shirt', 'wallet', 'pause', 'play', 'eye', 'eye-off', 'upload', 'arrow-up-right', 'arrow-left', 'arrow-right', 'chevron-down', 'chevron-up', 'chevron-left', 'chevron-right', 'send', 'info', 'filter', 'star'];
const paths = {};
for (const name of names) {
  const svg = await readFile(new URL(`dist/assets/icons/${aliases[name] || name}.svg`, root), 'utf8');
  paths[name] = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim().replace(/\s+/g, ' ');
}
await writeFile(new URL('dist/ui/icons.mjs', root), `// Generated from Lucide SVGs used by Preline. See assets/icons/LICENSE.txt.\nconst paths = Object.freeze(${JSON.stringify(paths, null, 2)});\nexport function icon(name) {\n  const key = Object.hasOwn(paths, name) ? name : 'info';\n  return \`<svg data-icon="\${key}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">\${paths[key]}</svg>\`;\n}\n`);
