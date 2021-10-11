# karas-spine
Spine component for karas.

---
karas spine插件。

大部分解析逻辑是沿用官方的库的代码，但是里面有些代码在用的时候会出问题，对源码有些修改，原版里面几个api的参数和细节逻辑有改。

由于spine的官方解析逻辑没有兼容旧版本spine，所以本插件目前只支持4以上的版本。使用3.6或3.8版本的spine可能会在解析时候报错或者无法正确拿到动画数据情况。

[![NPM version](https://img.shields.io/npm/v/karas.svg)](https://npmjs.org/package/karas)

## Install
```
npm install karas
npm install karas-spine
```

## Usage

```jsx
import Spine from 'karas-spine';
let root = karas.render(
    <canvas width="800" height="800">
      <Spine ref="spine"
        onEnd={(a)=>{console.log(a, 'end')}}
        onStart={(a)=>{console.log(a, 'start')}}
        onLoop={(a, l)=>{console.log(a, l, 'loop')}}
        atlas="https://gw.alipayobjects.com/os/bmw-prod/d730cf03-b578-4b25-89a1-ebb055827d30.txt"
        image="https://gw.alipayobjects.com/mdn/rms_d4cd3c/afts/img/A*f3ElSKHQjI8AAAAAAAAAAAAAARQnAQ"
        json="https://gw.alipayobjects.com/os/bmw-prod/bb831c1c-d802-4c87-b9a7-cdd492ee399a.json"/>
    </canvas>,
    '#test'
  );

let spine = root.ref.spine;
console.log(spine);
// spine.playAnimation('run');
// spine.playAnimation('death', 1);
```

### method

* playAnimation('run', Infinity, 'default'); // 动画名称，重复次数（可选，默认为Infinity），皮肤名称（可选，默认default）

### props
#### 必填的props字段
atlas: atlas文件url
json：json文件的url
image：图片url

#### 选填的props字段
onEnd：播放结束事件
onStart： 开始播放事件
onLoop：每次循环播放触发一次
animation 动画名称。改这个字段切换不同动画播放。默认是idle
skin 皮肤名称。可以切换皮肤。默认是default
loopCount 重复次数。默认无限重复

debug 是否开启debug模式查看每个零件的方框
triangle 以三角形方式绘制

### TODO

调节播放速度
兼容旧版本spine的json格式


# License
[MIT License]
