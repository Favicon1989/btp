$(function () {
    $('#lastUpdate').text(new Date().toJSON().substring(0, 19).replace("T", " "))
    $('[data-toggle="tooltip"]').tooltip();
    var actionsBl = '<a class="add black-list" title="Add" data-toggle="tooltip"><i class="material-icons">&#xE03B;</i></a>' +
        '<a class="edit black-list" title="Edit" data-toggle="tooltip"><i class="material-icons">&#xE254;</i></a>' +
        '<a class="delete black-list" title="Delete" data-toggle="tooltip"><i class="material-icons">&#xE872;</i></a>';
    var actionsWl = '<a class="add white-list" title="Add" data-toggle="tooltip"><i class="material-icons">&#xE03B;</i></a>' +
        '<a class="edit white-list" title="Edit" data-toggle="tooltip"><i class="material-icons">&#xE254;</i></a>' +
        '<a class="delete white-list" title="Delete" data-toggle="tooltip"><i class="material-icons">&#xE872;</i></a>';

    // Append table with add row form on add new button click
    $(".add-new.black-list").click(function () {
        $(this).attr("disabled", "disabled");
        var index = $("table.black-list tbody tr:last-child").index();
        var row = '<tr>' +
            '<td><input type="text" class="form-control" name="name" ></td>' +
            '<td>' + actionsBl + '</td>' +
            '</tr>';
        $("table.black-list").append(row);
        $("table.black-list tbody tr").eq(index + 1).find(".add, .edit").toggle();
        $('[data-toggle="tooltip"]').tooltip();
    });

    $(".add-new.white-list").click(function () {
        $(this).attr("disabled", "disabled");
        var index = $("table.white-list tbody tr:last-child").index();
        var row = '<tr>' +
            '<td><input type="text" class="form-control" name="name" ></td>' +
            '<td>' + actionsWl + '</td>' +
            '</tr>';
        $("table.white-list").append(row);
        $("table.white-list tbody tr").eq(index + 1).find(".add, .edit").toggle();
        $('[data-toggle="tooltip"]').tooltip();
    });

    chrome.runtime.sendMessage({
            action: "manual"
        },
        function (value) {
            let manualBlocks = value.made;
            if (manualBlocks) {
                let outRequestedDomains = manualBlocks.map((dom) => {
                    return '<tr><td>' + dom + '</td><td>' + actionsBl +'</td></tr>';
                });
                $('#manualTableBody').append(outRequestedDomains)
            }
        }
    );

    chrome.runtime.sendMessage({
            action: "manualWhitelist"
        },
        function (value) {
            let manualBlocks = value.made;
            if (manualBlocks) {
                let outRequestedDomains = manualBlocks.map((dom) => {
                    return '<tr><td>' + dom + '</td><td>' + actionsWl + '</td></tr>';
                });
                $('#manualWhitelistTableBody').append(outRequestedDomains)
            }
        }
    );


    $('#refreshContent').click(function () {
        chrome.runtime.sendMessage({
            action: "reload"
        }, function () {
            $('#lastUpdate').text(new Date().toJSON().substring(0, 19).replace("T", " "))
        });
    });

    // Add row on add button click black-list
    $(document).on("click", ".black-list.add", function () {
        var empty = false;
        var input = $(this).parents("tr").find('input[type="text"]');
        input.each(function () {
            if (!$(this).val()) {
                $(this).addClass("error");
                empty = true;
            } else {
                $(this).removeClass("error");
            }
        });

        $(this).parents("tr").find(".error").first().focus();

        if (!empty) {
            var newDomains = [];
            input.each(function () {
                let newDomain = $(this).val();
                newDomains.push(newDomain + ".");
                $(this).parent("td").html(newDomain);
            });
            $(this).parents("tr").find(".add, .edit").toggle();
            $(".add-new.black-list").removeAttr("disabled");

            chrome.runtime.sendMessage({
                    action: "save",
                    newDomains: [newDomains]
                },
                function () {
                });
        }
    });

    // Add row on add button click white-list
    $(document).on("click", ".white-list.add", function () {
        var empty = false;
        var input = $(this).parents("tr").find('input[type="text"]');
        input.each(function () {
            if (!$(this).val()) {
                $(this).addClass("error");
                empty = true;
            } else {
                $(this).removeClass("error");
            }
        });

        $(this).parents("tr").find(".error").first().focus();

        if (!empty) {
            var newDomains = [];
            input.each(function () {
                let newDomain = $(this).val();
                newDomains.push(newDomain + ".");
                $(this).parent("td").html(newDomain);
            });
            $(this).parents("tr").find(".add, .edit").toggle();
            $(".add-new.white-list").removeAttr("disabled");

            chrome.runtime.sendMessage({
                    action: "saveToWhitelist",
                    newWlDomains: [newDomains]
                },
                function () {
                });
        }
    });

    // Edit row on edit button click
    $(document).on("click", ".edit.black-list", function () {
        $(this).parents("tr").find("td:not(:last-child)").each(function () {
            $(this).html('<input type="text" class="form-control" value="' + $(this).text() + '">');
        });
        $(this).parents("tr").find(".add, .edit").toggle();
        $(".add-new.black-list").attr("disabled", "disabled");
    });

    // Edit row on edit button click
    $(document).on("click", ".edit.white-list", function () {
        $(this).parents("tr").find("td:not(:last-child)").each(function () {
            $(this).html('<input type="text" class="form-control" value="' + $(this).text() + '">');
        });
        $(this).parents("tr").find(".add, .edit").toggle();
        $(".add-new.white-list").attr("disabled", "disabled");
    });

    // Delete row on delete button click black-list
    $(document).on("click", ".delete.black-list", function () {
        $(this).parents("tr").remove();
        $(".add-new.black-list").removeAttr("disabled");

        let input = $(this).parents("tr").find('td:first-child').html();
        if (!input.endsWith(".")) input += ".";

        chrome.runtime.sendMessage({
                action: "delete",
                domainsForDeletion: [input]
            },
            function () {
            })
    });

    // Delete row on delete button click white-list
    $(document).on("click", ".delete.white-list", function () {
        $(this).parents("tr").remove();
        $(".add-new.white-list").removeAttr("disabled");

        let input1 = $(this).parents("tr").find('td:first-child').html();
        if (!input1.endsWith(".")) input1 += ".";
        chrome.runtime.sendMessage({
                action: "deleteFromWhitelist",
                domainsForWlDeletion: [input1]
            },
            function () {

            })
    });

    // STATISTIC table
    var db = new Dexie("alertsDB");
    db.version(1).stores({
        domains: "++id,name,detectionDate,category"
    });

    db.domains.toArray().then(function (domains) {
        var counts = {};
        var categoryCounts = {};

        for (var i = 0; i < domains.length; i++) {
            var name = domains[i].name;
            if (!!counts[name]) {
                counts[name].count = counts[name].count + 1;
            } else {
                counts[name] = {};
                counts[name].count = 1;
            }
            counts[name].category = domains[i].category;
        }

        let out = [];
        for (var domainName in counts) {
            if (counts.hasOwnProperty(domainName)) {
                let currCategory = counts[domainName].category;
                let currCount = counts[domainName].count;
                out.push([domainName, counts[domainName].count, currCategory]);

                if (!!categoryCounts[currCategory]) {
                    categoryCounts[currCategory] = categoryCounts[currCategory] + currCount;
                } else {
                    categoryCounts[currCategory] = currCount;
                }
            }
        }
        let chartData = [];
        for (var category in categoryCounts) {
            if (categoryCounts.hasOwnProperty(category)) {
                chartData.push({name: category, y: categoryCounts[category]});
            }
        }
        out.sort(function (a, b) {
            return b[1] - a[1];
        });

        chartData.sort(function (a, b) {
            return b['y'] - a['y'];
        });

        $('#statisticListTableBody').html(out.map(statisticObj => {
            return '<tr><td>' + statisticObj[0] + '</td><td>' + statisticObj[1] + '</td><td>' + statisticObj[2] + '</td><td><a href="#"><i class="fa fa-info-circle" aria-hidden="true"></i></a></td></tr>';
        }));
        createChart(chartData);
    });

    function createChart(data) {

        Highcharts.chart('categoryChart', {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false
            },
            title: {
                text: '<br>Categories<br>',
                align: 'center',
                verticalAlign: 'top',
                y: 40
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
                        distance: -50,
                        style: {
                            fontWeight: 'bold',
                            color: 'white'
                        }
                    },
                    startAngle: -90,
                    endAngle: 90,
                    center: ['50%', '75%'],
                    size: '110%'
                }
            },
            series: [{
                colorByPoint: true,
                data: data,
                type: 'pie',
                name: 'Percentage',
                innerSize: '50%'
            }]
        });
    }

});