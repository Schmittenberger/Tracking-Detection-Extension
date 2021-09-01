// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
// I went through the documentation and handpicked a few methods which could be used for fingerprinting
// because of performance I did not include more, and these methods are really just to have a sample later
// getContext('webgl') should really be enough to identify webgl fingerprinting, if not then validate the individual cases

	[
    [WebGLRenderingContext.prototype,"readPixels",WebGLRenderingContext.prototype.readPixels], 
    [WebGLRenderingContext.prototype,"createBuffer",WebGLRenderingContext.prototype.createBuffer],
    [WebGLRenderingContext.prototype,"bufferData",WebGLRenderingContext.prototype.bufferData],
    [WebGLRenderingContext.prototype,"useProgram",WebGLRenderingContext.prototype.useProgram]
    ].forEach(function (currentValue, index, array) {
        Object.defineProperty(currentValue[0], currentValue[1], {
        "value": function () {
            // let copiedArguments = []
            // for(var i =0; i < arguments.length;i++){
            //     if(typeof arguments[i] != "function")
            //         copiedArguments[i] = arguments[i]
            // }
            // handleDetection([currentValue[1],copiedArguments],32);	
            handleDetection(currentValue[1],32);	
            //return eval(method).apply(this, arguments);
            return currentValue[2].apply(this, arguments);
        }
        });
    });