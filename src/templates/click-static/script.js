// Initialize Lucide icons
lucide.createIcons();

// Header scroll effect
const header = document.getElementById("main-header");
window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        header.classList.remove("h-24");
        header.classList.add(
            "h-16",
            "bg-white/80",
            "backdrop-blur-md",
            "border-b",
        );
    } else {
        header.classList.add("h-24");
        header.classList.remove(
            "h-16",
            "bg-white/80",
            "backdrop-blur-md",
            "border-b",
        );
    }
});

// Intersection Observer for reveal effects
const observerOptions = {
    threshold: 0.1,
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active");
        }
    });
}, observerOptions);

const reveals = document.querySelectorAll(".reveal");
reveals.forEach((el) => observer.observe(el));
