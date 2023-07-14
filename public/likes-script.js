// This AJAX JQuery function allows the user to 'like' the article and see the result updated immediately!
$(document).ready(function () {
    jQuery('#likes-form').on("submit", function (event) {
        // Prevents the default POST request and use AJAX instead
        event.preventDefault();
        // Gets the form element
        var form = $(this);
        // Gets the POST data (for the purpose of liking an article, this is just the article's ID)
        var id = form.find("input[name='id_like_form']").val();
        // Gets the server-side route URL by which the likes for the article are incremented 
        var route = form.attr("action");
        // Ajax query: an async function which allows the user to see their like being added without reloading the page
        jQuery.ajax({
            type: "POST",
            url: route,
            data: { "id_like_form": id }, // This represents 'req.body'
            success: function (response) { window.location.reload() }, // Response should be status code 200!
            error: function (err) { console.log("error") }
        });
    });
});
