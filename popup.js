$(function () {

    var db = new Dexie("alertsDB");
    db.version(1).stores({
        domains: "++id,name,detectionDate"
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