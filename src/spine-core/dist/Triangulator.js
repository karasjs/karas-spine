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
import { Pool } from "./Utils";
export class Triangulator {
    constructor() {
        this.convexPolygons = new Array();
        this.convexPolygonsIndices = new Array();
        this.indicesArray = new Array();
        this.isConcaveArray = new Array();
        this.triangles = new Array();
        this.polygonPool = new Pool(() => {
            return new Array();
        });
        this.polygonIndicesPool = new Pool(() => {
            return new Array();
        });
    }
    triangulate(verticesArray) {
        let vertices = verticesArray;
        let vertexCount = verticesArray.length >> 1;
        let indices = this.indicesArray;
        indices.length = 0;
        for (let i = 0; i < vertexCount; i++)
            indices[i] = i;
        let isConcave = this.isConcaveArray;
        isConcave.length = 0;
        for (let i = 0, n = vertexCount; i < n; ++i)
            isConcave[i] = Triangulator.isConcave(i, vertexCount, vertices, indices);
        let triangles = this.triangles;
        triangles.length = 0;
        while (vertexCount > 3) {
            // Find ear tip.
            let previous = vertexCount - 1, i = 0, next = 1;
            while (true) {
                outer: if (!isConcave[i]) {
                    let p1 = indices[previous] << 1, p2 = indices[i] << 1, p3 = indices[next] << 1;
                    let p1x = vertices[p1], p1y = vertices[p1 + 1];
                    let p2x = vertices[p2], p2y = vertices[p2 + 1];
                    let p3x = vertices[p3], p3y = vertices[p3 + 1];
                    for (let ii = (next + 1) % vertexCount; ii != previous; ii = (ii + 1) % vertexCount) {
                        if (!isConcave[ii])
                            continue;
                        let v = indices[ii] << 1;
                        let vx = vertices[v], vy = vertices[v + 1];
                        if (Triangulator.positiveArea(p3x, p3y, p1x, p1y, vx, vy)) {
                            if (Triangulator.positiveArea(p1x, p1y, p2x, p2y, vx, vy)) {
                                if (Triangulator.positiveArea(p2x, p2y, p3x, p3y, vx, vy))
                                    break outer;
                            }
                        }
                    }
                    break;
                }
                if (next == 0) {
                    do {
                        if (!isConcave[i])
                            break;
                        i--;
                    } while (i > 0);
                    break;
                }
                previous = i;
                i = next;
                next = (next + 1) % vertexCount;
            }
            // Cut ear tip.
            triangles.push(indices[(vertexCount + i - 1) % vertexCount]);
            triangles.push(indices[i]);
            triangles.push(indices[(i + 1) % vertexCount]);
            indices.splice(i, 1);
            isConcave.splice(i, 1);
            vertexCount--;
            let previousIndex = (vertexCount + i - 1) % vertexCount;
            let nextIndex = i == vertexCount ? 0 : i;
            isConcave[previousIndex] = Triangulator.isConcave(previousIndex, vertexCount, vertices, indices);
            isConcave[nextIndex] = Triangulator.isConcave(nextIndex, vertexCount, vertices, indices);
        }
        if (vertexCount == 3) {
            triangles.push(indices[2]);
            triangles.push(indices[0]);
            triangles.push(indices[1]);
        }
        return triangles;
    }
    decompose(verticesArray, triangles) {
        let vertices = verticesArray;
        let convexPolygons = this.convexPolygons;
        this.polygonPool.freeAll(convexPolygons);
        convexPolygons.length = 0;
        let convexPolygonsIndices = this.convexPolygonsIndices;
        this.polygonIndicesPool.freeAll(convexPolygonsIndices);
        convexPolygonsIndices.length = 0;
        let polygonIndices = this.polygonIndicesPool.obtain();
        polygonIndices.length = 0;
        let polygon = this.polygonPool.obtain();
        polygon.length = 0;
        // Merge subsequent triangles if they form a triangle fan.
        let fanBaseIndex = -1, lastWinding = 0;
        for (let i = 0, n = triangles.length; i < n; i += 3) {
            let t1 = triangles[i] << 1, t2 = triangles[i + 1] << 1, t3 = triangles[i + 2] << 1;
            let x1 = vertices[t1], y1 = vertices[t1 + 1];
            let x2 = vertices[t2], y2 = vertices[t2 + 1];
            let x3 = vertices[t3], y3 = vertices[t3 + 1];
            // If the base of the last triangle is the same as this triangle, check if they form a convex polygon (triangle fan).
            let merged = false;
            if (fanBaseIndex == t1) {
                let o = polygon.length - 4;
                let winding1 = Triangulator.winding(polygon[o], polygon[o + 1], polygon[o + 2], polygon[o + 3], x3, y3);
                let winding2 = Triangulator.winding(x3, y3, polygon[0], polygon[1], polygon[2], polygon[3]);
                if (winding1 == lastWinding && winding2 == lastWinding) {
                    polygon.push(x3);
                    polygon.push(y3);
                    polygonIndices.push(t3);
                    merged = true;
                }
            }
            // Otherwise make this triangle the new base.
            if (!merged) {
                if (polygon.length > 0) {
                    convexPolygons.push(polygon);
                    convexPolygonsIndices.push(polygonIndices);
                }
                else {
                    this.polygonPool.free(polygon);
                    this.polygonIndicesPool.free(polygonIndices);
                }
                polygon = this.polygonPool.obtain();
                polygon.length = 0;
                polygon.push(x1);
                polygon.push(y1);
                polygon.push(x2);
                polygon.push(y2);
                polygon.push(x3);
                polygon.push(y3);
                polygonIndices = this.polygonIndicesPool.obtain();
                polygonIndices.length = 0;
                polygonIndices.push(t1);
                polygonIndices.push(t2);
                polygonIndices.push(t3);
                lastWinding = Triangulator.winding(x1, y1, x2, y2, x3, y3);
                fanBaseIndex = t1;
            }
        }
        if (polygon.length > 0) {
            convexPolygons.push(polygon);
            convexPolygonsIndices.push(polygonIndices);
        }
        // Go through the list of polygons and try to merge the remaining triangles with the found triangle fans.
        for (let i = 0, n = convexPolygons.length; i < n; i++) {
            polygonIndices = convexPolygonsIndices[i];
            if (polygonIndices.length == 0)
                continue;
            let firstIndex = polygonIndices[0];
            let lastIndex = polygonIndices[polygonIndices.length - 1];
            polygon = convexPolygons[i];
            let o = polygon.length - 4;
            let prevPrevX = polygon[o], prevPrevY = polygon[o + 1];
            let prevX = polygon[o + 2], prevY = polygon[o + 3];
            let firstX = polygon[0], firstY = polygon[1];
            let secondX = polygon[2], secondY = polygon[3];
            let winding = Triangulator.winding(prevPrevX, prevPrevY, prevX, prevY, firstX, firstY);
            for (let ii = 0; ii < n; ii++) {
                if (ii == i)
                    continue;
                let otherIndices = convexPolygonsIndices[ii];
                if (otherIndices.length != 3)
                    continue;
                let otherFirstIndex = otherIndices[0];
                let otherSecondIndex = otherIndices[1];
                let otherLastIndex = otherIndices[2];
                let otherPoly = convexPolygons[ii];
                let x3 = otherPoly[otherPoly.length - 2], y3 = otherPoly[otherPoly.length - 1];
                if (otherFirstIndex != firstIndex || otherSecondIndex != lastIndex)
                    continue;
                let winding1 = Triangulator.winding(prevPrevX, prevPrevY, prevX, prevY, x3, y3);
                let winding2 = Triangulator.winding(x3, y3, firstX, firstY, secondX, secondY);
                if (winding1 == winding && winding2 == winding) {
                    otherPoly.length = 0;
                    otherIndices.length = 0;
                    polygon.push(x3);
                    polygon.push(y3);
                    polygonIndices.push(otherLastIndex);
                    prevPrevX = prevX;
                    prevPrevY = prevY;
                    prevX = x3;
                    prevY = y3;
                    ii = 0;
                }
            }
        }
        // Remove empty polygons that resulted from the merge step above.
        for (let i = convexPolygons.length - 1; i >= 0; i--) {
            polygon = convexPolygons[i];
            if (polygon.length == 0) {
                convexPolygons.splice(i, 1);
                this.polygonPool.free(polygon);
                polygonIndices = convexPolygonsIndices[i];
                convexPolygonsIndices.splice(i, 1);
                this.polygonIndicesPool.free(polygonIndices);
            }
        }
        return convexPolygons;
    }
    static isConcave(index, vertexCount, vertices, indices) {
        let previous = indices[(vertexCount + index - 1) % vertexCount] << 1;
        let current = indices[index] << 1;
        let next = indices[(index + 1) % vertexCount] << 1;
        return !this.positiveArea(vertices[previous], vertices[previous + 1], vertices[current], vertices[current + 1], vertices[next], vertices[next + 1]);
    }
    static positiveArea(p1x, p1y, p2x, p2y, p3x, p3y) {
        return p1x * (p3y - p2y) + p2x * (p1y - p3y) + p3x * (p2y - p1y) >= 0;
    }
    static winding(p1x, p1y, p2x, p2y, p3x, p3y) {
        let px = p2x - p1x, py = p2y - p1y;
        return p3x * py - p3y * px + px * p1y - p1x * py >= 0 ? 1 : -1;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJpYW5ndWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1RyaWFuZ3VsYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytFQTJCK0U7QUFFL0UsT0FBTyxFQUFtQixJQUFJLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFFaEQsTUFBTSxPQUFPLFlBQVk7SUFBekI7UUFDUyxtQkFBYyxHQUFHLElBQUksS0FBSyxFQUFpQixDQUFDO1FBQzVDLDBCQUFxQixHQUFHLElBQUksS0FBSyxFQUFpQixDQUFDO1FBRW5ELGlCQUFZLEdBQUcsSUFBSSxLQUFLLEVBQVUsQ0FBQztRQUNuQyxtQkFBYyxHQUFHLElBQUksS0FBSyxFQUFXLENBQUM7UUFDdEMsY0FBUyxHQUFHLElBQUksS0FBSyxFQUFVLENBQUM7UUFFaEMsZ0JBQVcsR0FBRyxJQUFJLElBQUksQ0FBZ0IsR0FBRyxFQUFFO1lBQ2xELE9BQU8sSUFBSSxLQUFLLEVBQVUsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztRQUVLLHVCQUFrQixHQUFHLElBQUksSUFBSSxDQUFnQixHQUFHLEVBQUU7WUFDekQsT0FBTyxJQUFJLEtBQUssRUFBVSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBK05KLENBQUM7SUE3Tk8sV0FBVyxDQUFFLGFBQThCO1FBQ2pELElBQUksUUFBUSxHQUFHLGFBQWEsQ0FBQztRQUM3QixJQUFJLFdBQVcsR0FBRyxhQUFhLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztRQUU1QyxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLEVBQUUsQ0FBQyxFQUFFO1lBQ25DLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFF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