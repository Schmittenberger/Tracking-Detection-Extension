const MongoClient = require('mongodb').MongoClient;
const mongoDBUrl = "mongodb://localhost:27017/";
function addToDatabase(database,collection,data){
	console.warn("[MongoDB] adding " + data.rank + " to collection:" + collection)
	if(collection == "" || typeof collection != "string"){collection = "nonamefallback"}

	try{
		MongoClient.connect(mongoDBUrl, {useUnifiedTopology: true},function(err, db) {
			if (err) console.warn(err);
			var dbo = db.db(database);
			
			dbo.collection(collection).insertOne(data, function(err, res) {
		
			if (err) { //HIER
				console.warn("[MongoDB] failed to insert entry into database (possible duplicate): " + data.rank );
				replaceInDatabase(database,collection,data)
			}
			//console.log("1 document inserted");
			db.close();
			});
				
		}); 
	} catch(err){ // most db errors happen when trying to insert a duplicate value because the old collection was not deleted in between crawls
		console.warn(err)
		
	}
}

function addToDatabaseMany(database,collection,data){
	console.warn("[MongoDB] adding " + data.rank + " to collection:" + collection)
	if(collection == "" || typeof collection != "string"){collection = "nonamefallbackMany"}

	try{
		MongoClient.connect(mongoDBUrl, {useUnifiedTopology: true},function(err, db) {
			if (err) console.warn(err);
			var dbo = db.db(database);
			dbo.collection(collection).insertMany(data, function(err, res) {
			// dbo.collection(collection).updateOne({ rank: data.rank },{$set: data}, function(err, res) {
			if (err) { 
				console.warn("[MongoDB] failed to insert many entries ",err);
			}
			//console.log("1 document inserted");
			db.close();
			});
				
		}); 
	} catch(err){ 
		console.warn(err)
		
	}
}

async function findInCollection(dbase,collection,filter){
		var contents = []
		try{
		return new Promise(resolve=>{
		MongoClient.connect(mongoDBUrl, {useUnifiedTopology: true},function(err, db) {
			if (err) console.warn(err);
			var dbo = db.db(dbase);
				dbo.collection(collection).find({injectSuccessful:true}, {projection:{_id:0,rank:1,url:1}}).toArray(function(err, result) {
					if (err) throw err;
					// console.log("res from datasbe",result)
					// console.log("[MongoDB] Find results", result);
					result.forEach((item)=>{
						contents.push(item.url);
					})
					db.close();
					resolve(contents)		
				})

			})
			});

			
	} catch(err){
		console.warn(err)
		
	}

}

function replaceInDatabase(database,collection,data){
	try{
		MongoClient.connect(mongoDBUrl, {useUnifiedTopology: true},function(err, db) {
			if (err) console.warn(err);
			var dbo = db.db(database);
			dbo.collection(collection).deleteOne({ rank: data.rank }, function(err, obj) {
				if (err) throw err;
				console.log("[MongoDB] " + data.rank + " deleted");
				replaceInDatabaseInsert(database,collection,data)
				db.close();
				})	
			})
	} catch(err){
		console.warn(err)
	}
}

function replaceInDatabaseInsert(database,collection,data){
	try{
		MongoClient.connect(mongoDBUrl, {useUnifiedTopology: true},function(err, db) {
			if (err) console.warn(err);
			var dbo = db.db(database);
				dbo.collection(collection).insertOne(data, function(err, res) {
					if (err) throw err;
					console.log("[MongoDB] " + data.rank + " re-inserted");
					db.close();
				})
				
				
			})
			//console.log("1 document inserted");

	} catch(err){ // most db errors happen when trying to insert a duplicate value because the old collection was not deleted in between crawls
		console.warn(err)
	}
}

function renameCollection(database,collection,newName){
	try{
		MongoClient.connect(mongoDBUrl, {useUnifiedTopology: true},function(err, db) {
			if (err) console.warn(err);
			var dbo = db.db(database);
				 const old_collection = dbo.collection(collection); 
				 old_collection.rename(newName);
			})
	} catch(err){ 
		console.warn(err)
	}
}

module.exports = {addToDatabase,addToDatabaseMany,findInCollection}


