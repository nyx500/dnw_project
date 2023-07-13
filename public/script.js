[...document.getElementsByClassName('share-button')].forEach((button) => {
    button.addEventListener("click", function() {
        let sharingLink = window.location.origin + "/reader/article?" + "id=" + button.id.split("share-button-")[1];
        alert("Sharing Link: " + sharingLink);
    });
});

// Ref: https://www.devwares.com/blog/how-to-create-a-beautiful-responsive-navbar-using-tailwind-css/
// Functionality to toggle menu on smaller screens when menu button is clicked
const menuButton = document.querySelector('button.menu-button');
const menu = document.querySelector('.hidden-menu');
menuButton.addEventListener('click', () => {
    console.log("clicked on menu button");
    menu.classList.toggle('hidden');
});