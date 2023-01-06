import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default [{
  input: 'src/index.js',
  output: {
    name: 'Spine',
    file: 'index.es.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // 只编译我们的源代码
      runtimeHelpers: true
    }),
    json(),
  ],
}, {
  input: 'src/index.js',
  output: {
    name: 'Spine',
    file: 'index.js',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // 只编译我们的源代码
      runtimeHelpers: true
    }),
    json(),
  ],
}, {
  input: 'src/index.js',
  output: {
    name: 'Spine',
    file: 'index.js',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // 只编译我们的源代码
      runtimeHelpers: true
    }),
    json(),
  ],
}, {
  input: 'src/index.js',
  output: {
    name: 'Spine',
    file: 'index.min.js',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // 只编译我们的源代码
      runtimeHelpers: true
    }),
    terser({
    }),
    json(),
  ],
}];
