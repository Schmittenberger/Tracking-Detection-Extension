const http_port = 8080;
const https_port = 9090;

const path = require('path');
const express = require('express');
const csv = require('csv-parser');
const fs = require('fs'); 
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const http = require('http');
const app = express();
const router = express.Router();

const mongoConnector = require("./mongoConnector.js");

const dataCollectionPath = "/collector";
const topSitesPath = "/topsites";
const topSitesFilename = "top-1m.csv";
const csvReducerPath = "/csvreduce";
const maxAmountOfSites = 12010;
const dbName = "InjectionFix";
const csvReducedFilename = "top-10k.csv";

//save the state of the crawl server side 
// can automatically restore crawl after crashes
var crawlingActiveFlag = false;
var crawlingProgess = -1;
var crawlingStop = -1;
var crawlingUseragent = "";
var curArrayPos = 0;

// time to wait before saving an entry in the database
const timeoutBeforeSavingWebsiteInfo = 22000;

//HTTPS certificate
//first read https setup.txt in this folder
// then uncomment this part and another part down below (around line ~110)
// you only need HTTPS when testing certain tracking methods locally (e.g. testing geolocation on your smart phone)
/*var https = require('https')
const key2 = fs.readFileSync('key.pem');
const cert2 = fs.readFileSync('./cert.pem');
*/
var crawlSitesUrlArray = []
var dbCollectionName = ""


// adding body post data parser to access post data sent from a request
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//website class
const myWebsiteClass =require("./database/websiteClass.js");
const numberOfWebsitesToVisit = maxAmountOfSites;
// new myWebsiteClass.websiteClass(2,"abc")

var websiteInfoArray = new Array(numberOfWebsitesToVisit)
for(var i=0;i < numberOfWebsitesToVisit;i++){
	websiteInfoArray[i] = new myWebsiteClass.websiteClass(i,"tempUrl")
}
//-------- websockets -------------

const WebSocket = require('ws');
const wserver = new WebSocket.Server({
  port: 8181
});

let sockets = [];
wserver.on('connection', function(socket) {
  sockets.push(socket);
	socket.send(getStatusAsJson());
	// console.log("sockets:",sockets)
	console.log("socket connected")
  socket.on('message', function(msg) {
	  console.log("recieved websocket message",msg)
    // sockets.forEach(s => s.send(msg));
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', function() {
    sockets = sockets.filter(s => s !== socket);
  });
});







// --------- end of websockets ------------

//console.log(websiteInfoArray[2])
 //mongoConnector.addToDatabase("Tracking-Trackers","prototype22",new myWebsiteClass.websiteClass(3,"aadbc").db_object)

//start the http and https version of the server
//include non https version because of the self signed certificate
//it is too much of a hassle to accept the "insecure" certificate each time
//https is only needed for testing certain tracking methods that require a secure context
const httpServer = http.createServer(app);
httpServer.listen(http_port, () => {
    console.log('Started extension data endpoint on port ' + http_port + ' (http)');
});

// ----------- uncomment for HTTPS Server --------
/*
const server = https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
}, app);

server.listen(https_port, () => {
     console.log('... extension data endpoint on port ' + https_port+ ' (https)');
});
*/
// ----------------------------------------------

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/status', function(req, res) {
	res.sendFile(path.join(__dirname + '/status.html'));
});

// Note: the body parser module is required to read the post data
// post data is inside req.body
router.post(dataCollectionPath,function(req,res){

	switch(req.body.flag ) {
		case 0: //flow control
		
				console.log("[0]:" + req.body.comment + " from " + req.body.url + " |rank:" +req.body.rank );
				// the __pageVisit__ flag is called when a tab is updated by the crawler
				// most importantly this tells us the crawler has moved on to the next site
			if(req.body.comment === "__pageVisit__"){
				websiteInfoArray[req.body.rank].db_object.device = req.body.useragent
				// if the server crashes during a crawl it can pick up where it left off
				// by using the information we send with each page visit
				crawlingUseragent = req.body.useragent
				crawlingProgess = req.body.rank;
				curArrayPos = req.body.arrayPos;
				if(typeof req.body.dbCollectionName == "String" || req.body.dbCollectionName != "")
					dbCollectionName = req.body.dbCollectionName;
				else {
					console.warn("db collection name is empty or not a string")
					dbCollectionName = "undefinedDbCollectionName"
				}
				sockets.forEach(s => s.send(
					getStatusAsJson()
					)	
				);
				if(sockets.length > 0)
					for(index in sockets){
						sockets[index].send(getStatusAsJson());
					}
				crawlingStop = req.body.stop
				crawlingActiveFlag = true;
				try{
					console.log("[0]: pagevisit " + req.body.rank + " " + crawlSitesUrlArray[req.body.rank].url)
					// website ranks always start at 1!
					// if they start at 0 then remove the -1
					websiteInfoArray[req.body.rank].db_object.url = crawlSitesUrlArray[req.body.rank].url
				} catch {
					console.warn("failed to get url from undefined" + req.body.rank,crawlSitesUrlArray[req.body.rank])
					// console.warn("failed to get url from undefined")
				}
				websiteInfoArray[req.body.rank].db_object.timestamp = req.body.timestamp
				setTimeout(() => {
					// if(typeof crawlSitesUrlArray[req.body.rank] != "undefined")
						// console.warn("[0] --- now saving: " + req.body.rank + " : " + crawlSitesUrlArray[req.body.rank].url + " in database");
					addWebsiteInfoToDatabase(req.body.rank)
					},timeoutBeforeSavingWebsiteInfo)
			}	
			if(req.body.method === "__crawlSTART__"){
				console.log("[0] crawl start| saving in db:",req.body.dbCollectionName);
				crawlingActiveFlag = true;
				crawlingProgess = parseInt(req.body.start);
				crawlingStop = parseInt(req.body.stop);
				crawlingUseragent = req.body.useragent
				dbCollectionName = req.body.dbCollectionName
			}	
			if(req.body.method === "__crawlSTOP__"){
				console.log("[0] crawl stop");
				//not doing anything because most of the times a __crawlStop is caused by the extension crashing and restarting
				// and then when it restarts it needs to retrieve the crawl status
				// crawlingActiveFlag = false;
				// crawlingProgess = -1;
				// crawlingStop = -1;
				// crawlingUseragent = "";
				// dbCollectionName = req.body.dbCollectionName
			}
			if(req.body.comment === "__pageStuck__"){
				console.warn("[0] crawl got stuck on",req.body.rank);
				// dbCollectionName += "s"
				
				let errorObject = new myWebsiteClass.websiteClass(req.body.rank,"__pageStuck__").db_object
				errorObject.device = req.body.useragent
				mongoConnector.addToDatabase("Tracking-Trackers","errors",errorObject)
			}
			if(req.body.comment === "__pageStuckSkip__"){
				console.warn("[0] skipping stuck page on",req.body.rank);
				
				let errorObject = new myWebsiteClass.websiteClass(req.body.rank,"__pageStuckSkip__").db_object
				errorObject.device = req.body.useragent
				mongoConnector.addToDatabase("Tracking-Trackers","errors",errorObject)
			}				
			break;
		case 1: //function detection
			// console.log("[1]" + req.body.method + " from " + req.body.url);// + " | " + req.body.useragent);
			websiteInfoArray[req.body.rank].db_object[req.body.method] = true
			break;	
		case 2: //cookie info
			//console.log("got cookie :" + req.body.method);
			//console.log(websiteInfoArray[req.body.rank].db_object.cookies)
			websiteInfoArray[req.body.rank].db_object.cookies.push(req.body.method);
			break;	
			
		// fingerprinting info
		case 31: // canvas fingerprinting
			// receive an object containing info about the caught fingerprinting method. this info could include for example:
			// text,color,shapes used
			// console.log("[31]: canvas fingerprint:" + req.body.method)
			websiteInfoArray[req.body.rank].db_object.fingerprinting.canvas = true
			websiteInfoArray[req.body.rank].db_object.fingerprinting.canvasCollected.push(req.body.method)
			break;
		case 32: //webgl fingerprinting
			// console.log("[32]: webgl fingerprint:" + req.body.method)
			websiteInfoArray[req.body.rank].db_object.fingerprinting.webgl = true
			websiteInfoArray[req.body.rank].db_object.fingerprinting.webglCollected.push(req.body.method)
			break;
		case 33: //audio fingerprinting
			// console.warn("[33]: audio fingerprint:" + req.body.method)
			websiteInfoArray[req.body.rank].db_object.fingerprinting.audio = true
			websiteInfoArray[req.body.rank].db_object.fingerprinting.audioCollected.push(req.body.method)
			break;
		case 34: //font fingerprinting
			// console.log("[34]: font fingerprint:" + req.body.method)
			websiteInfoArray[req.body.rank].db_object.fingerprinting.font = true
			websiteInfoArray[req.body.rank].db_object.fingerprinting.fontCollected.push(req.body.method)
			websiteInfoArray[req.body.rank].db_object.fingerprinting.canvasCollected.push(req.body.method)
			break;

			
		case 4: //storage info
			// handle storage 
			// console.log("[4]Storage:" + req.body.method)
			websiteInfoArray[req.body.rank].db_object.storage[req.body.method] = true
			break;	
		case 5: //sensors
			// todo: either orientation or motion
			//console.log("[5] Sensors: " + req.body.method)
			websiteInfoArray[req.body.rank].db_object.sensors[req.body.method] = true
			break;	
		case 10: //injecting script into site was succesful
			// todo
			try {
				//if a crawl hasnt been started then crawlSitesUrlArray[req.body.rank].url is undefine
				console.warn("[10]" + truncateString(req.body.method,50) + "| and rank:" + req.body.rank + " for " + crawlSitesUrlArray[req.body.rank].url)
			} catch{
				console.warn("[10]" + req.body.method + "| and rank:" + req.body.rank)
			}
			if(req.body.url != "about:blank"){
				websiteInfoArray[req.body.rank].db_object.injectSuccessful = true
			}
			else {
				console.log("[10]: caught about:blank|",req.body.url)
			}
			break;
		case 999: //Other methods | currently touch events api
			//console.log(req.body.method + "|rank: " + req.body.rank)
			break;
		default:
			// code block
	} 	
	//console.log(websiteInfoArray)
	if((req.body.rank == -1 || typeof req.body.rank == "undefined") && req.body.comment != "page load") {
	console.warn("-- Error --" )
	console.warn(req.body)
	console.warn("----------------end of error-----------" )
	}
	
	// console.log("[---]type of message:" +req.body.flag + "| page rank of: " + req.body.rank )
	//console.log("[---] message:",req.body )
	
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	//res.status(200).send(JSON.stringify({'response':'Thank you'}))
	res.status(200).send()
  
});

router.get("/statusRaw",function(req,res){
	
	console.log("asking for crawl status")
	// console.log("requesting crawl status: " + (crawlingActiveFlag ? ("active: " + crawlingProgess) : "inactive") )
	
	// allow cross origin access, otherwise the request is blocked by browsers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Content-Type', 'application/json');
  
  res.status(200).send(getStatusAsJson());
});

function getStatusAsJson(){
	return JSON.stringify(
	{"status": crawlingActiveFlag,"progress":curArrayPos,"stop":crawlingStop,"useragent":crawlingUseragent,"dbCollectionName":dbCollectionName}
  )
}

//get a list of urls to crawl
//requires &amount and &start parameters in the get request
router.get(topSitesPath,function(req,res){
	
	//console.log(req)
	console.log("requesting top websites| start:" + req.query.start +"| amount:"+req.query.amount)
	
	// allow cross origin access, otherwise the request is blocked by browsers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Content-Type', 'application/json');
  
	if(req.query.amount && req.query.start){
		//check for an amount thats more than I can serve
		const amount = req.query.amount > maxAmountOfSites ? res.status(500).send({"res":"You are asking for too much"}) : parseInt(req.query.amount);
		const start = parseInt(req.query.start);
		
		
		let results = [];

		let loopCounter = 0;
		fs.createReadStream(csvReducedFilename)
			.on('error', () => {
				console.log("error occured while reading " + csvReducedFilename + ". Check top sites csv reader")
				res.status(500).send('Error while reading CSV file.');
			})
		  .pipe(csv())
		  .on('data', (row) => {
			  if(loopCounter < (start + amount) && loopCounter >= start){
			  results.push(row)
			  }
			  loopCounter++;
		  })
		  .on('end', () => {
			res.status(200).send(results);
			console.log('CSV file successfully processed');
			crawlSitesUrlArray = results;
		  });
  } else{
	  res.status(500).send('Please use get parameters : &amount and &start to ask for the correct amount of urls you wish for.');
  }
  
 
});

//reduce csv file to only the needed amount of entries
// add rank, url to the top of the list
// or else it wont work!
router.get(csvReducerPath,function(req,res){
	
  //console.log(req)
  console.log("reducing csv list");

	const csvWriter = createCsvWriter({
	path: csvReducedFilename,
	header: [
	{id: 'rank', title: 'rank'},
	{id: 'url', title: 'url'}
	]
	});

	  var counter = 0;
	  var results = [];
	  fs.createReadStream(topSitesFilename)
			.on('error', () => {
				console.log("error occurred while reducing " + topSitesFilename + ". Check csv reducer")
				res.status(500).send('Error while reducing CSV file.');
			})
		  .pipe(csv({skipHeader:false}))
		  .on('data', (row) => {
			  if(counter < maxAmountOfSites){
				  results.push(row)
				  counter++;
			  }
		  })
		  .on('end', () => {
			console.log('CSV file successfully processed');
			csvWriter
			  .writeRecords(results)
			  .then(()=> console.log('The CSV file was reduced successfully'));
			  res.status(200).send("The CSV file was reduced successfully. Access it at " + topSitesPath + "?start=0&amount=100")
		  });
	
});

//get all urls containing ".de"
router.get("/de",function(req,res){
	
  //console.log(req)
  console.log("writing all german domains to file");

	const csvWriter = createCsvWriter({
	path: "DE" + csvReducedFilename,
	header: [
	{id: 'rank', title: 'rank'},
	{id: 'url', title: 'url'}
	]
	});

	  let counter = 0;
	  let resultsDE = [];
	  fs.createReadStream(topSitesFilename)
			.on('error', () => {
				console.log("error occurred while reducing " + topSitesFilename + ". Check csv reducer")
				res.status(500).send('Error while reducing CSV file.');
			})
		  .pipe(csv({skipHeader:false}))
		  .on('data', (row) => {
			  if(row.url.substring(row.url.length - 3).includes(".de")){
				  console.log(row.url);
				  row.rank = counter;
				  resultsDE.push(row);
				  counter++;
			  }
		  })
		  .on('end', () => {
			console.log('CSV file successfully processed');
			csvWriter
			  .writeRecords(resultsDE)
			  .then(()=> {
				  console.log('The DE CSV file was reduced successfully:' + resultsDE.length + " number of .de domains|" + counter)
				  }).catch(err => console.log(err));
			  res.status(200).send("The DE CSV file was reduced successfully. " + resultsDE.length)
		  });
	
});

//get all injectSuccessful false from kiwi browser crawl
router.get("/kiwi",function(req,res){
	const MongoClient = require('mongodb').MongoClient;
	const mongoDBUrl = "mongodb://localhost:27017/";
  //console.log(req)
  console.log("kiwi checker");
	try{
		MongoClient.connect(mongoDBUrl, {useUnifiedTopology: true},function(err, db) {
			if (err) console.warn(err);
			var dbo = db.db('Tracking-Trackers');
				dbo.collection('international_kiwi').find({injectSuccessful:false}, {projection:{_id:0,rank:1,url:1}}).toArray(function(err, result) {
					if (err) throw err;
					console.log("[MongoDB] Find results", result);
					res.json(result);
					db.close();
				})
				
				
			})
			//console.log("1 document inserted");

	} catch(err){ // most db errors happen when trying to insert a duplicate value because the old collection was not deleted in between crawls
		console.warn(err)
		res.send(400);
	}
	
	
});

//reassign all the pageranks and _id's of the fix for the german .de crawl
router.get("/deMerge",function(req,res){
	const MongoClient = require('mongodb').MongoClient;
	const mongoDBUrl = "mongodb://localhost:27017/";
  //console.log(req)
  var data = [];
  console.log("kiwi checker");
	try{
		MongoClient.connect(mongoDBUrl, {useUnifiedTopology: true},function(err, db) {
			if (err) console.warn(err);
			var dbo = db.db('Tracking-Trackers');
				dbo.collection('deutschland4fix').find({injectSuccessful:true}).toArray(function(err, result) {
					if (err) throw err;
					// console.log("[MongoDB] Find results", result);
					let counter = 10000;
					result.forEach((item)=>{
						item['_id'] = counter;
						item['rank'] = counter;
						counter++;
					})
					data = result;
					mongoConnector.addToDatabaseMany("Tracking-Trackers","de5fixed",data);
					
					res.json(result);
					db.close();
				})

			})
			//console.log("1 document inserted");

	} catch(err){ // most db errors happen when trying to insert a duplicate value because the old collection was not deleted in between crawls
		console.warn(err)
		res.send(400);
	}
	

});

//return all
router.get("/injectFix",function(req,res){

  
	if(req.query.collection){

		const MongoClient = require('mongodb').MongoClient;
		const mongoDBUrl = "mongodb://localhost:27017/";
		console.log("inject fix checking in: ",req.query.collection)
		try{
			MongoClient.connect(mongoDBUrl, {useUnifiedTopology: true},function(err, db) {
				if (err) console.warn(err);
				var dbo = db.db('Tracking-Trackers');
					dbo.collection(req.query.collection).find({injectSuccessful:false}, {projection:{_id:0,rank:1,url:1}}).toArray(function(err, result) {
						if (err) throw err;
						// console.log("[MongoDB] Find results", result);
						res.json(result);
						db.close();
					})
					
					
				})
				//console.log("1 document inserted");

		} catch(err){ // most db errors happen when trying to insert a duplicate value because the old collection was not deleted in between crawls
			console.warn(err)
			res.send(400);
		}
	} else{
	  res.status(500).send('Please use get parameter : ?collection');
	}


});
// combine()
var resArray = [];
async function combine(){
		// dbName = 'Tracking-Trackers';
		dbName = 'Capped';
	collections = ['int_ff_emulator','int_ff_realPhone',
					'int_ff_win10','int_kiwi_emulator'];
	let t1 = await mongoConnector.findInCollection(dbName,collections[0],{})
	let t2 = await mongoConnector.findInCollection(dbName,collections[1],{})
	let t3 = await mongoConnector.findInCollection(dbName,collections[2],{})
	let t4 = await mongoConnector.findInCollection(dbName,collections[3],{})
	
	console.log("t1",t1.length)
	console.log("t2",t2.length)
	console.log("t3",t3.length)
	console.log("t4",t4.length)
	
	// resArray.push(t1);
	resArray.push(t2);
	resArray.push(t3);
	// resArray.push(t4);
	
	let common = resArray.reduce((p, c) => p.filter(e => c.includes(e)));
	console.log("Common Length:" ,common.length);
	
	let difference = resArray.reduce((p, c) => p.filter(e => !c.includes(e)));
	console.log("Difference Length:" ,difference.length);
	
  //console.log(req)
  var data = [];
  console.log("calculating simailar");
}

getUrlListOnStartUp();

function getUrlListOnStartUp(){
		//check for an amount thats more than I can serve
		const amount = maxAmountOfSites
		const start = 0;
		
		
		let results = [];

		let loopCounter = 0;
		fs.createReadStream(csvReducedFilename)
			.on('error', () => {
				console.log("error occured while reading " + csvReducedFilename + ". Check top sites csv reader")
			})
		  .pipe(csv())
		  .on('data', (row) => {
			  if(loopCounter < (start + amount) && loopCounter >= start){
			  results.push(row)
			  }
			  loopCounter++;
		  })
		  .on('end', () => {
			console.log('[Startup]: CSV file successfully processed');
			crawlSitesUrlArray = results;
		  });
  }
 
  

// -------------------------------


//add router
app.use('/', router);

// this thing IS DANGEROUS PLAIN TEXT ACCESS TO APP.js possible!
//I am using it to serve the plain html files on the server without defining a custom path for each of them
//this can be improved
app.use(express.static(path.join(__dirname, "."))); 


app.all('/*', function (req, res) {
    res.status(404).send("404")
});

function truncateString(str, n){
  return (str.length > n) ? str.substr(0, n-1) + '...' : str;
};


//MongoDB

function addWebsiteInfoToDatabase(pagerank){
	mongoConnector.addToDatabase(dbName,dbCollectionName,websiteInfoArray[pagerank].db_object)
}


