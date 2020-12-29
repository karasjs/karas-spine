# karas-spine
Spine component for karas.

## API
```jsx
import Spine from 'karas-spine';

karas.render(
  <canvas width="720" height="720">
    <Spine
      fitSize={false} // 可选当ske指定画布尺寸时是否根据组件宽高进行缩放适配，默认false
      staticCache={false} //可选开启静态帧优化，每帧渲染后缓存，默认false
      playbackRate={1} // 可选播放速度，默认1
      fps={60} // 可选播放fps，默认60
    />
  </canvas>,
  '#domId'
);
```
#### 组件上的对象：
* animation: Animation WAA动画对象，karas.animate.Animation实例，可控制动画状态
#### 组件上的方法：
