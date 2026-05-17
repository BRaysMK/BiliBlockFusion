import importContent from 'rollup-plugin-import-content'
import vue from 'rollup-plugin-vue';
import esbuild from 'rollup-plugin-esbuild';
import serve from 'rollup-plugin-serve'
import replace from '@rollup/plugin-replace'
import test_plugin from './plugin/rollup-test-plugin.js'
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取 package.json 获取版本号
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

// 开发环境为 true，生产环境为 false，默认为开发环境
const __DEV__ = (process.env.ROLLUP_ENV || 'development') === 'development';

export default {
    // 性能监控
    perf: !__DEV__,
    input: 'src/web/main.js',
    external: ['vue', 'dexie'],
    plugins: [
        // 使用 replace 插件定义全局变量
        replace({
            __DEV__: JSON.stringify(__DEV__),
            __SCRIPT_VERSION__: JSON.stringify(pkg.version),
            preventAssignment: true,
        }),
        esbuild({
            // 核心配置
            target: 'es2020',
            charset: 'utf8', // 明确使用 UTF-8 编码
            // 生产环境优化
            minify: false,
            // none不保留注释，inline注释
            legalComments: __DEV__ ? 'inline' : 'none',
        }),
        importContent({
            fileName: ['.css']
        }),
        vue({
            css: true,
            compileTemplate: true // 编译模板
        }),
        test_plugin({
            isDev: __DEV__,
            clearComments: !__DEV__
        }),
        __DEV__ ? serve({
            open: false,
            port: 3000,
            contentBase: 'dist',
        }) : {}
    ],
    output: {
        file: 'dist/BiliBlockFusion.user.js',
        format: 'iife',
        compact: true,
        globals: {
            vue: "Vue",
            dexie: 'Dexie'
        }
    }
};
