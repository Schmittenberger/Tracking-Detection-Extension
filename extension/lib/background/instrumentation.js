// ---------------------------------------------------------------------------------
// automate browsing
// tells the browser to go on to next website

function crawl(tabs) {
	if(pageVisitedCounter % 30 == 0){
		console.clear()
		console.warn("cleared console at "+ pageVisitedCounter)
	}

		if(crawlFlag && (pageVisitedCounter+1 < crawlStopNumber) ){ 

            switchTabsAfterXPageVisits(pageVisitedCounter).then( (res)=>{
                console.log("promise resolved:" + res)
                var querying = browser.tabs.query({currentWindow:true});
                
                querying.then((newTabs) => {
                    tabToCrawlOn = newTabs[0].id
                    console.log("crawling now on " + urlList[pageVisitedCounter+1].url + " with tab: " + tabToCrawlOn)
                    
                    var updating = browser.tabs.update(tabToCrawlOn, {
                        active: true,// makes the tab to crawl on active (puts it into focus)
                     url:"http://www." + urlList[++pageVisitedCounter].url
                    //work on this part. maybe the list provides the full url to the destination
                    });
                
                
                    updating.then(onUpdated, onError);
                    
                    setTimeout(
                        function(){ 	
                            // throws undefined at the end of crawl
                            // console.log("[Callback Timeout]: visiting next website:", urlList[pageVisitedCounter+1].url);
                            var querying = browser.tabs.query({currentWindow:true});
                            querying.then(crawl, onError); 
                        },	CONFIG.timeSpentOnEachWebsite
                );
                }).catch(onError);  
            } ).catch(err => console.warn("error in crawl function:",err))
		}
		else{
			
			if((pageVisitedCounter+1 == crawlStopNumber)){

				console.warn("-- Crawl finished--")
				console.warn("got stuck on these pages: ",pageStuckArray)
				console.warn("Crawl took a long time")
			}
			else
				console.warn("failed to crawl? current: " + pageVisitedCounter + "| stopNumber: " + crawlStopNumber)
		}
	
}

// the idea was to switch tabs after a certain amount of pages visits to avoid crashes (by freeing up memory/cache?)
// turns out this function only works on Windows, and most of the crashes where fixed by allocating more Memory to the emulators
async function switchTabsAfterXPageVisits(__rank) {
    // if(navigator.appVersion.includes("Android"))
        return 0;
	// console.log("checking to switch tabs at",__rank)
    //         if(__rank % 3 == 0 && __rank > 0){
    //             var creating = browser.tabs.create({
    //                 url:emptySiteForNewTab,
    //                 index:0,
    //                 active:true
    //             });
            
    //             creating.then((tab)=> {
    //                 let newTabId = tab.id;
    //                 tabToCrawlOn = tab.id;
    //                 let tabIDArray = [];
    //                 let querying = browser.tabs.query({});
    //                 querying.then((tabs)=> {
    //                     console.log(tabs)
    //                     for (let tab of tabs) {
    //                         if(tab.id != newTabId)
    //                             tabIDArray.push(tab.id);
    //                     }
            
    //                     console.log("removing tabs:",tabIDArray)
    //                     var removing = browser.tabs.remove(tabIDArray);
    //                     removing.then(()=> {
    //                         console.warn("instrumentation trying to switch tabs");

    //                         let querying = browser.tabs.query({});
    //                         querying.then(tabs => console.warn("new tabs:",tabs));


    //                         return 1;
    //                     })
    //             }, onError);
    //         })
    //     } else{
    //         return 0;
    //     }    
  }

function onUpdated(tab) {
	console.log("##onUpdated crawler: " + tab.url)
	//not actualy an event listener like I thought, but just a callback function aka promise acceptance handler
	let payload = {
		"timestamp":new Date(),
		"url":urlList[pageVisitedCounter].rank,
		"useragent":"--", //this data is inserted by the background script
		"flag":0, // 0 = flow control, info message like site visit
		"comment":"__pageVisit__",
		"rank":urlList[pageVisitedCounter].rank,
		"arrayPos":pageVisitedCounter,
		"dbCollectionName":dbCollectionName,
		"stop":crawlStopNumber
	};
	sendDataToEndpoint(payload);

	// if(pageStuck == tab.url) {	
	// 	console.warn("##onUpdated Crawl tab is stuck: " + pageStuck,tab.url)
	// 	//pageStuck = (' ' + tab.url).slice(1);
	// }
	// else 
	// 	//perform deep copy of tab url
	// 	// https://stackoverflow.com/questions/31712808/how-to-force-javascript-to-deep-copy-a-string
	// 	// var string_copy = (' ' + original_string).slice(1);
	let pageStuck = (' ' + tab.url).slice(1); //save the url of the last page you visited and compare it with the recent one
		
	let deepCopyPageVisitedCounter = parseInt((' ' + pageVisitedCounter).slice(1))

	//if a page gets stuck or takes to long to load, handle it here
	// timeout to check if the crawler is still on the same tab
	setTimeout(()=>{
		pageStuckChecker(pageStuck,deepCopyPageVisitedCounter)
	},(CONFIG.timeSpentOnEachWebsite * 1.5))
}

function pageStuckChecker(urlToCompareTo,oldPageRank){
     var querying = browser.tabs.query({currentWindow:true});
    querying.then((res)=> {
            tabToCrawlOn = res[0].id
            console.log("**pageStuckerChecker comparing " + urlToCompareTo + " vs " + res[0].url + " and " + oldPageRank + " vs " + pageVisitedCounter)
            if(res[0].url === urlToCompareTo && crawlFlag) {
                console.warn("**crawling tab is stuck! " + urlToCompareTo + " vs " + res[0].url, oldPageRank)
                if (pageStuckArray.includes(oldPageRank)){

                    let payload = {
                        "url":oldPageRank,
                        "useragent":globalUseragent, //this data is inserted by the background script
                        "flag":0, // 0 = flow control, info message like site visit
                        "comment":"__pageStuckSkip__",
                        "rank":oldPageRank
                    };
                    sendDataToEndpoint(payload);

                    skipPageAfterStuckPage(oldPageRank);
                } else{
                    pageStuckArray.push(oldPageRank);

                    let payload = {
                        "url":oldPageRank,
                        "useragent":globalUseragent, //this data is inserted by the background script
                        "flag":0, // 0 = flow control, info message like site visit
                        "comment":"__pageStuck__",
                        "rank":oldPageRank
                    };
                    sendDataToEndpoint(payload);

                    fixCrawlAfterStuckPage(oldPageRank);
                }

                
            }
    }, onError);
}

// bad readable code
function fixCrawlAfterStuckPage(oldPageRank){
	pageStuck = ""
	stopCrawl()
	var removing = browser.tabs.remove(tabToCrawlOn);
	removing.then(() => {
		console.warn("**removed tab to crawl on ")

		var creating = browser.tabs.create({
			url:"about:blank"
		  });

		creating.then(()=> {
			//timeout to avoid firefox crashing
			setTimeout(()=> {
				console.warn("restarting crawl on new tab");
				startCrawl(globalUseragent,oldPageRank,crawlStopNumber)
			},(CONFIG.timeSpentOnEachWebsite))
		}, onError);

	}, onError);

}

function skipPageAfterStuckPage(oldPageRank){
	console.warn("**skipping stuck page ")
	fixCrawlAfterStuckPage(oldPageRank+2) // + 2 because the page that is stuck is +1. So the next (hopefully) working website is +2
	//the current value of oldPageRank is the last known working/unstuck website
}

function onError(error) {
  console.log(`Caught Error: ${error}`);
  if(error.toString().includes('Invalid tab ID')){
	console.warn("The active crawling tab was closed!--> attempting to switch crawl tab to first tab id in tab array");
	var querying = browser.tabs.query({currentWindow:true});
	querying.then(updateFirstTab, onError);

  }
}

//this load the first page when crawling -> after that crawl() takes over
function updateFirstTab(tabs) {
  var updating = browser.tabs.update(tabs[0].id, {
    active: true, // makes the tab to crawl on active (puts it into focus)
    url: "http:\\www." + urlList[pageVisitedCounter].url
  });
  //always crawl on the first tab
  tabToCrawlOn =  tabs[0].id;
  
  updating.then(onUpdated, onError);
  
  setTimeout(
	function(){ 	
	var querying = browser.tabs.query({currentWindow:true});
	querying.then(crawl, onError); 
	},	CONFIG.timeSpentOnEachWebsite);
}