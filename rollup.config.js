import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';

export default [{
  input: 'src/index.js',
  output: {
    name: 'Spine',
    file: 'index.js',
    format: 'umd',
    sourcemap: true,
    globals: {
      karas: 'karas',
    },
  },
  plugins: [
    json(),
    babel({
      exclude: 'node_modules/**', // 只编译我们的源代码
      runtimeHelpers: true
    }),
  ],
}];
