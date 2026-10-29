/* Für die Tests: den Worker samt @anthropic-ai/sdk zu einer Datei bündeln, wie es wrangler deploy tut */
import {buildSync} from 'esbuild';
import {fileURLToPath} from 'node:url';
const datei=fileURLToPath(new URL('worker.js',import.meta.url));let text;
export const werk=()=>[{type:'ESModule',path:datei,contents:text??=buildSync({entryPoints:[datei],bundle:true,format:'esm',platform:'browser',conditions:['workerd','worker','browser'],target:'es2022',write:false,logLevel:'error'}).outputFiles[0].text}];
