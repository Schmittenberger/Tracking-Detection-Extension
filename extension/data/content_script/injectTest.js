
//test if injecting javascript into site was successful (check for Content Security Policy blocking injection)
console.log("succesfully injected script")

//hiding popup windows 
window.alert = function alert(msg) { console.log('Hidden Alert: ' + msg); };
window.confirm = function confirm(msg) { 
    console.log("Hidden Confirm: " + msg); 
    return true; /*simulates user clicking yes*/ 
};
window.prompt = function prompt(msg,value) { 
    console.log("Hidden Prompt " + msg); 
    return "123";
};

let payload_data = {
    "timestamp":new Date(),
    "url":document.URL,
    "useragent":"--", //this data is inserted by the background script
    "flag":10,  //injecting script into site was succesful
    "method":'Inject succesful for ' + document.URL
};
console.log("sending message")
var payload = { type: "§OVGU_FROM_PAGE_TO_EXTENSION_TT§", text: payload_data};

    window.postMessage(payload, "*");