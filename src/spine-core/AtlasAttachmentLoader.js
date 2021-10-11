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
import { BoundingBoxAttachment } from "./attachments/BoundingBoxAttachment";
import { ClippingAttachment } from "./attachments/ClippingAttachment";
import { MeshAttachment } from "./attachments/MeshAttachment";
import { PathAttachment } from "./attachments/PathAttachment";
import { PointAttachment } from "./attachments/PointAttachment";
import { RegionAttachment } from "./attachments/RegionAttachment";
/** An {@link AttachmentLoader} that configures attachments using texture regions from an {@link TextureAtlas}.
 *
 * See [Loading skeleton data](http://esotericsoftware.com/spine-loading-skeleton-data#JSON-and-binary-data) in the
 * Spine Runtimes Guide. */
export class AtlasAttachmentLoader {
    constructor(atlas) {
        this.atlas = atlas;
    }
    newRegionAttachment(skin, name, path) {
        let region = this.atlas.findRegion(path);
        if (!region)
            throw new Error("Region not found in atlas: " + path + " (region attachment: " + name + ")");
        region.renderObject = region;
        let attachment = new RegionAttachment(name);
        attachment.setRegion(region);
        return attachment;
    }
    newMeshAttachment(skin, name, path) {
        let region = this.atlas.findRegion(path);
        if (!region)
            throw new Error("Region not found in atlas: " + path + " (mesh attachment: " + name + ")");
        region.renderObject = region;
        let attachment = new MeshAttachment(name);
        attachment.region = region;
        return attachment;
    }
    newBoundingBoxAttachment(skin, name) {
        return new BoundingBoxAttachment(name);
    }
    newPathAttachment(skin, name) {
        return new PathAttachment(name);
    }
    newPointAttachment(skin, name) {
        return new PointAttachment(name);
    }
    newClippingAttachment(skin, name) {
        return new ClippingAttachment(name);
    }
}