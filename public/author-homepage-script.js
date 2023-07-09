console.log("WORKS");

[...document.getElementsByClassName('share-button')].forEach((button) => {
    button.addEventListener("click", function() {
        let sharingLink = window.location.origin + "/reader/article?" + "id=" + button.id.split("share-button-")[1];
        alert("Sharing Link: " + sharingLink);
    });
});