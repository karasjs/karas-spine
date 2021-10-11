/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated January 1, 2020. Replaces all prior versions.
 *
 * Copyright (c) 2013-2020, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/
import { Color } from "./Utils";
/** Stores the setup pose for a {@link Bone}. */
export class BoneData {
    constructor(index, name, parent) {
        /** The local x translation. */
        this.x = 0;
        /** The local y translation. */
        this.y = 0;
        /** The local rotation. */
        this.rotation = 0;
        /** The local scaleX. */
        this.scaleX = 1;
        /** The local scaleY. */
        this.scaleY = 1;
        /** The local shearX. */
        this.shearX = 0;
        /** The local shearX. */
        this.shearY = 0;
        /** The transform mode for how parent world transforms affect this bone. */
        this.transformMode = TransformMode.Normal;
        /** When true, {@link Skeleton#updateWorldTransform()} only updates this bone if the {@link Skeleton#skin} contains this
          * bone.
          * @see Skin#bones */
        this.skinRequired = false;
        /** The color of the bone as it was in Spine. Available only when nonessential data was exported. Bones are not usually
         * rendered at runtime. */
        this.color = new Color();
        if (index < 0)
            throw new Error("index must be >= 0.");
        if (!name)
            throw new Error("name cannot be null.");
        this.index = index;
        this.name = name;
        this.parent = parent;
    }
}
/** Determines how a bone inherits world transforms from parent bones. */
export var TransformMode;
(function (TransformMode) {
    TransformMode[TransformMode["Normal"] = 0] = "Normal";
    TransformMode[TransformMode["OnlyTranslation"] = 1] = "OnlyTranslation";
    TransformMode[TransformMode["NoRotationOrReflection"] = 2] = "NoRotationOrReflection";
    TransformMode[TransformMode["NoScale"] = 3] = "NoScale";
    TransformMode[TransformMode["NoScaleOrReflection"] = 4] = "NoScaleOrReflection";
})(TransformMode || (TransformMode = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm9uZURhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvQm9uZURhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRS9FLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFFaEMsZ0RBQWdEO0FBQ2hELE1BQU0sT0FBTyxRQUFRO0lBOENwQixZQUFhLEtBQWEsRUFBRSxJQUFZLEVBQUUsTUFBZ0I7UUFqQzFELCtCQUErQjtRQUMvQixNQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRU4sK0JBQStCO1FBQy9CLE1BQUMsR0FBRyxDQUFDLENBQUM7UUFFTiwwQkFBMEI7UUFDMUIsYUFBUSxHQUFHLENBQUMsQ0FBQztRQUViLHdCQUF3QjtRQUN4QixXQUFNLEdBQUcsQ0FBQyxDQUFDO1FBRVgsd0JBQXdCO1FBQ3hCLFdBQU0sR0FBRyxDQUFDLENBQUM7UUFFWCx3QkFBd0I7UUFDeEIsV0FBTSxHQUFHLENBQUMsQ0FBQztRQUVYLHdCQUF3QjtRQUN4QixXQUFNLEdBQUcsQ0FBQyxDQUFDO1FBRVgsMkVBQTJFO1FBQzNFLGtCQUFhLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQztRQUVyQzs7OEJBRXNCO1FBQ3RCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBRXJCO2tDQUMwQjtRQUMxQixVQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUduQixJQUFJLEtBQUssR0FBRyxDQUFDO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3RELElBQUksQ0FBQyxJQUFJO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3RCLENBQUM7Q0FDRDtBQUVELHlFQUF5RTtBQUN6RSxNQUFNLENBQU4sSUFBWSxhQUErRjtBQUEzRyxXQUFZLGFBQWE7SUFBRyxxREFBTSxDQUFBO0lBQUUsdUVBQWUsQ0FBQTtJQUFFLHFGQUFzQixDQUFBO0lBQUUsdURBQU8sQ0FBQTtJQUFFLCtFQUFtQixDQUFBO0FBQUMsQ0FBQyxFQUEvRixhQUFhLEtBQWIsYUFBYSxRQUFrRiJ9