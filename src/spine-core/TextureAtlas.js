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
import { TextureFilter, TextureWrap, TextureRegion } from "./Texture";
import { Utils } from "./Utils";
export class TextureAtlas {
    constructor(atlasText) {
        this.pages = new Array();
        this.regions = new Array();
        let reader = new TextureAtlasReader(atlasText);
        let entry = new Array(4);
        let page = null;
        let region = null;
        let pageFields = {};
        pageFields["size"] = () => {
            page.width = parseInt(entry[1]);
            page.height = parseInt(entry[2]);
        };
        pageFields["format"] = () => {
            // page.format = Format[tuple[0]]; we don't need format in WebGL
        };
        pageFields["filter"] = () => {
            page.minFilter = Utils.enumValue(TextureFilter, entry[1]);
            page.magFilter = Utils.enumValue(TextureFilter, entry[2]);
        };
        pageFields["repeat"] = () => {
            if (entry[1].indexOf('x') != -1)
                page.uWrap = TextureWrap.Repeat;
            if (entry[1].indexOf('y') != -1)
                page.vWrap = TextureWrap.Repeat;
        };
        pageFields["pma"] = () => {
            page.pma = entry[1] == "true";
        };
        var regionFields = {};
        regionFields["xy"] = () => {
            region.x = parseInt(entry[1]);
            region.y = parseInt(entry[2]);
        };
        regionFields["size"] = () => {
            region.width = parseInt(entry[1]);
            region.height = parseInt(entry[2]);
        };
        regionFields["bounds"] = () => {
            region.x = parseInt(entry[1]);
            region.y = parseInt(entry[2]);
            region.width = parseInt(entry[3]);
            region.height = parseInt(entry[4]);
        };
        regionFields["offset"] = () => {
            region.offsetX = parseInt(entry[1]);
            region.offsetY = parseInt(entry[2]);
        };
        regionFields["orig"] = () => {
            region.originalWidth = parseInt(entry[1]);
            region.originalHeight = parseInt(entry[2]);
        };
        regionFields["offsets"] = () => {
            region.offsetX = parseInt(entry[1]);
            region.offsetY = parseInt(entry[2]);
            region.originalWidth = parseInt(entry[3]);
            region.originalHeight = parseInt(entry[4]);
        };
        regionFields["rotate"] = () => {
            let value = entry[1];
            if (value == "true")
                region.degrees = 90;
            else if (value != "false")
                region.degrees = parseInt(value);
        };
        regionFields["index"] = () => {
            region.index = parseInt(entry[1]);
        };
        let line = reader.readLine();
        // Ignore empty lines before first entry.
        while (line && line.trim().length == 0)
            line = reader.readLine();
        // Header entries.
        while (true) {
            if (!line || line.trim().length == 0)
                break;
            if (reader.readEntry(entry, line) == 0)
                break; // Silently ignore all header fields.
            line = reader.readLine();
        }
        // Page and region entries.
        let names = null;
        let values = null;
        while (true) {
            if (line === null)
                break;
            if (line.trim().length == 0) {
                page = null;
                line = reader.readLine();
            }
            else if (!page) {
                page = new TextureAtlasPage();
                page.name = line.trim();
                while (true) {
                    if (reader.readEntry(entry, line = reader.readLine()) == 0)
                        break;
                    let field = pageFields[entry[0]];
                    if (field)
                        field();
                }
                this.pages.push(page);
            }
            else {
                region = new TextureAtlasRegion();
                region.page = page;
                region.name = line;
                while (true) {
                    let count = reader.readEntry(entry, line = reader.readLine());
                    if (count == 0)
                        break;
                    let field = regionFields[entry[0]];
                    if (field)
                        field();
                    else {
                        if (!names) {
                            names = [];
                            values = [];
                        }
                        names.push(entry[0]);
                        let entryValues = [];
                        for (let i = 0; i < count; i++)
                            entryValues.push(parseInt(entry[i + 1]));
                        values.push(entryValues);
                    }
                }
                if (region.originalWidth == 0 && region.originalHeight == 0) {
                    region.originalWidth = region.width;
                    region.originalHeight = region.height;
                }
                if (names && names.length > 0) {
                    region.names = names;
                    region.values = values;
                    names = null;
                    values = null;
                }
                region.u = region.x / page.width;
                region.v = region.y / page.height;
                if (region.degrees == 90) {
                    region.u2 = (region.x + region.height) / page.width;
                    region.v2 = (region.y + region.width) / page.height;
                }
                else {
                    region.u2 = (region.x + region.width) / page.width;
                    region.v2 = (region.y + region.height) / page.height;
                }
                this.regions.push(region);
            }
        }
    }
    findRegion(name) {
        for (let i = 0; i < this.regions.length; i++) {
            if (this.regions[i].name == name) {
                return this.regions[i];
            }
        }
        return null;
    }
    setTextures(assetManager, path = "") {
        for (let page of this.pages)
            page.setTexture(assetManager.get(path));
    }
    dispose() {
        for (let i = 0; i < this.pages.length; i++) {
            this.pages[i].texture.dispose();
        }
    }
}
class TextureAtlasReader {
    constructor(text) {
        this.index = 0;
        this.lines = text.split(/\r\n|\r|\n/);
    }
    readLine() {
        if (this.index >= this.lines.length)
            return null;
        return this.lines[this.index++];
    }
    readEntry(entry, line) {
        if (!line)
            return 0;
        line = line.trim();
        if (line.length == 0)
            return 0;
        let colon = line.indexOf(':');
        if (colon == -1)
            return 0;
        entry[0] = line.substr(0, colon).trim();
        for (let i = 1, lastMatch = colon + 1;; i++) {
            let comma = line.indexOf(',', lastMatch);
            if (comma == -1) {
                entry[i] = line.substr(lastMatch).trim();
                return i;
            }
            entry[i] = line.substr(lastMatch, comma - lastMatch).trim();
            lastMatch = comma + 1;
            if (i == 4)
                return 4;
        }
    }
}
export class TextureAtlasPage {
    constructor() {
        this.minFilter = TextureFilter.Nearest;
        this.magFilter = TextureFilter.Nearest;
        this.uWrap = TextureWrap.ClampToEdge;
        this.vWrap = TextureWrap.ClampToEdge;
    }
    setTexture(texture) {
        this.texture = texture;
        texture.setFilters(this.minFilter, this.magFilter);
        texture.setWraps(this.uWrap, this.vWrap);
    }
}
export class TextureAtlasRegion extends TextureRegion {
}