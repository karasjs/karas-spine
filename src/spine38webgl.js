// karas画mesh的插件
import karas from 'karas';
import SpineWebGL from './spine-webgl';

const { AtlasAttachmentLoader, SkeletonJson, Skeleton, Vector2, AnimationState, AnimationStateData } = SpineWebGL;
const { SkeletonRenderer, AssetManager, Shader, PolygonBatcher, Matrix4 } = SpineWebGL.webgl;


// 储存全局的spine渲染器的对象。在一个karas场景里面，n个spine元素使用同一个渲染器。一个页面可以有n个karas场景，根据canvas上下文唯一确定渲染器
const GlobalSpineRendererMap = new WeakMap();

const {
  mode: {
    CANVAS,
    WEBGL,
  },
} = karas;

class $ extends karas.Geom {
  calContent(currentStyle, computedStyle) {
    let res = super.calContent(currentStyle, computedStyle);
    if(res) {
      return res;
    }
    return true;
  }
  render() {}
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

  verticesData = [];
  renderer = null;
  isParsed = false;
  lastTime = Date.now();
  currentTime = Date.now();
  mvp = new Matrix4();

  constructor(props) {
    super(props);

    this.animationName = props.animation || 'idle';
    this.skinName = props.skin || 'default';
    this.loopCount = props.loopCount || Infinity;
    // 一开始就先加载资源
    // this.load();
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
    this.assetManager.loadTextureAtlas(this.props.atlas, this.props.image, () => { }, (e) => {
      this.props.onError?.(e);
    });
    this.assetManager.loadText(this.props.json, () => { }, (e) => {
      this.props.onError?.(e);
    });
    if (typeof this.props.image === 'string') {
      this.assetManager.loadTexture(this.props.image, () => { }, (e) => {
        this.props.onError?.(e);
      });
    } else {
      for (let item of this.props.image) {
        this.assetManager.loadTexture(item, () => { }, (e) => {
          this.props.onError?.(e);
        });
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

  initRender(ctx, unit) {
    this.ctx = ctx;
    this.renderer = GlobalSpineRendererMap.get(this.ctx);
    if (!this.renderer) {
      this.renderer = new SkeletonRenderer(ctx);
      this.shader = Shader.newTwoColoredTextured(ctx);
      this.mvp.ortho2d(0, 0, ctx.canvas.width - 1, ctx.canvas.height - 1);

      this.batcher = new PolygonBatcher(ctx);
      this.assetManager = new AssetManager(ctx, undefined, false, unit);
      this.load();

      GlobalSpineRendererMap.set(this.ctx, this.renderer);
    }
  }

  resize(canvas, ctx) {
    var bounds = this.bounds;

    // magic
    var centerX = bounds.offset.x + bounds.size.x / 2;
    var centerY = bounds.offset.y + bounds.size.y / 2;
    var width = canvas.width;
    var height = canvas.height;

    this.mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
  }

  componentDidMount() {
    let fake = this.ref.fake;

    fake.frameAnimate(function(){
      fake.refresh();
    });

    let isRender, self = this;

    fake.render = (renderMode, ctx, dx, dy) => {
      if(renderMode === WEBGL) {
        if(!this.renderer) {
          this.initRender(ctx, 0);
        }
        if(!this.bounds) {
          return
        }
        if(!isRender) {
          isRender = true;
          self.props.onRender?.();
        }
        this.resize(ctx.canvas, ctx);

        this.currentTime = Date.now() / 1000;

        let delta = this.currentTime - this.lastTime;

        this.lastTime = this.currentTime;
        let bounds = this.bounds;
        let size = bounds.size, offset = bounds.offset;
        let x = offset.x;
        let y = offset.y;
        let width = size.x;
        let height = size.y;
        let centerX = x + width * 0.5;
        let centerY = y + height * 0.5;

        let scale = 1;
        let fitSize = this.props.fitSize;
        if (fitSize) {
          let scx = width / fake.width;
          let scy = height / fake.height;
          scale = fitSize === 'cover' ? Math.min(scx, scy) : Math.max(scx, scy);
          if (scale !== 1) {
            let tfo = [centerX * 2 / ctx.canvas.width, centerY * 2 / ctx.canvas.height];
            this.mvp.translate(tfo[0], tfo[1], 0);
            let m = karas.math.matrix.identity();
            m[0] = 1 / scale;
            m[5] = 1 / scale;
            this.mvp.multiply({values:m});
            this.mvp.translate(-tfo[0] / scale, -tfo[1] / scale, 0);
            this.mvp.translate(-1 + (fake.width * 0.5 + fake.x + dx) * 2 / ctx.canvas.width, 1 - (fake.height * 0.5 +fake.y + dy) * 2 / ctx.canvas.height, 0);
          }
        }
        else {
          this.mvp.translate(-1 + (fake.width * 0.5 + fake.x + dx) * 2 / ctx.canvas.width, 1 - (fake.height * 0.5 + fake.y * 2 + dy) / ctx.canvas.height, 0);
        }

        // let pm = fake.matrixEvent;
        // if(!karas.math.matrix.isE(pm)) {
        //   pm = pm.slice(0);
        //   pm[12] /= ctx.canvas.width;
        //   pm[13] /= ctx.canvas.height;
        // }

        this.state.update(delta);
        this.state.apply(this.skeleton);
        this.skeleton.updateWorldTransform();

        // Bind the shader and set the texture and model-view-projection matrix.
        this.shader.bind();
        this.shader.setUniformi(Shader.SAMPLER, 0);
        this.shader.setUniform4x4f(Shader.MVP_MATRIX, this.mvp.values);

        // Start the batch and tell the SkeletonRenderer to render the active skeleton.
        if(!this.batcher.isDrawing) {
          this.batcher.begin(this.shader);
        }

        this.renderer.premultipliedAlpha = false;
        this.renderer.draw(this.batcher, this.skeleton);
        // this.batcher.end();

        this.shader.unbind();

        // console.warn(ctx.program);
        ctx.useProgram(ctx.program);
        // debugger

        this.props.onFrame?.();
      }
    };
  }

  loadSkeleton(initialAnimation, skin) {
    if (skin === undefined) skin = "default";

    // Load the texture atlas using name.atlas from the AssetManager.
    var atlas = this.assetManager.get(this.props.atlas);

    // Create a AtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
    var atlasLoader = new AtlasAttachmentLoader(atlas);

    // Create a SkeletonBinary instance for parsing the .skel file.
    var skeletonBinary = new SkeletonJson(atlasLoader);

    // Set the scale to apply during parsing, parse the file, and create a new skeleton.
    var skeletonData = skeletonBinary.readSkeletonData(this.assetManager.get(this.props.json));
    this.skeleton = new Skeleton(skeletonData);
    this.skeleton.setSkinByName(skin);
    var bounds = calculateBounds(this.skeleton);

    // Create an AnimationState, and set the initial animation in looping mode.
    var animationStateData = new AnimationStateData(this.skeleton.data);
    var animationState = new AnimationState(animationStateData);
    animationState.setAnimation(0, initialAnimation, true);
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
    });

    // Pack everything up and return to caller.
    return { skeleton: this.skeleton, state: animationState, bounds };
  }

  render() {
    return <div ref="mesh" style={this.props.style || {}}>
      <$ ref="fake" style={{
        width: '100%',
        height: '100%',
      }}/>
    </div>;
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

