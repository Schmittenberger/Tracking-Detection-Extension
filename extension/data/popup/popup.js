crawlingActive = false;
getCrawlStatus();
loadConfig()

function loadConfig(){

	//deviceName & dbCollectionNames are imported from config.js
    let select = document.getElementById('crawlListSelect');
   	document.getElementById('dname').value = PopupConfig.deviceName;
    document.getElementById('cstartInput').value = PopupConfig.defaultCrawlStart;
    document.getElementById('cstopInput').value = PopupConfig.defaultCrawlStop;



	PopupConfig.dbCollectionNames.forEach ((item)=> {
    var opt = document.createElement('option');
    opt.value = item;
    opt.innerHTML = item;
    select.appendChild(opt);
})

}


function handleMessage(request, sender, sendResponse) {
//   console.log("[Popup]: Message from the content script: " + request);
//   console.log(request);
	document.getElementById("content").innerHTML = "trash";
  sendResponse({response: "popup receievd message."});
}

browser.runtime.onMessage.addListener(handleMessage);

document.getElementById('crawlBt').addEventListener('click', crawlClick);
// document.getElementById('resetCrawl').addEventListener('click', resetCrawl);
document.getElementById('stopCrawl').addEventListener('click', stopCrawlBefore);

function handleResponse(message) {
  console.log(`Message from the background script:  ${message.response}`);
}

function handleError(error) {
  console.log(`Error: ${error}`);
}

function crawlClick(){
if(!crawlingActive){
	startCrawl();
	setTimeout(getCrawlStatus,1000)
} else{
	stopCrawl();
	document.getElementById("crawlBt").innerHTML = "Resume Crawl";
	document.getElementById("crawlBt").style.backgroundColor = "rgb(46,75,68)";
	setTimeout(getCrawlStatus,2000)
}
  

}

function startCrawl(){
	let crawlStartInterval = document.getElementById("cstartInput").value
	let crawlStopInterval = document.getElementById("cstopInput").value
	let crawlName = document.getElementById("crawlListSelect").value

	devicename = document.getElementById("dname").value;
  var sending = browser.runtime.sendMessage({
    message_payload: {
			"timestamp":new Date(),
			"url":"__crawlSTART__",
			//"useragent":"--" //this data is inserted by the background script
			"useragent":devicename, //try using own defined useragent via popup window
			"flag":0, // 1 = detection of js function | 0 = flow control, info message like site visit
			"method":"__crawlSTART__",
			"start":crawlStartInterval,
			"stop":crawlStopInterval,
			"dbCollectionName":crawlName
		}
  });
  sending.then(handleResponse, handleError);

  setInterval(function(){ if(crawlingActive) getCrawlStatus(); }, 3000);
}

function stopCrawlBefore(){
	document.getElementById("crawlBt").innerHTML = "Start Crawl";
	document.getElementById("crawlBt").style.backgroundColor = "rgb(46,75,68)";
	stopCrawl()
}

function stopCrawl(){
	crawlingActive = false;
 	var sending = browser.runtime.sendMessage({
    message_payload: {
			"url":"__crawlSTOP__",
			"useragent":"--",//this data is inserted by the background script
			"flag":0, // 1 = detection of js function | 0 = flow control, info message like site visit
			"method":"__crawlSTOP__"
		}
  });
  sending.then(handleResponse, handleError);
}

function resetCrawl(){
	let crawlStartInterval = document.getElementById("cstartInput").value
	let crawlStopInterval = document.getElementById("cstopInput").value
	let crawlName = document.getElementById("crawlListSelect").value

	let r = confirm("This will completly reset your crawl and start over. Are you sure?");
	if(r){
		crawlingActive = false;
		var sending = browser.runtime.sendMessage({
		message_payload: {
				"timestamp":new Date(),
				"url":"__crawlRESET__",
				"useragent":"--",//this data is inserted by the background script
				"flag":0, // 1 = detection of js function | 0 = flow control, info message like site visit
				"method":"__crawlRESET__",
				"start":crawlStartInterval,
				"stop":crawlStopInterval,
				"dbCollectionName":crawlName
			}
		});
		sending.then(handleResponse, handleError);
	}
}

function handleCrawlStatus(message) {
	console.log(`Popup crawl status:  ${message.response}`);
	crawlingActive = message.response;
	if(message.response){
		document.getElementById("crawlBt").innerHTML = "Pause Crawl";
		document.getElementById("crawlBt").style.backgroundColor = "#9c5b1e";

		document.getElementById("crawlStatus").innerHTML = message.progress;
	} else{
		document.getElementById("crawlStatus").innerHTML = "inactive | " + message.progress;
		if(message.progress > 0) {
			document.getElementById("crawlBt").innerHTML = "Resume Crawl";
			document.getElementById("crawlBt").style.backgroundColor = "rgb(46,75,68)";
		}
	}
}

function getCrawlStatus(){
	  var sending = browser.runtime.sendMessage({
    message_payload: {
			"timestamp":new Date(),
			"url":"__crawlStatus__",
			"useragent":"--", //this data is inserted by the background script
			"flag":0, // 1 = detection of js function | 0 = flow control, info message like site visit
			"method":"__crawlStatus__" //later on replace string comparisions with ints for better performance
		}
  });
  sending.then(handleCrawlStatus, handleError);
}

