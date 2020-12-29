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
    let { atlas, json, tex, skelName, animName, fitSize } = props;
    let fake = this.ref.fake;
    // let originRender = fake.render;
    let assetManager = new spineCanvas.canvas.AssetManager();
    assetManager.loadText(atlas);
    assetManager.loadText(json);
    assetManager.loadTexture(tex);

    let frame = () => {
      if(assetManager.isLoadingComplete()) {
        karas.animate.frame.offFrame(frame);
        let data = util.loadSkeleton(assetManager, skelName, animName, 'default', atlas, json, tex);
        let state = data.state;
        let skeleton = data.skeleton;
        let width = data.bounds.size.x;
        let height = data.bounds.size.y;

        let last;
        let skeletonRenderer;

        fake.render = (renderMode, lv, ctx) => {
          if(!skeletonRenderer) {
            skeletonRenderer = new spineCanvas.canvas.SkeletonRenderer(ctx);
            if(props.debug) {
              skeletonRenderer.debugRendering = true;
            }
          }
          let now = karas.animate.frame.__now;
          let delta = (now - last) / 1000;
          last = now;

          if(fitSize) {
            let size = fake.getComputedStyle(['width', 'height']);
            let scx = size.width / width;
            let scy = size.height / height;
            let min = Math.min(scx, scy);
            if(min !== 1) {
              ctx.transform(min, 0, 0, min, 0, 0);
            }
          }

          state.update(delta);
          state.apply(skeleton);
          skeleton.updateWorldTransform();
          skeletonRenderer.draw(skeleton);
        };
        fake.clearAnimate();
        fake.animate([
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
        last = karas.animate.frame.__now;
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
                   translateX: '50%',
                   visibility: 'hidden',
                 }}/>
    </div>;
  }
}

Spine.version = version;

export default Spine;
