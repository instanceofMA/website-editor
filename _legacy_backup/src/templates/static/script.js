console.log("Demo Website Loaded!");

// Simple interaction for buttons
document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("click", (e) => {
        // e.preventDefault(); // Don't prevent default so navigation works
        console.log(`Button clicked: ${button.textContent}`);

        // Add a little ripple effect or animation class
        button.classList.add("clicked");
        setTimeout(() => button.classList.remove("clicked"), 200);
    });
});

// Mobile helper (console log for now)
if (window.innerWidth < 768) {
    console.log("Mobile view detected");
}
