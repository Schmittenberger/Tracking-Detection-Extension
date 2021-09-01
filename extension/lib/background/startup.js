const baseURL = CONFIG.baseURL;
const dataCollectionEndpointAddress = baseURL + CONFIG.collector;
const siteListEndpointAddress = baseURL + CONFIG.listPath;
const emptySiteForNewTab = baseURL + CONFIG.emptyPath;

//----- startup handling -----

// continue where the crawl left off
if((navigator.appVersion.includes("Android") && CONFIG.restartCrawlOnInstallAndroid) || CONFIG.generalRestartCrawlOnInstall)
  getCrawlStatusOnInstall()

function getCrawlStatusOnInstall(){
	var req = new Request(baseURL + "/statusRaw", {
        method: 'GET',
        redirect: 'follow',
        referrer: 'client'
    });

    fetch(req).then(function (response) {
		return response.json();
	  })
	  .then(function (data) {
		  console.log(data)
		if(data.status) {
			setTimeout(
				()=> {restartCrawlOnInstall(data);},4000
			)
			
		}
	  }).catch(error => { console.error(error); });
}

function restartCrawlOnInstall(data){
	dbCollectionName = data.dbCollectionName;
	console.warn("type of collection name: " + typeof data.dbCollectionName, data.dbCollectionName)

    var creating = browser.tabs.create({
        url:emptySiteForNewTab,
         index:0,
        active:true
     });

     creating.then((tab)=> {
        let newTabId = tab.id;
        let tabIDArray = [];
        console.warn("new tab id:",tab.id)
        let querying = browser.tabs.query({});
        querying.then((tabs)=> {
            console.log(tabs)
            for (let tab of tabs) {
                if(tab.id != newTabId)
                    tabIDArray.push(tab.id);
            }

            console.log("removing tabs:",tabIDArray)
            var removing = browser.tabs.remove(tabIDArray);
            removing.then(()=> {
                console.warn("removed all tabs");
                console.warn("restarting crawl from server after install on: " + data.useragent + " " + " from "+ data.progress + " up to " + data.stop);
                startCrawl(data.useragent,data.progress,data.stop);
        })
    }, onError);
       
})
}

//not used test function 
async function closeAndOpenNewTab(){

    var creating = browser.tabs.create({
        url:emptySiteForNewTab,
         index:0,
        active:true
     });

     creating.then((tab)=> {
        let newTabId = tab.id;
        let tabIDArray = [];
        let querying = browser.tabs.query({});
        querying.then((tabs)=> {
            console.log(tabs)
            for (let tab of tabs) {
                if(tab.id != newTabId)
                    tabIDArray.push(tab.id);
            }

            console.log("removing tabs:",tabIDArray)
            var removing = browser.tabs.remove(tabIDArray);
            removing.then(()=> {console.warn("removed all tabs")})
    }, onError);
})

}
// -------------------------