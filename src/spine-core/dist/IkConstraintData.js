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
import { ConstraintData } from "./ConstraintData";
/** Stores the setup pose for an {@link IkConstraint}.
 * <p>
 * See [IK constraints](http://esotericsoftware.com/spine-ik-constraints) in the Spine User Guide. */
export class IkConstraintData extends ConstraintData {
    constructor(name) {
        super(name, 0, false);
        /** The bones that are constrained by this IK constraint. */
        this.bones = new Array();
        /** Controls the bend direction of the IK bones, either 1 or -1. */
        this.bendDirection = 1;
        /** When true and only a single bone is being constrained, if the target is too close, the bone is scaled to reach it. */
        this.compress = false;
        /** When true, if the target is out of range, the parent bone is scaled to reach it. If more than one bone is being constrained
         * and the parent bone has local nonuniform scale, stretch is not applied. */
        this.stretch = false;
        /** When true, only a single bone is being constrained, and {@link #getCompress()} or {@link #getStretch()} is used, the bone
         * is scaled on both the X and Y axes. */
        this.uniform = false;
        /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
        this.mix = 1;
        /** For two bone IK, the distance from the maximum reach of the bones that rotation will slow. */
        this.softness = 0;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSWtDb25zdHJhaW50RGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Ja0NvbnN0cmFpbnREYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0VBMkIrRTtBQUcvRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFHbEQ7O3FHQUVxRztBQUNyRyxNQUFNLE9BQU8sZ0JBQWlCLFNBQVEsY0FBYztJQTJCbkQsWUFBYSxJQUFZO1FBQ3hCLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBM0J2Qiw0REFBNEQ7UUFDNUQsVUFBSyxHQUFHLElBQUksS0FBSyxFQUFZLENBQUM7UUFLOUIsbUVBQW1FO1FBQ25FLGtCQUFhLEdBQUcsQ0FBQyxDQUFDO1FBRWxCLHlIQUF5SDtRQUN6SCxhQUFRLEdBQUcsS0FBSyxDQUFDO1FBRWpCO3FGQUM2RTtRQUM3RSxZQUFPLEdBQUcsS0FBSyxDQUFDO1FBRWhCO2lEQUN5QztRQUN6QyxZQUFPLEdBQUcsS0FBSyxDQUFDO1FBRWhCLG9HQUFvRztRQUNwRyxRQUFHLEdBQUcsQ0FBQyxDQUFDO1FBRVIsaUdBQWlHO1FBQ2pHLGFBQVEsR0FBRyxDQUFDLENBQUM7SUFJYixDQUFDO0NBQ0QifQ==