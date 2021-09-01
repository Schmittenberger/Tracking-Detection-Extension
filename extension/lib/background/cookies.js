//cookie handling
// is tab independant, find a way to bind it to a tab or url to be able to understand where the cookie came from
// right now this cookie listener is running in 'browser scope' -> I want it to only run on the tab to crawl on
browser.cookies.onChanged.addListener(function(changeInfo) {
  
	if(changeInfo.cause == "explicit"){
		let payload = {
			"url":"from extension backgroundscript",
			"rank":urlList[pageVisitedCounter].rank, // error potential, the site could already have changed inbetween detecting a cookie and setting this value
			                            // However I assume this is a very minor margin for error
			"useragent":globalUseragent,
			"flag":2, // 2 for cookie
			"method":JSON.stringify(changeInfo.cookie)
		};
		sendDataToEndpoint(payload);
		//console.log('Cookie changed: '+ JSON.stringify(changeInfo.cookie)); 
		//console.log('Cause: ' + changeInfo.cause +'\n * Removed: ' + changeInfo.removed);
  }
});