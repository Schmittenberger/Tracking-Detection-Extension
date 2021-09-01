
	//localStorage check
	//also send the names of the items being set
	
	[ //somehow localStorage also detects sessionStorage events <-- this
	[window.localStorage.__proto__,"setItem",window.localStorage.__proto__.setItem],
	[window.localStorage.__proto__,"getItem",window.localStorage.__proto__.getItem]
	].forEach(function (currentValue, index, array) {
		Object.defineProperty(currentValue[0], currentValue[1], {
		"value": function (old) {
			//get item argument[1] is undefined
			// if(index == 0)
			// 	handleDetection("localStorage/sessionStorage " + currentValue[1] +" "+ arguments[0] + " to " +arguments[1],4);
			// else if(index == 1)
			// 	handleDetection("localStorage " + currentValue[1] +" "+ arguments[0],4);
			handleDetection("local_sessionStorage",4);
			//works but spams the console
			return currentValue[2].apply(this, arguments);
		}
		});
	});
	
	//it is possible to set items in localStorage by assigning them e.g. localStorage.uni = "OvGU", bypassing setItem()
	//[window.localStorage.__proto__,"setItem",window.localStorage.__proto__.setItem]

	//this doesnt work yet!
	
		/*Object.defineProperty(window, localStorage, {
		get() {
			console.log("[EXT]: localStorage unclean get " + arguments[0])
		  handleDetection("localStorage unclean get " + arguments[0],4);
		  //return currentValue[2].apply(this,arguments);
		  return window.localStorage.getItem(arguments[0]);
		},
		set() {
			console.log("[EXT]: localStorage unclean set " + arguments[0])
			handleDetection("unclean set" ,4);
			return currentValue[2].apply(this,arguments);
		  }
		});*/
		/*
		Object.defineProperty(window, "Cache", {
		"value": function () {
		  handleDetection("Cache ",4);
		  //return currentValue[2].apply(this,arguments);
		  return Object.getOwnPropertyDescriptor(window, "Cache").getItem(arguments[0]);
		}
		});*/
		
		//cache
		//reading the contents of the cache is not straightforward, as this function returns a promise (or something like that)
		//so the response is not immediately available, 
		//AND cache.match is not detected?
	
	//chrome is much stricter with usign cache on non-HTTTPS websites
	//cache is undefined on insecure websites in chrome
	//whereas in firefox cache is still defined even on insecure (HTTP) websites
	if (navigator.userAgent.indexOf("Chrome") == -1 || location.protocol == 'https:'){
		[
		[window.caches.__proto__,"open",window.caches.__proto__.open],
		[window.caches.__proto__,"match",window.caches.__proto__.match]
		].forEach(function (currentValue, index, array) {
			Object.defineProperty(currentValue[0], currentValue[1], {
			"value": function (old) {
				handleDetection("cache",4);
				return currentValue[2].apply(this, arguments);
			}
			});
		});
	}
	
	//indexDB
	//window.indexedDB.open("toDoList", 4)
	[
	[window.indexedDB.__proto__,"open",window.indexedDB.__proto__.open],
	].forEach(function (currentValue, index, array) {
		Object.defineProperty(currentValue[0], currentValue[1], {
		"value": function (old) {
			handleDetection("indexDB",4);
			return currentValue[2].apply(this, arguments);
		}
		});
	});