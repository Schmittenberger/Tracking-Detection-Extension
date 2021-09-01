

	// -----  Touch Events listener
	/* code used to track touch events in the demo from mozilla
	//https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
	el.addEventListener("touchstart", handleStart, false);
	el.addEventListener("touchend", handleEnd, false);
	el.addEventListener("touchcancel", handleCancel, false);
	el.addEventListener("touchmove", handleMove, false);
	*/
	
	//watch out for the base element event listeners are assigned to: either document,window or an element etc.
	//not used in crawl because touch event listeners could be connected to anything (div,span, etc.)

	
	[
	[window,window.addEventListener],
	[document,document.addEventListener],
	[Object,Object.addEventListener],
	[EventTarget,EventTarget.addEventListener],
	].forEach(function (currentValue, index, array) {
	Object.defineProperty(currentValue[0], "addEventListener", {
	"value": function () {
		switch(arguments[0]){
			case "touchstart":
				handleDetection("touchstart event listener" + currentValue[0],999);
				console.log("extension detected touchstart event listener" + currentValue[0]);
				break;
			case "touchmove":
				handleDetection("touchmove event listener" + currentValue[0],999);
				console.log("extension detected touchmove event listener"+ currentValue[0]);
				break;
			case "touchend":
				handleDetection("touchend event listener"+ currentValue[0],999);
				console.log("extension detected touchend event listener"+ currentValue[0]);
				break;
			case "touchcancel":
				handleDetection("touchcancel event listener"+ currentValue[0],999);
				console.log("extension detected touchcancel event listener"+ currentValue[0]);
				break;
			default:
				console.log("[touch.js]:" + arguments[0] +" / "+ currentValue[0]);
				break;
				
		}
		return currentValue[1].apply(this, arguments);  	  
	},
	writable:true
	});
	});
		
