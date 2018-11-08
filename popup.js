$(function () {

    var requestedDomains = [];
    var currentTabId;

    document.querySelector('#yes').addEventListener('click', Yes);
    document.querySelector('#no').addEventListener('click', No);

    function Yes() {

        // There are 3 nested async calls here. First, get the current blocked URLs, then save the new one
        // in its callback. In the call back for save, send resync message to background.js

            var newItems = [];
            var itemsForDeletion = [];
            var items = document.getElementById("requestedListView").getElementsByTagName("li");

            // Iterate through all items. Add checked items to blocked list and remove unchecked ones
            for (var index = 0; index < items.length; index++) {

                let newDomain = items[index].innerText.trim() + ".";

                if (newDomain.startsWith("www.")) {
                    newDomain = newDomain.substring(4)
                }

                if (items[index].childNodes[1].checked) {
                    newItems[newItems.length] = newDomain;
                } else {
                    itemsForDeletion[itemsForDeletion.length] = newDomain;
                }
            }

        chrome.runtime.sendMessage({
                action: "save",
                newDomains: newItems
            },
            function () {
            });

        chrome.runtime.sendMessage({
                action: "delete",
                domainsForDeletion: itemsForDeletion
            },
            function () {
            });

        window.close();
    }

    function No() {
        window.close();
    }

    var db = new Dexie("alertsDB");
    db.version(1).stores({
        domains: "++id,name,detectionDate"
    });


    chrome.tabs.query({active: true, currentWindow: true }, function (tabs) {
        currentTabId = tabs[0].id;

        // Get all the requests this tab has made so far
        chrome.runtime.sendMessage({
                action: "requests",
                tab: currentTabId
            },
            function (value) {
                requestedDomains = value.made;
                if (requestedDomains) {

                    let outRequestedDomains = requestedDomains.map((dom) => {
                        let checkbox;
                        if (dom.isBlocked) {
                            checkbox = '<input type="checkbox" checked>';
                        } else {
                            checkbox = '<input type="checkbox">';
                        }

                        return '<li>' + dom.domain + checkbox + '</li>';
                    });
                    $('#requestedListView').html(outRequestedDomains);
                }
            }
        );
    });

    // db.domains.where("detectionDate").equals(new Date().toISOString().substring(0, 10)).toArray().then(function (domains) {
    //     let out = domains.map((dom) => {
    //          return '<li>' + dom.name + '</li>';
    //     });
    //     $('#listView').html(out);
    // });

    chrome.storage.sync.get('alertsCount', function (storage) {
        if (storage.alertsCount) {
            $('#total').text(storage.alertsCount);
        }
    });
});