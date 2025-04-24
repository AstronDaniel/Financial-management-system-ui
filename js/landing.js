/**
 * ACCCA Financial Management System Landing Page Script
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Animation for flow steps on scroll
    const flowSteps = document.querySelectorAll('.flow-step');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.2
    });
    
    flowSteps.forEach(step => {
        step.style.opacity = 0;
        step.style.transform = 'translateY(20px)';
        step.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(step);
    });
    
    // Feature carousel autoplay configuration
    const featuresCarousel = document.getElementById('featuresCarousel');
    if (featuresCarousel) {
        const carousel = new bootstrap.Carousel(featuresCarousel, {
            interval: 5000,
            pause: 'hover'
        });
        
        // Pause carousel when not in viewport
        const carouselObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    carousel.cycle();
                } else {
                    carousel.pause();
                }
            });
        }, {
            threshold: 0.5
        });
        
        carouselObserver.observe(featuresCarousel);
    }
    
    // Make dashboard preview responsive
    const dashboardPreview = document.querySelector('.dashboard-preview img');
    if (dashboardPreview && !dashboardPreview.src.includes('dashboard-preview.png')) {
        // If the actual image doesn't exist, create a canvas placeholder
        createDashboardPlaceholder();
    }
});

/**
 * Creates a canvas placeholder for the dashboard preview if image is missing
 */
function createDashboardPlaceholder() {
    const container = document.querySelector('.dashboard-preview');
    const img = container.querySelector('img');
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    canvas.className = 'img-fluid rounded shadow';
    
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, 60);
    
    // Sidebar
    ctx.fillStyle = '#5d3a00';
    ctx.fillRect(0, 0, 200, canvas.height);
    
    // Sidebar menu items
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(20, 100 + i * 50, 160, 30);
    }
    
    // Cards
    ctx.fillStyle = '#ffffff';
    const cardWidth = 180;
    const cardSpacing = 15;
    const startX = 220;
    
    for (let i = 0; i < 3; i++) {
        const x = startX + i * (cardWidth + cardSpacing);
        ctx.fillRect(x, 80, cardWidth, 100);
        
        // Card icon
        ctx.fillStyle = 'rgba(93, 58, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(x + 30, 110, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Card text lines
        ctx.fillStyle = '#e9ecef';
        ctx.fillRect(x + 60, 100, 100, 10);
        ctx.fillRect(x + 60, 120, 80, 10);
        ctx.fillRect(x + 20, 150, 140, 10);
        
        // Reset fill style for next card
        ctx.fillStyle = '#ffffff';
    }
    
    // Main chart
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(220, 200, 560, 200);
    
    // Chart title
    ctx.fillStyle = '#e9ecef';
    ctx.fillRect(240, 220, 200, 15);
    
    // Chart data
    ctx.fillStyle = 'rgba(93, 58, 0, 0.7)';
    ctx.fillRect(240, 270, 40, 100);
    
    ctx.fillStyle = 'rgba(218, 165, 32, 0.7)';
    ctx.fillRect(300, 300, 40, 70);
    
    ctx.fillStyle = 'rgba(93, 58, 0, 0.7)';
    ctx.fillRect(360, 250, 40, 120);
    
    ctx.fillStyle = 'rgba(218, 165, 32, 0.7)';
    ctx.fillRect(420, 280, 40, 90);
    
    ctx.fillStyle = 'rgba(93, 58, 0, 0.7)';
    ctx.fillRect(480, 240, 40, 130);
    
    ctx.fillStyle = 'rgba(218, 165, 32, 0.7)';
    ctx.fillRect(540, 260, 40, 110);
    
    // Table
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(220, 420, 560, 60);
    
    // Table header
    ctx.fillStyle = 'rgba(93, 58, 0, 0.1)';
    ctx.fillRect(220, 420, 560, 20);
    
    // Table rows
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(220, 460, 560, 20);
    
    // Replace the img with canvas
    container.replaceChild(canvas, img);
}
