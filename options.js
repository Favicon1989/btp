$(function () {

    $('[data-toggle="tooltip"]').tooltip();
    var actions = '<a class="add" title="Add" data-toggle="tooltip"><i class="material-icons">&#xE03B;</i></a><a class="edit" title="Edit" data-toggle="tooltip"><i class="material-icons">&#xE254;</i></a><a class="delete" title="Delete" data-toggle="tooltip"><i class="material-icons">&#xE872;</i></a>';

    // Append table with add row form on add new button click
    $(".add-new").click(function(){
        $(this).attr("disabled", "disabled");
        var index = $("table tbody tr:last-child").index();
        var row = '<tr>' +
            '<td><input type="text" class="form-control" name="name" id="name"></td>' +
            '<td>' + actions + '</td>' +
            '</tr>';
        $("table").append(row);
        $("table tbody tr").eq(index + 1).find(".add, .edit").toggle();
        $('[data-toggle="tooltip"]').tooltip();
    });

    chrome.runtime.sendMessage({
            action: "manual"
        },
        function (value) {
            let manualBlocks = value.made;
            if (manualBlocks) {

                let outRequestedDomains = manualBlocks.map((dom) => {

                    return '<tr><td>'+ dom + '</td><td><a class="add" title="Add" data-toggle="tooltip"><i class="material-icons">&#xE03B;</i></a><a class="edit" title="Edit" data-toggle="tooltip"><i class="material-icons">&#xE254;</i></a><a class="delete" title="Delete" data-toggle="tooltip"><i class="material-icons">&#xE872;</i></a></td></tr>';
                });

                $('#manualTableBody').append(outRequestedDomains)
            }
        }
    );

    // Add row on add button click
    $(document).on("click", ".add", function(){
        var empty = false;
        var input = $(this).parents("tr").find('input[type="text"]');
        input.each(function(){
            if(!$(this).val()){
                $(this).addClass("error");
                empty = true;
            } else{
                $(this).removeClass("error");
            }
        });

        $(this).parents("tr").find(".error").first().focus();

        if(!empty){
            var newDomains = [];
            input.each(function(){
                let newDomain = $(this).val();
                newDomains.push(newDomain + ".");
                $(this).parent("td").html(newDomain);
            });
            $(this).parents("tr").find(".add, .edit").toggle();
            $(".add-new").removeAttr("disabled");

            chrome.runtime.sendMessage({
                    action: "save",
                    newDomains: [newDomains]
                },
                function () {
                });
        }
    });

    // Edit row on edit button click
    $(document).on("click", ".edit", function(){
        $(this).parents("tr").find("td:not(:last-child)").each(function(){
            $(this).html('<input type="text" class="form-control" value="' + $(this).text() + '">');
        });
        $(this).parents("tr").find(".add, .edit").toggle();
        $(".add-new").attr("disabled", "disabled");
    });

    // Delete row on delete button click
    $(document).on("click", ".delete", function(){
        $(this).parents("tr").remove();
        $(".add-new").removeAttr("disabled");

        var input = $(this).parents("tr").find('td:first-child').html();

        chrome.runtime.sendMessage({
                action: "delete",
                domainsForDeletion: [input]
            },
            function () {
            })
    });
});