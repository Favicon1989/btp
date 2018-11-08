$(function () {

    var requestedDomains = [];
    var currentTabId;

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

                        return '<ul><li>' + dom.domain + checkbox + '</li></ul>';
                    });
                    $('#requestedListView').html(outRequestedDomains);
                }

            }
        );
    });

    db.domains.where("detectionDate").equals(new Date().toISOString().substring(0, 10)).toArray().then(function (domains) {
        let out = domains.map((dom) => {
             return '<ul><li>' + dom.name + '</li></ul>';
        });
        $('#listView').html(out);
    });

    chrome.storage.sync.get('alertsCount', function (storage) {
        if (storage.alertsCount) {
            $('#total').text(storage.alertsCount);
        }
    });
});