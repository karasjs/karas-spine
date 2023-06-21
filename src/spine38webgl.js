// karas画mesh的插件
import karas from 'karas';
import SpineWebGL from './spine-webgl';

const { AtlasAttachmentLoader, SkeletonJson, Skeleton, Vector2, AnimationState, AnimationStateData } = SpineWebGL;
const { SkeletonRenderer, AssetManager, Shader, PolygonBatcher, Matrix4 } = SpineWebGL.webgl;


// 储存全局的spine渲染器的对象。在一个karas场景里面，n个spine元素使用同一个渲染器。一个页面可以有n个karas场景，根据canvas上下文唯一确定渲染器
const GlobalSpineRendererMap = new WeakMap();

const {
  math: {
    matrix: {
      isE,
      multiply,
      identity,
      calPoint,
      assignMatrix,
    },
  },
  mode: {
    WEBGL,
  },
  enums: {
    STYLE_KEY: {
      TRANSFORM,
      TRANSFORM_ORIGIN,
    },
  },
  style: {
    transform: {
      calMatrixByOrigin,
    },
  },
  util: {
    equalArr,
  },
} = karas;

class $ extends karas.Geom {
  constructor(tagName, props) {
    super(tagName, props);
    this.playbackRate = props.playbackRate || 1;
    this.isPlay = props.isPlay || false;
  }
  resize(ctx, env) {
    let bounds = this.bounds;

    // magic
    let centerX = bounds.offset.x + bounds.size.x / 2;
    let centerY = bounds.offset.y + bounds.size.y / 2;
    let width = env.width, height = env.height;

    this.mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
  }
  render(renderMode, ctx, dx, dy) {
    if(renderMode === WEBGL) {
      if(!this.bounds) {
        return;
      }
      let env = this.env;
      let CX = env.width * 0.5, CY = env.height * 0.5;
      this.resize(ctx, env);

      this.currentTime = Date.now() * 0.001;
      let delta = this.currentTime - this.lastTime;
      if(this.playbackRate && this.playbackRate !== 1) {
        delta *= this.playbackRate;
      }
      this.lastTime = this.currentTime;
      if (!this.isPlay) {
        delta = 0;
      }

      let bounds = this.bounds;
      let size = bounds.size, offset = bounds.offset;
      let x = offset.x;
      let y = offset.y;
      let width = size.x;
      let height = size.y;
      let centerX = x + width * 0.5;
      let centerY = y + height * 0.5;
      let tfo = [centerX / CX, centerY / CY];

      let pm = this.matrixEvent, lastPm = this.lastPm;
      if(lastPm && equalArr(pm, lastPm) && this.lastX === this.__x1 && this.lastY === this.__y1) {
        this.lastMatrix && assignMatrix(this.mvp.values, this.lastMatrix);
      }
      else {
        // 先以骨骼原本的中心点为基准，应用节点的matrix，如果是局部缓存，则为E
        if(!isE(pm) && env.node !== this.__domParent) {
          let m = identity(), node = this;
          while(node) {
            let t = calWebglMatrix(node, CX, CY, dx, dy);
            if(t) {
              m = multiply(t, m);
            }
            node = node.__domParent;
            // 局部根节点，或者root
            if(node === env.node) {
              break;
            }
          }
          // root左上原点对齐中心，上下翻转y
          this.mvp.translate(tfo[0], tfo[1], 0);
          m = multiply([1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], m);
          this.mvp.multiplyLeft({ values: m });
          this.mvp.multiply({ values: [1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] });
          this.mvp.translate(-tfo[0], -tfo[1], 0);
        }

        let fitSize = this.props.fitSize;
        let scx = width / this.width;
        let scy = height / this.height;
        let scale = fitSize === 'cover' ? Math.min(scx, scy) : Math.max(scx, scy);
        if(scale !== 1) {
          // 对齐中心点后缩放
          let tfo = [centerX / CX, centerY / CY];
          this.mvp.translate(tfo[0], tfo[1], 0);
          let m = karas.math.matrix.identity();
          m[0] = 1 / scale;
          m[5] = 1 / scale;
          this.mvp.multiply({ values: m });
          this.mvp.translate((-tfo[0]) / scale, (-tfo[1]) / scale, 0);
        }
        // 还原位置，先对齐中心点，再校正
        if(env.node !== this.__domParent) {
          let x0 = this.x + dx + this.width * 0.5;
          let y0 = this.y + dy + this.height * 0.5;
          let p1 = calPoint({ x: centerX, y: centerY }, this.mvp.values);
          let p = calPoint({ x: x0, y: y0 }, pm);
          this.mvp.translate((p.x - CX) / CX, (-p.y + CY) / CY, 0);
          this.mvp.translate(-p1.x, -p1.y, 0);
        }
        this.lastMatrix = this.mvp.values.slice(0);
      }
      this.lastPm = pm.slice(0);
      this.lastX = this.__x1;
      this.lastY = this.__y1;

      this.state.update(delta);
      this.state.apply(this.skeleton);
      this.skeleton.updateWorldTransform();

      // Bind the shader and set the texture and model-view-projection matrix.
      this.shader.bind();
      this.shader.setUniformi(Shader.SAMPLER, 0);
      this.shader.setUniform4x4f(Shader.MVP_MATRIX, this.mvp.values);

      // Start the batch and tell the SkeletonRenderer to render the active skeleton.
      this.batcher.begin(this.shader);
      this.renderer.premultipliedAlpha = !!this.props.premultipliedAlpha;
      this.renderer.draw(this.batcher, this.skeleton);
      this.batcher.end();

      this.shader.unbind();
      // 渲染完恢复
      ctx.enable(ctx.BLEND);
      ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
      this.props.onFrame?.();
    }
  }
}

function calWebglMatrix(node, cx, cy, dx, dy) {
  let { __x1: x, __y1: y } = node;
  let computedStyle = node.__computedStyle;
  let matrix = computedStyle[TRANSFORM];
  if(matrix && !isE(matrix)) {
    let tfo = computedStyle[TRANSFORM_ORIGIN];
    matrix = calMatrixByOrigin(matrix, (cx - x - dx - tfo[0]) / cx, (cy - y - dy - tfo[1]) / cy);
  }
  return matrix;
}

/**
 * props参数介绍：
 * atlas 必填，url。
 * image 必填，图片url
 * json 必填，url。包含骨骼数据
 * 下面都是选填：
 * animation 动画名称。改这个字段切换不同动画播放。默认是idle或者是解析出来之后的第一个动画（如果不存在idle名称的动画情况下）
 * skin 皮肤名称。可以切换皮肤。默认是default
 * loopCount 重复次数。默认无限重复
 * onLoop 每次循环播放会触发一次事件
 * onStart 动画刚开始播放的事件
 * onEnd 动画播放完毕的事件
 * debugger
 */
export default class Spine38WebGL extends karas.Component {
  mvp = new Matrix4();

  mapping = null;
  isPlay = false;
  __playbackRate = 1;

  constructor(props) {
    super(props);

    this.animationName = props.animation;
    this.skinName = props.skin || 'default';
    this.loopCount = props.loopCount || Infinity;
    this.isPlay = props.autoPlay !== false;
    this.__playbackRate = props.playbackRate || 1;
  }

  playAnimation = (animationName = this.animationName, loop = this.loopCount, skinName = this.skinName) => {
    if (this.__isDestroyed) {
      return;
    }
    this.loopCount = loop;
    this.animationName = animationName;
    let fake = this.ref.fake;
    fake.lastTime = fake.currentTime = Date.now() * 0.001;
    let data;
    if(this.state) {
      this.state.removeListener(this.stateListener);
      this.stateListener = this.loadFin(this.state, animationName);
    }
    else {
      data = this.loadSkeleton(animationName, skinName); // 默认的骨骼动画名称和皮肤名称
      this.state = data.state;
      this.stateDate = data.stateDate;
      this.skeleton = data.skeleton;
      this.bounds = data.bounds;
      this.stateListener = data.listener;
      this.animationsList = data.animations;

      fake.state = data.state;
      fake.skeleton = data.skeleton;
      fake.bounds = data.bounds;
      // 第一帧强制显示
      fake.refresh();
    }
    this.resume();
  }

  load(ctx) {
    let fake = this.ref.fake;
    if(!this.renderer) {
      this.renderer = GlobalSpineRendererMap.get(ctx);
      if(!this.renderer) {
        this.renderer = new SkeletonRenderer(ctx);
        GlobalSpineRendererMap.set(ctx, this.renderer);
      }
      // this.renderer.debugRendering = !!this.props.debug;
      // this.renderer.triangleRendering = !!this.props.triangle;
      this.props.onRender?.();
    }
    if(!this.shader) {
      this.shader = Shader.newTwoColoredTextured(ctx);
      this.batcher = new PolygonBatcher(ctx);
      this.assetManager = new AssetManager(ctx, undefined, false, 0);
    }
    fake.renderer = this.renderer;
    fake.shader = this.shader;
    fake.batcher = this.batcher;
    fake.mvp = this.mvp;

    let assetManager = this.assetManager;
    let img = this.props.image;
    if(typeof img === 'string') {
      assetManager.loadTexture(img, this.props.onImgLoad, this.props.onImgError);
    }
    // 多个
    else if(Array.isArray(img)) {
      for(let i = 0, len = img.length; i < len; i++) {
        assetManager.loadTexture(img[i], this.props.onImgLoad, this.props.onImgError);
      }
    }
    // 多个且需要映射关系
    else {
      this.mapping = {};
      for(let i in img) {
        if(img.hasOwnProperty(i)) {
          let item = img[i];
          this.mapping[i] = item;
          assetManager.loadTexture(item, this.props.onImgLoad, this.props.onImgError);
        }
      }
    }
    assetManager.loadTextureAtlas(this.props.atlas, img, this.mapping);
    assetManager.loadText(this.props.json);

    let onLoad = () => {
      if(assetManager.isLoadingComplete()) {
        this.props.onLoad?.();
        this.playAnimation();
      }
      else {
        karas.inject.requestAnimationFrame(onLoad);
      }
    }
    onLoad();
  }

  componentDidMount() {
    this.load(this.root.ctx);

    let fake = this.ref.fake;
    fake.frameAnimate(() => {
      if (this.isPlay) {
        fake.refresh();
      }
    });
  }

  componentWillUnmount() {
    this.ref.fake.bounds = null;
    if(this.assetManager) {
      this.assetManager.dispose();
      this.assetManager.destroy();
    }
    if(this.batcher) {
      this.batcher.dispose();
    }
    if(this.shader) {
      this.shader.dispose();
    }
  }

  loadSkeleton(initialAnimation, skin) {
    if(skin === undefined || skin === null) {
      skin = 'default';
    }

    // Load the texture atlas using name.atlas from the AssetManager.
    let atlas = this.assetManager.get(this.props.atlas);

    // Create a AtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
    let atlasLoader = new AtlasAttachmentLoader(atlas);

    // Create a SkeletonBinary instance for parsing the .skel file.
    let skeletonBinary = new SkeletonJson(atlasLoader);

    // Set the scale to apply during parsing, parse the file, and create a new skeleton.
    let skeletonData = skeletonBinary.readSkeletonData(this.assetManager.get(this.props.json));
    let skeleton = new Skeleton(skeletonData);
    skeleton.setSkinByName(skin);
    let bounds = calculateBounds(skeleton);
    if(!initialAnimation) {
      initialAnimation = skeletonData.animations[0].name;
    }

    // Create an AnimationState, and set the initial animation in looping mode.
    let animationStateData = new AnimationStateData(skeleton.data);
    let animationState = new AnimationState(animationStateData);
    let listener = this.loadFin(animationState, initialAnimation);

    // Pack everything up and return to caller.
    return { skeleton, state: animationState, stateDate: animationStateData, bounds, listener };
  }

  loadFin(animationState, animationName) {
    animationState.setAnimation(0, animationName, true);
    this.props.onStart?.(animationName, this.loopCount);
    let o = {
      complete: () => {
        this.loopCount--;
        this.props.onLoop?.(animationName, this.loopCount);

        if(this.loopCount > 0) {
          animationState.setAnimation(0, animationName, 0);
        }
        else {
          this.props.onEnd?.(animationName);
          animationState.setAnimation(0, animationName, 0);
          this.pause();
        }
      },
    };
    animationState.addListener(o);
    return o;
  }

  render() {
    return <div>
      <$ ref="fake" style={{
        width: '100%',
        height: '100%',
      }} debug={this.props.debug}
         isPlay={this.isPlay}
         fitSize={this.props.fitSize}
         triangle={this.props.triangle}
         premultipliedAlpha={this.props.premultipliedAlpha}
         repeatRender={this.props.repeatRender}
         playbackRate={this.__playbackRate}
         onFrame={this.props.onFrame}
         onRender={this.props.onRender}/>
    </div>;
  }

  pause() {
    this.isPlay = false;
    this.ref.fake.isPlay = false;
  }

  resume() {
    this.isPlay = true;
    this.ref.fake.isPlay = true;
  }

  set playbackRate(v) {
    this.ref.fake.playbackRate = parseFloat(v) || 1;
  }
}

function calculateBounds(skeleton) {
  skeleton.setToSetupPose();
  skeleton.updateWorldTransform();
  let offset = new Vector2();
  let size = new Vector2();
  skeleton.getBounds(offset, size, []);
  return { offset: offset, size: size };
}

