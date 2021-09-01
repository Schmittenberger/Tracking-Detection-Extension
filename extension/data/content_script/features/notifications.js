
	//notification access checker
	const notificationsPermission = Notification.permission;
	Object.defineProperty(Notification, "permission", {
	get() { handleDetection("notification",1);return notificationsPermission}
	});	
	
	const notificationsReqPerm = Notification.requestPermission;
	Object.defineProperty(Notification, "requestPermission", {
	"value": function () {
	  handleDetection("notification",1)  
	  return notificationsReqPerm.apply(this, arguments);
	  
	}
	});	

