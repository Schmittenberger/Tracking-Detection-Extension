const CONFIG = {
	baseURL :   "http://192.168.1.21:8080",
	collector : "/collector",
	listPath : "/topsites",
	emptyPath : "/tracking_examples/empty.html",

	// the time spent on each page before navigating to the next one
	timeSpentOnEachWebsite : 10000,

	// when the extension crashes / reloads / is installed try to continue a current crawl
	// the state of a current crawl is saved in the node.js endpoint
	// toggle continue crawl where it was left off
	restartCrawlOnInstallAndroid : true,

	// same as above: tries to continue a crashed crawl
	// but more general, use this when crawling on anything other than Android
	generalRestartCrawlOnInstall :false
}

// POPUP Configuration
const PopupConfig = {
	//available mongoDB Collection Names from the Popup browser action
	// the first one is used by default, so order your intended crawl name first
	dbCollectionNames : [
		"test","prototype","International"
	],
	deviceName : "Android10-x86",
	//change these default values if you don't want to manually set them when starting a crawl
	defaultCrawlStart : 0,
	defaultCrawlStop : 1000
}