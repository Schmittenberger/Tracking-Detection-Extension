# Tracking Detection Extension
 Cross-platform browser extension to detect JavaScript tracking methods

### Prerequisites:
+ Node.js
+ web-ext (https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)
+ MongoDB
 
 A Node.js server collects the data sent by the extension and saves it in a mongoDB Collection.
 
![framework_setup](https://user-images.githubusercontent.com/49319459/141430776-fd9afd04-b7d1-4e6f-8b09-485258b82609.jpg)

Overview of the extensions workflow:

![extension](https://user-images.githubusercontent.com/49319459/141430848-63a0b6ed-744b-4dcd-9ace-5696be00804e.jpg)

## Node.js Setup
+ clone repo
+ run __npm install__ in server folder to install all npm needed packages
+ download and provide the list of URLs to visit during crawling. Name the file top-1m.csv. (a list is available at https://tranco-list.eu/)
+ run __node app.js__ to start server
+ don't forget to install MongoDB on your machine

## Extension Setup
+ install extension in Firefox with web-ext, or manually in other browsers
+ click pop-up icon in browser to open crawl settings
+ define parameters for the crawl, then start the crawl via the pop-up
