import karas from 'karas';
import spineCanvas from './spine-canvas';
import util from './util';
import { version } from '../package.json';

class Spine extends karas.Component {
  componentDidMount() {
    this.init();
  }

  shouldComponentUpdate() {
    return false;
  }

  init() {
    let props = this.props;
    let { atlas, json, tex, animName, fitSize, pause } = props;
    let fake = this.ref.fake;
    // let originRender = fake.render;
    let assetManager = new spineCanvas.canvas.AssetManager();
    assetManager.loadText(atlas);
    assetManager.loadText(json);
    assetManager.loadTexture(tex);

    let last;
    let a = this.animation = fake.animate([
      {
        backgroundColor: '#000',
      },
      {
        backgroundColor: '#FFF',
      },
    ], {
      duration: 1000,
      iterations: Infinity,
    });
    if(pause) {
      a.pause();
    }
    a.on('play', function() {
      last = karas.animate.frame.__now;
    });

    let frame = () => {
      if(assetManager.isLoadingComplete()) {
        karas.animate.frame.offFrame(frame);
        let data = util.loadSkeleton(assetManager, animName, 'default', atlas, json, tex);
        let state = data.state;
        let skeleton = data.skeleton;
        let bounds = data.bounds;
        let x = bounds.offset.x;
        let y = bounds.offset.y;
        let width = data.bounds.size.x;
        let height = data.bounds.size.y;
        let centerX = x + width * 0.5;
        let centerY = y + height * 0.5;

        last = karas.animate.frame.__now;
        let skeletonRenderer;

        fake.render = (renderMode, lv, ctx) => {
          if(!skeletonRenderer) {
            skeletonRenderer = new spineCanvas.canvas.SkeletonRenderer(ctx);
            if(props.debugRendering) {
              skeletonRenderer.debugRendering = true;
            }
            if(props.triangleRendering) {
              skeletonRenderer.triangleRendering = true;
            }
          }
          let now = karas.animate.frame.__now;
          let delta = (now - last) / 1000;
          last = now;
          if(a && a.pending) {
            delta = 0;
          }

          let size = fake.getComputedStyle(['width', 'height']);
          ctx.translate(fake.sx, fake.sy);
          let scale = 1;
          if(fitSize) {
            let scx = width / size.width;
            let scy = height / size.height;
            scale = fitSize === 'cover' ? Math.min(scx, scy) : Math.max(scx, scy);
            if(scale !== 1) {
              ctx.scale(1 / scale, 1 / scale);
            }
          }
          ctx.translate(-centerX, -centerY);
          ctx.translate(size.width * 0.5 * scale, size.height * 0.5 * scale);

          delta && state.update(delta);
          state.apply(skeleton);
          skeleton.updateWorldTransform();
          skeletonRenderer.draw(skeleton);
        };
        fake.clearAnimate();
      }
    }
    karas.animate.frame.onFrame(frame);
  }

  render() {
    return <div>
      <$polyline ref="fake"
                 style={{
                   width: '100%',
                   height: '100%',
                   // translateX: '50%',
                   visibility: 'hidden',
                 }}/>
    </div>;
  }
}

Spine.version = version;

export default Spine;
