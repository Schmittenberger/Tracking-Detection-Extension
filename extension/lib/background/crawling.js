// Crawl Handling

//fetch list to crawl on
function startCrawl(useragent,start,stop){
	pageVisitedCounter = parseInt(start)
	console.log("[Crawl Status]: starting crawl on: " + useragent)
	globalUseragent = useragent
	crawlFlag = true;
	// crawlStopNumber = (stop-start)
	crawlStopNumber = stop
	//get site urls to crawl
	//var req = new Request(siteListEndpointAddress + "?amount=" + (stop-start) + "&start=" + start, {
		// start = 0 is hardcoded because i don't want to have two counters (a current pagerank and current location in urlList array)
		// running at the same time bc of the asynchronous nature of the extension
		// HUGELY inefficient I know, but necessary to deliver in time
	// var req = new Request("http://192.168.1.21:8080/injectFix?collection=international_firefox_emulator", {
	var req = new Request(siteListEndpointAddress + "?amount=" + (stop) + "&start=0", {
        method: 'GET',
        redirect: 'follow',
        referrer: 'client'
    });

    fetch(req).then(function(response) {
		if(response.status != 200){
			console.warn("Unexpected response status while receiving urls to crawl")
		}
		response.json().then(function(result){
			console.log(result);
			urlList = result;
			
			// start the automation
			var querying = browser.tabs.query({currentWindow:true});
			
			querying.then(updateFirstTab, onError);
			//return result;
		});


    }).catch(error => { console.error(error); });
}



function resumeCrawl(){
	crawlFlag = true;
	console.log("[Crawl Status]: resuming crawl");
	var querying = browser.tabs.query({currentWindow:true});
	querying.then(crawl, onError); 
}

function stopCrawl(){
	console.log("[Crawl Status]: pausing/stoping crawl");
	crawlFlag = false;

	let msg =  {
		"url":"__crawlSTOP__",
		"useragent":"--",//this data is inserted by the background script
		"flag":0, // 1 = detection of js function | 0 = flow control, info message like site visit
		"method":"__crawlSTOP__"
	}
	sendDataToEndpoint(msg);
}


function restartCrawl(useragent,start,stop){
	console.log("[Crawl Status]: resetting crawl");
	crawlFlag = false;
	pageVisitedCounter = 0;
	if(useragent !== '')
		startCrawl(useragent,start,stop)
	else {
		startCrawl("restartedCrawlAgent",start,stop)
		console.log("User agent string was empty, passing temporary string to restart Crawl")
	}
}
