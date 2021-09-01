


	// -----  Sensor checker
	//Gyroscope doesnt work right now
	// but its depreciated anyway
	/*
	Object.defineProperty(Gyroscope, "x", {
	get() { handleDetection("Gyroscope.x",5);return 0.3}
	});*/
	
	const elistener = window.addEventListener;
	Object.defineProperty(window, "addEventListener", {
	"value": function () {
		/*
	  if(arguments[0] == "deviceorientation"){
		  handleDetection("deviceorientation event listener",5);
		  console.log("extension detected device orientation event listener");
	  }
	  if(arguments[0] == "devicemotion"){
		  handleDetection("devicemotion event listener",5);
		  console.log("extension detected device motion event listener");
	  }*/
	  
		switch(arguments[0]){
		case "deviceorientation":
			handleDetection("orientation",5);
			console.log("extension detected device orientation event listener");
			break;
		case "devicemotion":
			handleDetection("motion",5);
			console.log("extension detected device motion event listener");
			break;
		default:
			break;
		}
	  
	  return elistener.apply(this, arguments);  
	},
	writable:true
	}); 

	
	

	


/*



	// -----  Sensor checker
	//Gyroscope doesnt work right now :(
	/* comment
	Object.defineProperty(Gyroscope, "x", {
	get() { handleDetection("Gyroscope.x",5);return 0.3}
	});*/
	/* real
	
	const elistener = window.addEventListener;
	Object.defineProperty(window, "addEventListener", {
	"value": function () {
		
		switch(arguments[0]){
		case "deviceorientation":
			handleDetection("touchstart event listener",5);
			console.log("extension detected touchstart event listener");
			break;
		case "devicemotion":
			handleDetection("devicemotion event listener",5);
			console.log("extension detected device motion event listener");
			break;
		default:
			break;
		}*/
	  /*if(arguments[0] == "deviceorientation"){ //backuop
		  handleDetection("deviceorientation event listener",5);
		  console.log("extension detected device orientation event listener");
	  }
	  if(arguments[0] == "devicemotion"){
		  handleDetection("devicemotion event listener",5);
		  console.log("extension detected device motion event listener");
	  }*/
	  /*
	  return elistener.apply(this, arguments);  
	},
	writable:true
	}); 

	
	

	
*/