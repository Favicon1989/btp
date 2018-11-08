var domainsMap = {};

var menuItem = {
    "id": "BTP",
    "title": "BTP check",
    "contexts": ["selection"]
};

chrome.contextMenus.create(menuItem);

function fixedEncodeURI (str) {
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
                "width": parseInt(screen.availWidth/2),
                "height": parseInt(screen.availHeight/2)
            };
            chrome.windows.create(createData, function(){});

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
db.version(1).stores({
    domains: "++id,name,detectionDate"
});

// read from file into lines
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
    return domainsMap[value] === true;
};

// listen to the link changes in all the tabs
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    let hostname = extractHostname(tab.url);
    if (tab.url && blacklistContains(hostname + ".")) {

        updateProperties = {};
        updateProperties.url = 'https://www.akamai.com/';
        chrome.tabs.update(tabId, updateProperties, function () {

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
        })
    }
});
