let toastTimer;
function copyToClipboard(element, text) {
navigator.clipboard.writeText(text).then(() => {
const toast = document.getElementById('copyToast');
toast.classList.add('show');
clearTimeout(toastTimer);
toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
});
}

// Countdown timer for V4 free offer (ends October 15th)
function updateCountdown() {
const now = new Date();
const currentYear = now.getFullYear();

// Use explicit date format for better browser compatibility
let targetDate = new Date(currentYear, 9, 15, 23, 59, 59).getTime(); // Month is 0-indexed (9 = October)

// If October 15 has already passed this year, use next year
if (now.getTime() > targetDate) {
targetDate = new Date(currentYear + 1, 9, 15, 23, 59, 59).getTime();
}

const difference = targetDate - now.getTime();

if (difference <= 0) {
// Offer expired
document.getElementById('days').textContent = '00';
document.getElementById('hours').textContent = '00';
document.getElementById('minutes').textContent = '00';
document.getElementById('seconds').textContent = '00';
const priceNow = document.querySelector('.price-now.free-timer');
if (priceNow) {
priceNow.textContent = '₹1,999';
priceNow.classList.remove('free-timer');
priceNow.classList.add('paid');
}
const badge = document.querySelector('.badge-premium');
if (badge) {
badge.innerHTML = '<i class="fas fa-star"></i> Premium';
}
const ribbon = document.querySelector('.featured-ribbon');
if (ribbon) {
ribbon.textContent = 'Premium';
}
const offerEnd = document.getElementById('v4-offer-end');
if (offerEnd) {
offerEnd.textContent = 'Offer ended';
}
return;
}

const days = Math.floor(difference / (1000 * 60 * 60 * 24));
const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
const seconds = Math.floor((difference % (1000 * 60)) / 1000);

document.getElementById('days').textContent = String(days).padStart(2, '0');
document.getElementById('hours').textContent = String(hours).padStart(2, '0');
document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// Update countdown every second when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
updateCountdown();
setInterval(updateCountdown, 1000);
});
