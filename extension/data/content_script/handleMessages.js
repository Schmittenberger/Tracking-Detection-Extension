// -----------------------------------------------------
// sendToExtension() sends data from 'within' the site to the injected site running in the background
// of the TAB (tab specific) via posting a message. This message is picked up by inject.js (this file) and passed on to the 
// script running in the background of the BROWSER (called lib/background.js and is active browser-wide)
//---------------------------------------------------------
	//  §OVGU_FROM_PAGE_TO_EXTENSION_TT§ is a custom event identifier I made up 
	//  to avoid potential conflicts with other extensions/ pages using the same event identifier 
	//  and by mistake picking up their messages

function sendToExtension(data){
	var payload = { type: "§OVGU_FROM_PAGE_TO_EXTENSION_TT§", text: data};
	window.postMessage(payload, "*");
}

var __upperLimitObject_JSFL0__ = {}
const __upperLimitSending_JSFL0__ = 50

//optionally insert the value the detected function returns
function handleDetection(method,flagNumber){
	console.log("handling detection: " + method,flagNumber)
	//Note: payload will be turned into a JSON object in the background script to send it to the data collection endpoint
	let payload = {
		"url":document.URL,
		"useragent":"--", //this data is inserted by the background script
		"flag":flagNumber, 
		// 0 = flow control, info message like site visit
		// 1 = (general) detection of js function
		// 2 = cookies
		// 3 = fingerprinting
		// 4 = storage
		// 5 = sensors
		//10 = injecting script into site was succesful
		"method":method
	};
	let newMethod = "";
	if(typeof method == "object" && method.length > 0){
		newMethod = method[0];
		// console.log("array method this long:" + method.length,newMethod)
	} else{
		newMethod = method;
	}

	if (typeof __upperLimitObject_JSFL0__[newMethod] == "undefined") {
		__upperLimitObject_JSFL0__[newMethod] = 0;
		// console.log("first time method:" + typeof newMethod,newMethod)
		sendToExtension(payload);
	}
	else {
		// console.log("method seen again",newMethod)
		__upperLimitObject_JSFL0__[newMethod]++;
		if(__upperLimitObject_JSFL0__[newMethod] < __upperLimitSending_JSFL0__)
			sendToExtension(payload);
		else
			console.log("not sending method: " + method + "because it has reached the upper limit of " + __upperLimitSending_JSFL0__)
	}
	
}
