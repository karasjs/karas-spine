import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';
import csx from 'rollup-plugin-csx';

export default [{
  input: 'src/index.js',
  output: {
    name: 'Dragonbones',
    file: 'index.js',
    format: 'umd',
    sourcemap: true,
    globals: {
      karas: 'karas',
    },
  },
  plugins: [
    json(),
    csx(),
    babel({
      exclude: 'node_modules/**', // 只编译我们的源代码
      runtimeHelpers: true
    }),
  ],
}];
