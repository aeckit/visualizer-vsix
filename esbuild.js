const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildPlugin = {
  name: 'vscode-webview-plugin',
  setup(build) {
    build.onEnd(result => {
      if (result.errors.length > 0) {
        console.error('Webview build failed:');
        console.error(result.errors);
      } else {
        console.log('Webview build successful');
      }
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['webview-ui/src/index.tsx'],
    bundle: true,
    format: 'iife',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    outfile: 'out/webview.js',
    logLevel: 'silent',
    plugins: [esbuildPlugin],
  });

  if (watch) {
    await ctx.watch();
    console.log('Watching for webview changes...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
