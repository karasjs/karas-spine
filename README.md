# karas-spine
Spine component for karas.

## API
```jsx
import Spine from 'karas-spine';

karas.render(
  <canvas width="720" height="720">
    <Spine
      atlas="spineboy.atlas" // 指定atlas地址
      json="spineboy-ess.json" // 指定json地址
      tex="spineboy.png" // 指定纹理图地址
      skelName="spineboy-ess" // 骨架名
      animName="walk" // 动画名
      fitSize={false} // 自适应尺寸，否则用原始的
      debug={false} // debug开启
    />
  </canvas>,
  '#domId'
);
```
