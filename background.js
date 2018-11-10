var domainsMap = {};
var requestsMade = {};
var manualBlocks = {};
var manualWhitelist = {};

// on create new tab
chrome.tabs.onCreated.addListener(function (details) {
    if (details.id) {
        requestsMade[details.id.toString()] = [];
    }
});

// on close tab
chrome.tabs.onRemoved.addListener(function (details) {
    if (details) {
        requestsMade[details.toString()] = [];
    }
});

function unique(arr, tailLength) {
    if (!arr) return [];
    var z = 0;
    var u = {}, a = [];
    for (var i = arr.length - 1; i > 0; i--) {
        if (z > tailLength) return a;
        if (!u.hasOwnProperty(arr[i])) {
            a.push(arr[i]);
            u[arr[i]] = 1;
            z++;
        }
    }
    return a;
}

function GetManual() {
    return {"made": Object.keys(manualBlocks)};
}

// get last 10 requests
function GetLast10UniqueRequests(tabId) {
    let currentTabRequests = requestsMade[tabId.toString()];
    var last10unique = unique(currentTabRequests, 10);

    return {
        "made": Check(last10unique)
    };
}

// save changes from the popup
function Save(newDomains) {
    newDomains.forEach(dom => {
        manualBlocks[dom] = true;
    })
}

function SaveToWhitelist(newDomains) {
    newDomains.forEach(dom => {
        manualWhitelist[dom] = true;
    })
}
function DeleteFromWhitelist(domainsForDeletion) {
    domainsForDeletion.forEach(dom => {
        delete manualWhitelist[dom]
    })}

// delete some domain from the list
function Delete(domainsForDeletion) {
    domainsForDeletion.forEach(dom => {
        delete manualBlocks[dom]
    });
}

function Check(domainsForCheck) {
    return domainsForCheck.map(dom => {
        return {domain: dom, isBlocked: blacklistContains(dom + ".")};
    });
}

// receive messages from popup
chrome.runtime.onMessage.addListener(function (request, sender, callback) {
    if (request.action === "requests") {
        callback(GetLast10UniqueRequests(request.tab));
    } else if (request.action === "save") {
        callback(Save(request.newDomains));
    } else if (request.action === "delete") {
        callback(Delete(request.domainsForDeletion));
    } else if (request.action === "manual") {
        callback(GetManual());
    } else if (request.action === "reload") {
        callback(readFromFile());
    } else if (request.action === "manualWhitelist") {
        callback(GetManualWhitelist());
    } else if (request.action === "saveToWhitelist") {
        callback(SaveToWhitelist(request.newWlDomains));
    } else if (request.action === "deleteFromWhitelist") {
        callback(DeleteFromWhitelist(request.domainsForWlDeletion));
    }
});

var menuItem = {
    "id": "BTP",
    "title": "BTP check",
    "contexts": ["selection"]
};

chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create(menuItem);
});

function fixedEncodeURI(str) {
    return encodeURI(str).replace(/%5B/g, '[').replace(/%5D/g, ']');
}

chrome.contextMenus.onClicked.addListener(function (clickData) {
    if (clickData.menuItemId === "BTP" && clickData.selectionText) {
        let hostname = extractHostname(clickData.selectionText);
        if (blacklistContains(hostname + ".")) {
            var notifOptions = {
                type: "basic",
                iconUrl: "icon.png",
                title: "Malware site.",
                message: "This url is malicious."
            };

            chrome.notifications.clear('detectNotification');
            chrome.notifications.create('detectNotification', notifOptions);

            var wikiUrl = "https://en.wikipedia.org/wiki/" + fixedEncodeURI(clickData.selectionText);
            var createData = {
                "url": wikiUrl,
                "type": "popup",
                "top": 5,
                "left": 5,
                "width": parseInt(screen.availWidth / 2),
                "height": parseInt(screen.availHeight / 2)
            };
            chrome.windows.create(createData, function () {
            });

        } else {
            var notifOptions2 = {
                type: "basic",
                iconUrl: "icon.png",
                title: "Malware site.",
                message: "This url is fine."
            };

            chrome.notifications.clear('detectNotification2');
            chrome.notifications.create('detectNotification2', notifOptions2);
        }
    }
});

// load badge properties
chrome.browserAction.setBadgeBackgroundColor({color: "red"});

chrome.storage.onChanged.addListener(function (changes) {
    chrome.browserAction.setBadgeText({"text": changes.alertsCount.newValue.toString()});
});

chrome.storage.sync.get('alertsCount', function (storage) {
    if (storage.alertsCount) {
        chrome.browserAction.setBadgeText({"text": storage.alertsCount.toString()});
    }
});
var db = new Dexie("alertsDB");

// for db recreation uncomment

// db.delete().then(() => {
//     alert("Database successfully deleted");
// }).catch((err) => {
//     alert("Could not delete database");
// }).finally(() => {
// });
db.version(1).stores({
    domains: "++id,name,detectionDate"
});

// read from file into lines
function readFromFile() {
    chrome.runtime.getPackageDirectoryEntry(function (root) {
        root.getFile("domains.dat", {}, function (fileEntry) {
            fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.onloadend = function (e) {
                    var lines = e.target.result.split('\n');
                    lines.forEach(dom => domainsMap[dom] = true);
                };
                reader.readAsText(file);
            });
        });
    });
}

function GetManualWhitelist() {
    return {"made": Object.keys(manualWhitelist)};
}


function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    if (hostname.startsWith("www.")) hostname = hostname.substring(4);

    return hostname;
}

var blacklistContains = function (value) {
    return (domainsMap[value] === true || manualBlocks[value] === true) && !manualWhitelist[value];
};

// listen to the link changes in all the tabs
chrome.webRequest.onBeforeRequest.addListener(function (details) {
        var hostname = new URL(details.url).hostname;
        if (hostname.startsWith("www.")) hostname = hostname.substring(4);

        // If this was first tab, tabs.onCreated would not have been called. So, there won't be anything
        // in requestMade and requestsBlocked.
        if (details.tabId.toString() !== "-1" && !requestsMade.hasOwnProperty(details.tabId.toString())) {
            requestsMade[details.tabId.toString()] = [];
        }

        if (hostname && details.tabId && blacklistContains(hostname + ".")) {

            // Add to list
            if (details.tabId.toString() !== "-1" && !requestsMade[details.tabId.toString()][hostname]) {
                requestsMade[details.tabId.toString()][requestsMade[details.tabId.toString()].length] = hostname
            }

            updateProperties = {};
            updateProperties.url = 'https://www.akamai.com/';
            chrome.tabs.update(details.tabId, updateProperties, function () {
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                }
            });

            // create notification
            var notifOptions = {
                type: "basic",
                iconUrl: "icon.png",
                title: "Malware site.",
                message: "This url is malicious. You've been redirected to the experts."
            };

            chrome.notifications.clear('redirectNotification');
            chrome.notifications.create('redirectNotification', notifOptions);

            chrome.storage.sync.get('alertsCount', function (storage) {
                if (!storage.alertsCount) {
                    chrome.storage.sync.set({'alertsCount': 1}, function () {
                    });
                } else {
                    chrome.storage.sync.set({'alertsCount': storage.alertsCount + 1}, function () {
                    });
                }
            });
            db.domains.add({name: hostname, detectionDate: new Date().toISOString().substring(0, 10)}).then(function () {
            });
        } else {
            // Add to list
            if (details.tabId.toString() !== "-1" && !requestsMade[details.tabId.toString()][hostname]) {
                requestsMade[details.tabId.toString()][requestsMade[details.tabId.toString()].length] = hostname
            }

        }
    },
    {urls: ["<all_urls>"]},
    ["blocking"]);



