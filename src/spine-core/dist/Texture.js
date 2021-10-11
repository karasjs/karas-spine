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
export class Texture {
    constructor(image) {
        this._image = image;
    }
    getImage() {
        return this._image;
    }
}
export var TextureFilter;
(function (TextureFilter) {
    TextureFilter[TextureFilter["Nearest"] = 9728] = "Nearest";
    TextureFilter[TextureFilter["Linear"] = 9729] = "Linear";
    TextureFilter[TextureFilter["MipMap"] = 9987] = "MipMap";
    TextureFilter[TextureFilter["MipMapNearestNearest"] = 9984] = "MipMapNearestNearest";
    TextureFilter[TextureFilter["MipMapLinearNearest"] = 9985] = "MipMapLinearNearest";
    TextureFilter[TextureFilter["MipMapNearestLinear"] = 9986] = "MipMapNearestLinear";
    TextureFilter[TextureFilter["MipMapLinearLinear"] = 9987] = "MipMapLinearLinear"; // WebGLRenderingContext.LINEAR_MIPMAP_LINEAR
})(TextureFilter || (TextureFilter = {}));
export var TextureWrap;
(function (TextureWrap) {
    TextureWrap[TextureWrap["MirroredRepeat"] = 33648] = "MirroredRepeat";
    TextureWrap[TextureWrap["ClampToEdge"] = 33071] = "ClampToEdge";
    TextureWrap[TextureWrap["Repeat"] = 10497] = "Repeat"; // WebGLRenderingContext.REPEAT
})(TextureWrap || (TextureWrap = {}));
export class TextureRegion {
    constructor() {
        this.u = 0;
        this.v = 0;
        this.u2 = 0;
        this.v2 = 0;
        this.width = 0;
        this.height = 0;
        this.degrees = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.originalWidth = 0;
        this.originalHeight = 0;
    }
}
export class FakeTexture extends Texture {
    setFilters(minFilter, magFilter) { }
    setWraps(uWrap, vWrap) { }
    dispose() { }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGV4dHVyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9UZXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0VBMkIrRTtBQUUvRSxNQUFNLE9BQWdCLE9BQU87SUFHNUIsWUFBYSxLQUFxQztRQUNqRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztJQUNyQixDQUFDO0lBRUQsUUFBUTtRQUNQLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNwQixDQUFDO0NBS0Q7QUFFRCxNQUFNLENBQU4sSUFBWSxhQVFYO0FBUkQsV0FBWSxhQUFhO0lBQ3hCLDBEQUFjLENBQUE7SUFDZCx3REFBYSxDQUFBO0lBQ2Isd0RBQWEsQ0FBQTtJQUNiLG9GQUEyQixDQUFBO0lBQzNCLGtGQUEwQixDQUFBO0lBQzFCLGtGQUEwQixDQUFBO0lBQzFCLGdGQUF5QixDQUFBLENBQUMsNkNBQTZDO0FBQ3hFLENBQUMsRUFSVyxhQUFhLEtBQWIsYUFBYSxRQVF4QjtBQUVELE1BQU0sQ0FBTixJQUFZLFdBSVg7QUFKRCxXQUFZLFdBQVc7SUFDdEIscUVBQXNCLENBQUE7SUFDdEIsK0RBQW1CLENBQUE7SUFDbkIscURBQWMsQ0FBQSxDQUFDLCtCQUErQjtBQUMvQyxDQUFDLEVBSlcsV0FBVyxLQUFYLFdBQVcsUUFJdEI7QUFFRCxNQUFNLE9BQU8sYUFBYTtJQUExQjtRQUVDLE1BQUMsR0FBRyxDQUFDLENBQUM7UUFBQyxNQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsT0FBRSxHQUFHLENBQUMsQ0FBQztRQUFDLE9BQUUsR0FBRyxDQUFDLENBQUM7UUFDZixVQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQUMsV0FBTSxHQUFHLENBQUMsQ0FBQztRQUN0QixZQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ1osWUFBTyxHQUFHLENBQUMsQ0FBQztRQUFDLFlBQU8sR0FBRyxDQUFDLENBQUM7UUFDekIsa0JBQWEsR0FBRyxDQUFDLENBQUM7UUFBQyxtQkFBYyxHQUFHLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBQUE7QUFFRCxNQUFNLE9BQU8sV0FBWSxTQUFRLE9BQU87SUFDdkMsVUFBVSxDQUFFLFNBQXdCLEVBQUUsU0FBd0IsSUFBSSxDQUFDO0lBQ25FLFFBQVEsQ0FBRSxLQUFrQixFQUFFLEtBQWtCLElBQUksQ0FBQztJQUNyRCxPQUFPLEtBQU0sQ0FBQztDQUNkIn0=