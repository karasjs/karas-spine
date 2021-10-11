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
import { TransformMode } from "./BoneData";
import { MathUtils } from "./Utils";
/** Stores the current pose for an IK constraint. An IK constraint adjusts the rotation of 1 or 2 constrained bones so the tip of
 * the last bone is as close to the target bone as possible.
 *
 * See [IK constraints](http://esotericsoftware.com/spine-ik-constraints) in the Spine User Guide. */
export class IkConstraint {
    constructor(data, skeleton) {
        /** Controls the bend direction of the IK bones, either 1 or -1. */
        this.bendDirection = 0;
        /** When true and only a single bone is being constrained, if the target is too close, the bone is scaled to reach it. */
        this.compress = false;
        /** When true, if the target is out of range, the parent bone is scaled to reach it. If more than one bone is being constrained
         * and the parent bone has local nonuniform scale, stretch is not applied. */
        this.stretch = false;
        /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
        this.mix = 1;
        /** For two bone IK, the distance from the maximum reach of the bones that rotation will slow. */
        this.softness = 0;
        this.active = false;
        if (!data)
            throw new Error("data cannot be null.");
        if (!skeleton)
            throw new Error("skeleton cannot be null.");
        this.data = data;
        this.mix = data.mix;
        this.softness = data.softness;
        this.bendDirection = data.bendDirection;
        this.compress = data.compress;
        this.stretch = data.stretch;
        this.bones = new Array();
        for (let i = 0; i < data.bones.length; i++)
            this.bones.push(skeleton.findBone(data.bones[i].name));
        this.target = skeleton.findBone(data.target.name);
    }
    isActive() {
        return this.active;
    }
    update() {
        if (this.mix == 0)
            return;
        let target = this.target;
        let bones = this.bones;
        switch (bones.length) {
            case 1:
                this.apply1(bones[0], target.worldX, target.worldY, this.compress, this.stretch, this.data.uniform, this.mix);
                break;
            case 2:
                this.apply2(bones[0], bones[1], target.worldX, target.worldY, this.bendDirection, this.stretch, this.data.uniform, this.softness, this.mix);
                break;
        }
    }
    /** Applies 1 bone IK. The target is specified in the world coordinate system. */
    apply1(bone, targetX, targetY, compress, stretch, uniform, alpha) {
        let p = bone.parent;
        let pa = p.a, pb = p.b, pc = p.c, pd = p.d;
        let rotationIK = -bone.ashearX - bone.arotation, tx = 0, ty = 0;
        switch (bone.data.transformMode) {
            case TransformMode.OnlyTranslation:
                tx = targetX - bone.worldX;
                ty = targetY - bone.worldY;
                break;
            case TransformMode.NoRotationOrReflection:
                let s = Math.abs(pa * pd - pb * pc) / (pa * pa + pc * pc);
                let sa = pa / bone.skeleton.scaleX;
                let sc = pc / bone.skeleton.scaleY;
                pb = -sc * s * bone.skeleton.scaleX;
                pd = sa * s * bone.skeleton.scaleY;
                rotationIK += Math.atan2(sc, sa) * MathUtils.radDeg;
            // Fall through
            default:
                let x = targetX - p.worldX, y = targetY - p.worldY;
                let d = pa * pd - pb * pc;
                tx = (x * pd - y * pb) / d - bone.ax;
                ty = (y * pa - x * pc) / d - bone.ay;
        }
        rotationIK += Math.atan2(ty, tx) * MathUtils.radDeg;
        if (bone.ascaleX < 0)
            rotationIK += 180;
        if (rotationIK > 180)
            rotationIK -= 360;
        else if (rotationIK < -180)
            rotationIK += 360;
        let sx = bone.ascaleX, sy = bone.ascaleY;
        if (compress || stretch) {
            switch (bone.data.transformMode) {
                case TransformMode.NoScale:
                case TransformMode.NoScaleOrReflection:
                    tx = targetX - bone.worldX;
                    ty = targetY - bone.worldY;
            }
            let b = bone.data.length * sx, dd = Math.sqrt(tx * tx + ty * ty);
            if ((compress && dd < b) || (stretch && dd > b) && b > 0.0001) {
                let s = (dd / b - 1) * alpha + 1;
                sx *= s;
                if (uniform)
                    sy *= s;
            }
        }
        bone.updateWorldTransformWith(bone.ax, bone.ay, bone.arotation + rotationIK * alpha, sx, sy, bone.ashearX, bone.ashearY);
    }
    /** Applies 2 bone IK. The target is specified in the world coordinate system.
     * @param child A direct descendant of the parent bone. */
    apply2(parent, child, targetX, targetY, bendDir, stretch, uniform, softness, alpha) {
        let px = parent.ax, py = parent.ay, psx = parent.ascaleX, psy = parent.ascaleY, sx = psx, sy = psy, csx = child.ascaleX;
        let os1 = 0, os2 = 0, s2 = 0;
        if (psx < 0) {
            psx = -psx;
            os1 = 180;
            s2 = -1;
        }
        else {
            os1 = 0;
            s2 = 1;
        }
        if (psy < 0) {
            psy = -psy;
            s2 = -s2;
        }
        if (csx < 0) {
            csx = -csx;
            os2 = 180;
        }
        else
            os2 = 0;
        let cx = child.ax, cy = 0, cwx = 0, cwy = 0, a = parent.a, b = parent.b, c = parent.c, d = parent.d;
        let u = Math.abs(psx - psy) <= 0.0001;
        if (!u || stretch) {
            cy = 0;
            cwx = a * cx + parent.worldX;
            cwy = c * cx + parent.worldY;
        }
        else {
            cy = child.ay;
            cwx = a * cx + b * cy + parent.worldX;
            cwy = c * cx + d * cy + parent.worldY;
        }
        let pp = parent.parent;
        a = pp.a;
        b = pp.b;
        c = pp.c;
        d = pp.d;
        let id = 1 / (a * d - b * c), x = cwx - pp.worldX, y = cwy - pp.worldY;
        let dx = (x * d - y * b) * id - px, dy = (y * a - x * c) * id - py;
        let l1 = Math.sqrt(dx * dx + dy * dy), l2 = child.data.length * csx, a1, a2;
        if (l1 < 0.0001) {
            this.apply1(parent, targetX, targetY, false, stretch, false, alpha);
            child.updateWorldTransformWith(cx, cy, 0, child.ascaleX, child.ascaleY, child.ashearX, child.ashearY);
            return;
        }
        x = targetX - pp.worldX;
        y = targetY - pp.worldY;
        let tx = (x * d - y * b) * id - px, ty = (y * a - x * c) * id - py;
        let dd = tx * tx + ty * ty;
        if (softness != 0) {
            softness *= psx * (csx + 1) * 0.5;
            let td = Math.sqrt(dd), sd = td - l1 - l2 * psx + softness;
            if (sd > 0) {
                let p = Math.min(1, sd / (softness * 2)) - 1;
                p = (sd - softness * (1 - p * p)) / td;
                tx -= p * tx;
                ty -= p * ty;
                dd = tx * tx + ty * ty;
            }
        }
        outer: if (u) {
            l2 *= psx;
            let cos = (dd - l1 * l1 - l2 * l2) / (2 * l1 * l2);
            if (cos < -1) {
                cos = -1;
                a2 = Math.PI * bendDir;
            }
            else if (cos > 1) {
                cos = 1;
                a2 = 0;
                if (stretch) {
                    a = (Math.sqrt(dd) / (l1 + l2) - 1) * alpha + 1;
                    sx *= a;
                    if (uniform)
                        sy *= a;
                }
            }
            else
                a2 = Math.acos(cos) * bendDir;
            a = l1 + l2 * cos;
            b = l2 * Math.sin(a2);
            a1 = Math.atan2(ty * a - tx * b, tx * a + ty * b);
        }
        else {
            a = psx * l2;
            b = psy * l2;
            let aa = a * a, bb = b * b, ta = Math.atan2(ty, tx);
            c = bb * l1 * l1 + aa * dd - aa * bb;
            let c1 = -2 * bb * l1, c2 = bb - aa;
            d = c1 * c1 - 4 * c2 * c;
            if (d >= 0) {
                let q = Math.sqrt(d);
                if (c1 < 0)
                    q = -q;
                q = -(c1 + q) * 0.5;
                let r0 = q / c2, r1 = c / q;
                let r = Math.abs(r0) < Math.abs(r1) ? r0 : r1;
                if (r * r <= dd) {
                    y = Math.sqrt(dd - r * r) * bendDir;
                    a1 = ta - Math.atan2(y, r);
                    a2 = Math.atan2(y / psy, (r - l1) / psx);
                    break outer;
                }
            }
            let minAngle = MathUtils.PI, minX = l1 - a, minDist = minX * minX, minY = 0;
            let maxAngle = 0, maxX = l1 + a, maxDist = maxX * maxX, maxY = 0;
            c = -a * l1 / (aa - bb);
            if (c >= -1 && c <= 1) {
                c = Math.acos(c);
                x = a * Math.cos(c) + l1;
                y = b * Math.sin(c);
                d = x * x + y * y;
                if (d < minDist) {
                    minAngle = c;
                    minDist = d;
                    minX = x;
                    minY = y;
                }
                if (d > maxDist) {
                    maxAngle = c;
                    maxDist = d;
                    maxX = x;
                    maxY = y;
                }
            }
            if (dd <= (minDist + maxDist) * 0.5) {
                a1 = ta - Math.atan2(minY * bendDir, minX);
                a2 = minAngle * bendDir;
            }
            else {
                a1 = ta - Math.atan2(maxY * bendDir, maxX);
                a2 = maxAngle * bendDir;
            }
        }
        let os = Math.atan2(cy, cx) * s2;
        let rotation = parent.arotation;
        a1 = (a1 - os) * MathUtils.radDeg + os1 - rotation;
        if (a1 > 180)
            a1 -= 360;
        else if (a1 < -180) //
            a1 += 360;
        parent.updateWorldTransformWith(px, py, rotation + a1 * alpha, sx, sy, 0, 0);
        rotation = child.arotation;
        a2 = ((a2 + os) * MathUtils.radDeg - child.ashearX) * s2 + os2 - rotation;
        if (a2 > 180)
            a2 -= 360;
        else if (a2 < -180) //
            a2 += 360;
        child.updateWorldTransformWith(cx, cy, rotation + a2 * alpha, child.ascaleX, child.ascaleY, child.ashearX, child.ashearY);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSWtDb25zdHJhaW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0lrQ29uc3RyYWludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytFQTJCK0U7QUFHL0UsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUkzQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBRXBDOzs7cUdBR3FHO0FBQ3JHLE1BQU0sT0FBTyxZQUFZO0lBMkJ4QixZQUFhLElBQXNCLEVBQUUsUUFBa0I7UUFqQnZELG1FQUFtRTtRQUNuRSxrQkFBYSxHQUFHLENBQUMsQ0FBQztRQUVsQix5SEFBeUg7UUFDekgsYUFBUSxHQUFHLEtBQUssQ0FBQztRQUVqQjtxRkFDNkU7UUFDN0UsWUFBTyxHQUFHLEtBQUssQ0FBQztRQUVoQixvR0FBb0c7UUFDcEcsUUFBRyxHQUFHLENBQUMsQ0FBQztRQUVSLGlHQUFpRztRQUNqRyxhQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsV0FBTSxHQUFHLEtBQUssQ0FBQztRQUdkLElBQUksQ0FBQyxJQUFJO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxRQUFRO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNwQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDOUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FB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QUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDcEcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxDQUFDLElBQUksT0FBTyxFQUFFO1lBQ2xCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDUCxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQzdCLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7U0FDN0I7YUFBTTtZQUNOLEVBQUUsR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2QsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQ3RDLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztTQUN0QztRQUNELElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDdkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDVCxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNULENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1QsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDVCxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDO1FBQ3ZFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ25FLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQzVFLElBQUksRUFBRSxHQUFHLE1BQU0sRUFBRTtZQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BFLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEcsT0FBTztTQUNQO1FBQ0QsQ0FBQyxHQUFHLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDO1FBQ3hCLENBQUMsR0FBRyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUN4QixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNuRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDM0IsSUFBSSxRQUFRLElBQUksQ0FBQyxFQUFFO1lBQ2xCLFFBQVEsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ2xDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUM7WUFDM0QsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFO2dCQUNYLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDN0MsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLFFBQVEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3ZDLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNiLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNiLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7YUFDdkI7U0FDRDtRQUNELEtBQUssRUFDTCxJQUFJLENBQUMsRUFBRTtZQUNOLEVBQUUsSUFBSSxHQUFHLENBQUM7WUFDVixJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDbkQsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2IsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNULEVBQUUsR0FB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