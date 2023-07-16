

/** Functionality to scroll to the errors container on the Comments form on the View Article page if errors exist
 * Ref - instructions how to scroll smoothly to element:
 * https://stackoverflow.com/questions/49820013/javascript-scrollintoview-smooth-scroll-and-offset
*/
function scrollToErrors(element) {
    var offset = 200;
    var elementPosition = element.getBoundingClientRect().top;
    console.log(element.getBoundingClientRect());
    var offsetPosition = elementPosition + window.scrollY - offset;
    window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
   });
}

// Execute code only when 'body' tag is loaded
document.querySelector('body').onload = function() {

    console.log("Loaded");
    
    [...document.getElementsByClassName('share-button')].forEach((button) => {
        button.addEventListener("click", function() {
            let sharingLink = `${window.location.origin}/reader/article?id=${button.id.split("share-button-")[1]}`;
            alert("Sharing Link: " + sharingLink);
        });
    });

    var errorsContainer = document.querySelector('#errors-container');
    if (errorsContainer)
    {
        scrollToErrors(errorsContainer);
    }
    /** Functionality to toggle menu on smaller screens when menu button is clicked
     * Ref: https://www.devwares.com/blog/how-to-create-a-beautiful-responsive-navbar-using-tailwind-css/
    */
    const menuButton = document.querySelector('button.menu-button');
    const menu = document.querySelector('.hidden-menu');
    const nav = document.querySelector('nav');
    menuButton.addEventListener('click', () => {
        menu.classList.toggle('hidden');
        nav.classList.toggle('py-0');
    });

};

