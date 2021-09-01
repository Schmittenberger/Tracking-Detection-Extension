//website class
// in the beginning everything is set to false
// if something is detected ONLY then is it set to true 
class websiteClass {
	constructor(rank,url) {
		// if(typeof rank == 'undefined') {
        // rank = -1;
		// } else this.__rank = rank;
		
		this.__rank = (typeof rank == 'undefined') ? -1 : rank
		this.__url = (typeof url == 'undefined') ? '-1' : url
		// this.__url = url;

		this.db_object = { 
			_id:this.__rank,
			rank: this.__rank, 
			url: this.__url,	
			timestamp: "undefined",
			device:"undefined",
			injectSuccessful:false,
			// fingerprinting uses the payload flag of 3
			fingerprinting :{
				canvas:false,
				webgl:false,
				audio:false,
				font:false,
				canvasCollected:[],
				webglCollected:[],
				audioCollected:[],
				fontCollected:[],
			},
			// storage uses flag 4
			storage:{
				local_sessionStorage:false,
				cache:false,
				indexDB:false,
			},
			// sensors use flag 5
				sensors:{
					orientation:false,
					motion:false
			},
			// cokies use flag 2
			// cookies:[{url:"abc",value:"xyz",scope:"strict"},{url:"abc2",value:"xyz2",scope:"strict"}],
			cookies:[],
			battery:false,
			notification:false,
			geolocation:false,
			webVR:false,
		};
	}
	
}

module.exports ={ websiteClass}