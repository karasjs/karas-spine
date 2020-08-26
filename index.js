(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('karas')) :
	typeof define === 'function' && define.amd ? define(['karas'], factory) :
	(global = global || self, global.Dragonbones = factory(global.karas));
}(this, (function (karas) { 'use strict';

	karas = karas && Object.prototype.hasOwnProperty.call(karas, 'default') ? karas['default'] : karas;

	class Spine extends karas.Component {}

	return Spine;

})));
//# sourceMappingURL=index.js.map
