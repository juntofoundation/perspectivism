import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
//import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import postcss from "rollup-plugin-postcss";
import { string } from 'rollup-plugin-string'
import json from '@rollup/plugin-json';

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'index.js',
	external: ["aws-sdk"],
	output: {
		sourcemap: true,
		format: 'cjs',
		name: 'JuntoShortForm',
		file: 'build/bundle.js',
		interop: "esModule",
		globals: {
		  "amazon-cognito-identity-js": "AmazonCognitoIdentity",
		},
	},
	external: ["AmazonCognitoIdentity", "amazon-cognito-identity-js"],
	plugins: [
		string({
			include: 'build/*.js'
		}),
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			//css: css => {
			//	css.write('bundle.css');
			//},
			preprocess: sveltePreprocess(),
		}),
		// copy({
        //     assets: ['package.unbundled.json']
        // }),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		postcss({
			extract: true,
			minimize: true,
			use: [
			  ['sass', {
				includePaths: [
				  './src/ui/theme',
				  './node_modules'
				]
			  }]
			]
		  }),
		json()
	],
	watch: {
		clearScreen: false
	}
}
