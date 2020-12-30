import spine from './spine-canvas';

function calculateBounds(skeleton) {
  // let data = skeleton.data;
  skeleton.setToSetupPose();
  skeleton.updateWorldTransform();
  let offset = new spine.Vector2();
  let size = new spine.Vector2();
  skeleton.getBounds(offset, size, []);
  return { offset: offset, size: size };
}

function loadSkeleton(assetManager, initialAnimation, skin, atlasUrl, jsonUrl, texUrl) {
  if(skin === undefined) {
    skin = 'default';
  }

  // Load the texture atlas using name.atlas and name.png from the AssetManager.
  // The function passed to TextureAtlas is used to resolve relative paths.
  let atlas = new spine.TextureAtlas(assetManager.get(atlasUrl), function(path) {
    return assetManager.get(path);
  });

  // Create a AtlasAttachmentLoader, which is specific to the WebGL backend.
  let atlasLoader = new spine.AtlasAttachmentLoader(atlas);

  // Create a SkeletonJson instance for parsing the .json file.
  let skeletonJson = new spine.SkeletonJson(atlasLoader);

  // Set the scale to apply during parsing, parse the file, and create a new skeleton.
  let skeletonData = skeletonJson.readSkeletonData(assetManager.get(jsonUrl));
  let skeleton = new spine.Skeleton(skeletonData);
  skeleton.scaleY = -1;
  let bounds = calculateBounds(skeleton);
  skeleton.setSkinByName(skin);

  // Create an AnimationState, and set the initial animation in looping mode.
  let animationState = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));
  animationState.setAnimation(0, initialAnimation, true);
  animationState.addListener({
    event: function(trackIndex, event) {
      // console.log('Event on track ' + trackIndex + ': ' + JSON.stringify(event));
    },
    complete: function(trackIndex, loopCount) {
      // console.log('Animation on track ' + trackIndex + ' completed, loop count: ' + loopCount);
    },
    start: function(trackIndex) {
      // console.log('Animation on track ' + trackIndex + ' started');
    },
    end: function(trackIndex) {
      // console.log('Animation on track ' + trackIndex + ' ended');
    }
  })

  // Pack everything up and return to caller.
  return { skeleton: skeleton, state: animationState, bounds: bounds };
}

export default {
  loadSkeleton,
};
