[
[CanvasRenderingContext2D.prototype,"font",Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "font").set]
].forEach(function (currentValue, index, array) {
    Object.defineProperty(currentValue[0], currentValue[1], {
    set() {
        handleDetection([currentValue[1],arguments[0]],34);
        return currentValue[2].apply(this,arguments);
    }
    });
});	

// detection method reworked from https://addons.mozilla.org/en-GB/firefox/addon/font-fingerprint-defender/
// the above plugin spoofs the result, but I only need to detect when the function is called
    //RETURNS TOO MANY FALSE POSITIVES
// [
    // [HTMLElement.prototype,"offsetHeight",Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight").get],
    // [HTMLElement.prototype,"offsetWidth",Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth").get]
    // ].forEach(function (currentValue, index, array) {
    //     Object.defineProperty(currentValue[0], currentValue[1], {
    //     get() {
    //         handleDetection([currentValue[1],arguments[0]],34);
    //         return currentValue[2].apply(this,arguments);
    //     }
    //     });
    // });	