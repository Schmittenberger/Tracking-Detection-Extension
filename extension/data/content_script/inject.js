	//TODO: rename function names to make them unique so that they do not CLASH with possible same function names from other websites
			//this code is inserted into a page, any third party function from that site could call our function by mistake or the other way round)

//chrome incompatibily, to be able to open the popup in chrome we have to activate it for every page each time
//of course the mozilla polyfill is converting this to chrome.runtime
// chrome.runtime.sendMessage({"message": "activate_icon"});

const originalPageRank = -2
var pagerank = originalPageRank
var timeToWaitForPagerank = 1000

/*  send messages between content script (running on a page) to the background script (running among all tabs)*/
function handleResponse(message) {
  console.log(message.type,`|Message from the background script:  ${message.response}`);
 	if(message.type === "stat") {
		 console.log("got pagerank of current site: " + message.response)
		 pagerank = message.response
	 }
  		
}


// function __stopPageLoading__(time){
// 	setTimeout(
// 		function(){ 	
// 			window.stop();
// 			__stopPageLoading__(2000)
// 		},	time
// 	);
// }

// __stopPageLoading__(7000)

function handleError(error) {
  console.log(`Error: ${error}`);
}
function handleErrorPagerank(error) {
	handleError(error)
	console.log("[Pagerank]: error while getting page rank")
	getPageRank()
}
	
function sendToBackground(data){
	//console.log("[sending to background]",pagerank,data);
	if(pagerank === originalPageRank){
		getPageRank();
		setTimeout(
			function(){ 	
				console.log("page rank not received in time, trying again in " + timeToWaitForPagerank  +"ms")
				
				
				var sending = browser.runtime.sendMessage({
					message_payload: {comment:"-1pagerank ",flag:0,url:document.URL,original:data}
				
				  });
				  sending.then(handleResponse, handleError);
				  sendToBackground(data);
			
		},	timeToWaitForPagerank);
		  return;
	} else{
	data.rank = pagerank;
  var sending = browser.runtime.sendMessage({
    message_payload: data

  });
  sending.then(handleResponse, handleError);
}
}	

getPageRank()

function getPageRank(){
	let getPageRankObject = {
		"url":'empty',
		"useragent":"--", //this data is inserted by the background script
		"flag":0, // 0 = flow control, info messages like site visit
		"method":"__getPageRank__"
	}
	
	let sendingRank = browser.runtime.sendMessage({
		message_payload: getPageRankObject
	
	  });
	  sendingRank.then(handleResponse, handleErrorPagerank);
}






window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window)
        return;
	
	//  §OVGU_FROM_PAGE_TO_EXTENSION_TT§ is a custom event identifier I made up 
	//  to avoid potential conflicts with other extensions/ pages using the same event identifier 
	//  and by mistake picking up their messages
	
	//	if event.data exists and if it comes from this extension
    if (event.data.type && (event.data.type == "§OVGU_FROM_PAGE_TO_EXTENSION_TT§")) {
        //console.log("Content script received message from page: " + event.data.text);
		sendToBackground(event.data.text);
    }
});

	var objectDefiningOverwrite = function(){
			
	// add this code at the end of your injection
	// could possibly find out if a website overwrites a function (in the same way I am doing)
	const _defineProperty = Object.defineProperty;
	Object.defineProperty(Object, "defineProperty", {
		"value": function (old) {
		console.log("define Property used");
		console.log(old)
		return _defineProperty.apply(this, arguments);
		}
	}); 

	//
	}

	
//circumvent Content Security Policy blocking my scripts
//https://stackoverflow.com/questions/45767434/chrome-extension-inject-script-with-dynamic-value-into-page-with-strict-csp
// but now google chrome does not support this kind of injection
// fix for google chrome:
// https://stackoverflow.com/questions/10527625/google-chrome-extension-script-injections
// https://developer.chrome.com/docs/extensions/mv3/manifest/web_accessible_resources/
// this is actually a security feature that I have to circumvent -> it is supposed to prevent websites finding out which extensions are used
// tl;dr: add all the needed scripts to the manifest file under "web_accessible_resources": ['data/content_script/features/injectTest.js', ...]
// and add them here in scriptsToInject

let script = document.createElement('script');
script.src = browser.runtime.getURL('data/content_script/injectTest.js');
script.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

let scriptsToInject = [	
"data/content_script/handleMessages.js",
"data/content_script/features/fingerprinting/canvas-fingerprint.js",
"data/content_script/features/fingerprinting/webgl-fingerprint.js",
"data/content_script/features/fingerprinting/font-fingerprint.js",
"data/content_script/features/fingerprinting/audio-fingerprint.js",
"data/content_script/features/fingerprinting/getContext-type.js",
"data/content_script/features/geolocation.js",
"data/content_script/features/storage-vectors.js",
"data/content_script/features/battery.js",
"data/content_script/features/sensors.js",
"data/content_script/features/notifications.js"
]

scriptsToInject.forEach(file => {
let scriptTmp= document.createElement('script');
scriptTmp.src = browser.runtime.getURL(file);
scriptTmp.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(scriptTmp);
})



//----------------------------
//my old way of injecting scripts into a website
//replaced because website's Content Security Policy can block this type of injection
//the new method can't be blocked by CSP  

// var script_1 = document.createElement("script");
// script_1.textContent = "(" + injectedTest + ")()";
// document.documentElement.appendChild(script_1);
// script_1.remove();

// var script_message_exchange = document.createElement("script");
// script_message_exchange.textContent =   sendFunc + " " + handleDetectFunc;
// document.documentElement.appendChild(script_message_exchange);
// script_message_exchange.remove();