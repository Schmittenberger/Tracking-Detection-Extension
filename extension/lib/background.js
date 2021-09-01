// const CONFIG = require('../config');


var urlList = [];
var pageVisitedCounter = 0;
var crawlFlag = false;
var globalUseragent = ""

var crawlStopNumber = 0;

var tabToCrawlOn = "";

var dbCollectionName = ""
var pageStuckArray = []; // save failed pages to skip them| Not actually used in the end


// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation
//use webNavigation.onCompleted to send information when visiting new site
//use webNavigation.onBeforeNavigate to find out if leaving site? -> does not detect a page leave, it only logs that a new page is about to be accessed
browser.webNavigation.onCompleted.addListener(onPageFullyLoaded);

function onPageFullyLoaded(details) {
//   	let payload = {
// 			"url":details.url,"useragent":"--","flag":0, "comment":"page load"
// 		};
//   sendDataToEndpoint(payload);
	
  if(crawlFlag){ 
	console.log("[Crawl Status]: ##onPageFullyLoaded" + details.url + " is number " + urlList[pageVisitedCounter].rank);
}
 
}


//---------- webrequest handling ----------------


function logURL(requestDetails) {
  //console.log("Loading: " + requestDetails.url + " on " + requestDetails.documentUrl);
}

browser.webRequest.onBeforeRequest.addListener(
  logURL,
  {urls: ["<all_urls>"]}
);


browser.runtime.onMessage.addListener(handleMessage);
//get messages from content scripts or popup
//request contains the data we sent from the content script
//sender contains info about tab attributes like id, url, title or active
function handleMessage(request, sender, sendResponse) {
	
		if(request.message_payload.flag == 0){
			switch (request.message_payload.method) {
				case "__crawlSTART__": 
					if (pageVisitedCounter > 2)  
						resumeCrawl() 
					else {
						dbCollectionName = request.message_payload.dbCollectionName;
						startCrawl(request.message_payload.useragent,request.message_payload.start,request.message_payload.stop);
					}
					break;

				case"__crawlSTOP__" : stopCrawl();break;
				case"__crawlRESET__" : 
					restartCrawl(request.message_payload.useragent,request.message_payload.start,request.message_payload.stop);
					break;
				//this is for the popup
				case "__crawlStatus__": return Promise.resolve({response: crawlFlag,progress: urlList[pageVisitedCounter].rank});
				//this is for the inject script running in the scope of a tab
				case "__getPageRank__": 
					//only pass on pagerank for tabs we are actually crawling on
					//avoid mix up of data from 'non crawl' tabs influencing results
					// ---> tested, but causes errors. No other tabs should be open while crawling
					//uncomment this later when fixed, for testing purposes this is turned off
						// if(crawlFlag && sender.tab.id === tabToCrawlOn) {
						console.log("active crawl and passing pagerank (" + urlList[pageVisitedCounter].rank + ") on from " + sender.tab.url)
						return Promise.resolve({type:"stat",response: urlList[pageVisitedCounter].rank});
			} 
		}
		sendDataToEndpoint(request.message_payload)

		return Promise.resolve({type:"ack", response: "Got your Message."});
}	


function sendDataToEndpoint(payload){
	//add device information
	if(payload.useragent === "--" || payload.useragent === "" || typeof payload.useragent === "undefined") 
		payload.useragent = globalUseragent // this useragent info is now set manually via the popup.js when starting a crawl | custom user agent, not actualy a real useragent
	
    var req = new Request(dataCollectionEndpointAddress, {
        method: 'POST',
        headers: {
      'Content-Type': 'application/json',
    },
        body: JSON.stringify(payload),
        redirect: 'follow',
        referrer: 'client'
    });

    fetch(req).then(function(response) {
		if(response.status != 200){
			console.warn("[Error]: Unexpected response status received while sending data to data collection endpoint");
		}
		return response;
    }).catch(error => { console.error(error); });

}
		

