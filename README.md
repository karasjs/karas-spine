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
      animName="walk" // 动画名
      pause={false} // 是否停在第一帧不自动播放
      fitSize={false} // 自适应尺寸，否则用原始的，可以为true或cover
      debugRendering={false} // debug开启
      triangleRendering={false} // triangle绘制开启
    />
  </canvas>,
  '#domId'
);
```
### 组件上的对象：
* animation: Animation WAA动画对象，karas.animate.Animation实例，可控制动画状态
