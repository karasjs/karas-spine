// karas画mesh的插件
import karas from 'karas';
// import { SkeletonRenderer } from './spine-canvas/SkeletonRenderer';
// import { AssetManager } from './spine-canvas/AssetManager';
// import { TextureAtlas } from './spine-core/TextureAtlas';
// import { AtlasAttachmentLoader } from './spine-core/AtlasAttachmentLoader';
// import { SkeletonJson } from './spine-core/SkeletonJson';
// import { Skeleton } from './spine-core/Skeleton';
// import { Vector2 } from './spine-core/Utils';
// import { AnimationState } from './spine-core/AnimationState';
// import { AnimationStateData } from './spine-core/AnimationStateData';
import SpineCanvas from './spine-canvas';

const { TextureAtlas, AtlasAttachmentLoader, SkeletonJson, Skeleton, Vector2, AnimationState, AnimationStateData } = SpineCanvas;
const { SkeletonRenderer, AssetManager } = SpineCanvas.canvas;


// 储存全局的spine渲染器的对象。在一个karas场景里面，n个spine元素使用同一个渲染器。一个页面可以有n个karas场景，根据canvas上下文唯一确定渲染器
const GlobalSpineRendererMap = new WeakMap();

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
export default class Spine38Canvas extends karas.Component {

  verticesData = [];
  renderer = null;
  isParsed = false;

  lastTime = Date.now();
  currentTime = Date.now();

  constructor(props) {
    super(props);

    this.animationName = props.animation || 'idle';
    this.skinName = props.skin || 'default';
    this.loopCount = props.loopCount || Infinity;
    // 一开始就先加载资源
    this.load();
  }

  shouldComponentUpdate() {
    return false;
  }

  playAnimation = (animationName = this.animationName, loop = this.loopCount, skinName = this.skinName) => {
    this.loopCount = loop;
    let data = this.loadSkeleton(animationName, skinName); // 默认的骨骼动画名称和皮肤名称

    this.state = data.state;
    this.skeleton = data.skeleton;
    this.bounds = data.bounds;
    this.isParsed = true;
    this.lastTime = Date.now() / 1000;
    this.currentTime = Date.now() / 1000;
    this.animationsList = data.animations;
  }

  load() {
    this.assetManager = new AssetManager();
    this.assetManager.loadText(this.props.atlas);
    this.assetManager.loadText(this.props.json);
    if (typeof this.props.image === 'string') {
      this.assetManager.loadTexture(this.props.image);
    } else {
      for (let item of this.props.image) {
        this.assetManager.loadTexture(item);
      }
    }

    let i = setInterval(() => {
      if (this.assetManager.isLoadingComplete()) {
        clearInterval(i);
        this.props.onLoad?.();
        this.playAnimation();
      }
    }, 1000);
  }

  initRender(ctx) {
    this.ctx = ctx;
    this.renderer = GlobalSpineRendererMap.get(this.ctx);
    if (!this.renderer) {
      this.renderer = new SkeletonRenderer(ctx);
      this.renderer.triangleRendering = true;
      GlobalSpineRendererMap.set(this.ctx, this.renderer);
    }
  }

  componentDidMount() {
    let fake = this.ref.fake;
    fake.clearAnimate();

    this.animation = fake.animate([
      {
        backgroundColor: '#000',
      },
      {
        backgroundColor: '#fff',
      },
    ], {
      fps: this.props.fps || 60,
      duration: 10000,
      iterations: Infinity,
    });

    let isRender, self = this;

    fake.render = (renderMode, lv, ctx) => {
      if (!this.bounds) {
        return
      }
      if(!isRender) {
        isRender = true;
        self.props.onRender?.();
      }
      let fitSize = this.props.fitSize;
      let size = fake.getComputedStyle(['width', 'height']);
      // console.log(size)
      let x = this.bounds.offset.x;
      let y = this.bounds.offset.y;
      let width = this.bounds.size.x;
      let height = this.bounds.size.y;
      let centerX = x + width * 0.5;
      let centerY = y + height * 0.5;
      // let matrix = mesh.matrixEvent;
      this.currentTime = Date.now() / 1000;

      let delta = this.currentTime - this.lastTime;
      this.lastTime = this.currentTime;
      // matrix4转matrix2_3
      // ctx.setTransform(matrix[0], matrix[1], matrix[4], matrix[5], matrix[12] + (this.bounds?.size.x || 0) * matrix[0], matrix[13] + (this.bounds?.size.y || 0) * matrix[5]);
      ctx.translate(fake.sx, fake.sy);
      let scale = 1;
      if (fitSize) {
        let scx = width / size.width;
        let scy = height / size.height;
        scale = fitSize === 'cover' ? Math.min(scx, scy) : Math.max(scx, scy);
        if (scale !== 1) {
          ctx.scale(1 / scale, 1 / scale);
        }

        // console.log(scale, size)
      }
      ctx.translate(-centerX, -centerY);
      ctx.translate(size.width * 0.5 * scale, size.height * 0.5 * scale);

      if (!this.renderer) {
        this.initRender(ctx);
      }
      if (this.isParsed) {
        if (this.props.debug) {
          this.renderer.debugRendering = true;
        }
        if (this.props.triangle) {
          this.renderer.triangleRendering = true;
        }
        this.state.update(delta);
        this.state.apply(this.skeleton);
        this.skeleton.updateWorldTransform();
        this.renderer.draw(this.skeleton);
        let repeatRender = this.props.repeatRender;
        if(repeatRender) {
          this.renderer.draw(this.skeleton);
          let n = parseInt(repeatRender) || 0;
          while(n > 1) {
            n--;
            this.renderer.draw(this.skeleton);
          }
        }
      }
      // debugger
      this.props.onFrame?.();
    };
  }

  loadSkeleton(initialAnimation, skin) {
    if (skin === undefined) skin = "default";
    let assetManager = this.assetManager;
    let atlas = new TextureAtlas(assetManager.get(this.props.atlas), (path) => {
      return assetManager.get(path);
    });

    let atlasLoader = new AtlasAttachmentLoader(atlas);
    var skeletonJson = new SkeletonJson(atlasLoader);

    var skeletonData = skeletonJson.readSkeletonData(assetManager.get(this.props.json));
    var skeleton = new Skeleton(skeletonData);
    skeleton.scaleY = -1;
    var bounds = calculateBounds(skeleton);
    skeleton.setSkinByName(skin);


    var animationState = new AnimationState(new AnimationStateData(skeleton.data));
    animationState.setAnimation(0, initialAnimation, 0);
    this.props.onStart?.(initialAnimation, this.loopCount);
    animationState.addListener({
      complete: () => {
        this.loopCount--;
        this.props.onLoop?.(initialAnimation, this.loopCount);

        if (this.loopCount > 0) {
          animationState.setAnimation(0, initialAnimation, 0);
        } else {
          this.props.onEnd?.(initialAnimation);
          animationState.setAnimation(0, this.props.animation, 0);
        }
      },
    })

    return { skeleton: skeleton, state: animationState, bounds: bounds };
  }

  render() {
    return karas.parse({
      tagName: 'div',
      props: {
        style: {
          ...(this.props.style || {})
        },
        ref: "mesh"
      },
      children: [
        {
          tagName: '$polygon',
          props: {
            ref: "fake",
            style: {
              width: '100%',
              height: '100%',
            }
          }
        }
      ]
    });
    // return <div ref="mesh" style={this.props.style || {}}>
    //   <$polyline ref="fake" style={{
    //     width: '100%',
    //     height: '100%',
    //   }} />
    // </div>;;
  }
}

function calculateBounds(skeleton) {
  skeleton.setToSetupPose();
  skeleton.updateWorldTransform();
  var offset = new Vector2();
  var size = new Vector2();
  skeleton.getBounds(offset, size, []);
  return { offset: offset, size: size };
}

