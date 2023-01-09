// karas画mesh的插件
import karas from 'karas';
import SpineCanvas from './spine-canvas';

const {
  TextureAtlas,
  AtlasAttachmentLoader,
  SkeletonJson,
  Skeleton,
  Vector2,
  AnimationState,
  AnimationStateData
} = SpineCanvas;
const { SkeletonRenderer, AssetManager } = SpineCanvas.canvas;

// 储存全局的spine渲染器的对象。在一个karas场景里面，n个spine元素使用同一个渲染器。一个页面可以有n个karas场景，根据canvas上下文唯一确定渲染器
const GlobalSpineRendererMap = new WeakMap();

class $ extends karas.Geom {
  calContent(currentStyle, computedStyle) {
    let res = super.calContent(currentStyle, computedStyle);
    if(res) {
      return res;
    }
    // 强制占位，防止离屏bbox空没尺寸
    return true;
  }
  render(renderMode, ctx, dx, dy) {
    if(!this.bounds) {
      return;
    }
    if(!this.renderer) {
      this.renderer = GlobalSpineRendererMap.get(ctx);
      if(!this.renderer) {
        this.renderer = new SkeletonRenderer(ctx);
        GlobalSpineRendererMap.set(ctx, this.renderer);
      }
      this.renderer.debugRendering = !!this.props.debug;
      this.renderer.triangleRendering = !!this.props.triangle;
      this.props.onRender?.();
    }

    this.currentTime = Date.now() * 0.001;
    let delta = this.currentTime - this.lastTime;
    if(this.playbackRate && this.playbackRate !== 1) {
      delta *= this.playbackRate;
    }
    this.lastTime = this.currentTime;

    let fitSize = this.props.fitSize;
    let x = this.bounds.offset.x;
    let y = this.bounds.offset.y;
    let width = this.bounds.size.x;
    let height = this.bounds.size.y;
    let centerX = x + width * 0.5;
    let centerY = y + height * 0.5;

    ctx.translate(this.x + dx, this.y + dy);
    let scx = width / this.width;
    let scy = height / this.height;
    let scale = fitSize === 'cover' ? Math.min(scx, scy) : Math.max(scx, scy);
    if(scale !== 1) {
      ctx.scale(1 / scale, 1 / scale);
    }
    ctx.translate(-centerX, -centerY);
    ctx.translate(this.width * 0.5 * scale, this.height * 0.5 * scale);

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
    this.props.onFrame?.();
  }
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
export default class Spine38Canvas extends karas.Component {
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

  load() {
    let assetManager = this.assetManager = new AssetManager();
    assetManager.loadText(this.props.atlas);
    assetManager.loadText(this.props.json);
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
    this.load();

    let fake = this.ref.fake;
    fake.frameAnimate(() => {
      if(this.isPlay) {
        fake.refresh();
      }
    });
  }

  componentWillUnmount() {
    this.ref.fake.bounds = null;
  }

  loadSkeleton(initialAnimation, skin) {
    if(skin === undefined || skin === null) {
      skin = 'default';
    }
    let mapping = this.mapping;
    let assetManager = this.assetManager;
    let atlas = new TextureAtlas(assetManager.get(this.props.atlas), (path) => {
      let res = assetManager.get(path);
      // 找不到资源，atlas中图片名不对应
      if(!res) {
        // 只有1个，可以无视，直接对上
        if(!mapping) {
          res = assetManager.get(this.props.image);
        }
        // 多个的话，传入的是个对象，自带映射关系
        else {
          let url = mapping[path];
          res = assetManager.get(url);
        }
      }
      return res;
    });

    let atlasLoader = new AtlasAttachmentLoader(atlas);
    let skeletonJson = new SkeletonJson(atlasLoader);

    let skeletonData = skeletonJson.readSkeletonData(assetManager.get(this.props.json));
    let skeleton = new Skeleton(skeletonData);
    skeleton.scaleY = -1;
    let bounds = calculateBounds(skeleton);
    skeleton.setSkinByName(skin);
    if(!initialAnimation) {
      initialAnimation = skeletonData.animations[0].name;
    }

    let animationStateData = new AnimationStateData(skeleton.data);
    let animationState = new AnimationState(animationStateData);
    let listener = this.loadFin(animationState, initialAnimation);

    return { skeleton: skeleton, state: animationState, stateDate: animationStateData, bounds: bounds, listener };
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
          this.isPlay = false;
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
         fitSize={this.props.fitSize}
         triangle={this.props.triangle}
         repeatRender={this.props.repeatRender}
         onFrame={this.props.onFrame}
         onRender={this.props.onRender}/>
    </div>;
  }

  pause() {
    this.isPlay = false;
  }

  resume() {
    this.isPlay = true;
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
  return { offset, size };
}

