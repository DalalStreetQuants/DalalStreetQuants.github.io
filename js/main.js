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

// Backend API Configuration
const BACKEND_API_URL = 'http://100.109.209.38:8000/api/v1/licences';

// License Form Submission
async function submitLicenseForm(event, version) {
event.preventDefault();

const form = event.target;
const formData = new FormData(form);
const mt5Id = formData.get('mt5_id');
const name = formData.get('name');
const broker = formData.get('broker');
const accountType = formData.get('account_type');

const messageDiv = document.getElementById(`${version}-form-message`);
const submitBtn = form.querySelector('.btn-submit-license');

// Disable button during submission
submitBtn.disabled = true;
submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

try {
// Call backend API to create licence
const response = await fetch(`${BACKEND_API_URL}?version=${version}`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({
mt5_id: mt5Id,
name: name,
broker: broker,
account_type: accountType
})
});

const data = await response.json();

if (response.ok) {
messageDiv.className = 'form-message success';
messageDiv.textContent = `License request submitted successfully for MT5 ID: ${mt5Id}. Status: Verification Ongoing. You will receive confirmation within 24-48 hours.`;
form.reset();
// Reset button on success
submitBtn.disabled = false;
submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit License Request';
} else {
messageDiv.className = 'form-message error';
messageDiv.textContent = data.detail || 'Failed to submit license request. Please try again.';
submitBtn.disabled = false;
submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit License Request';
}

} catch (error) {
console.error('Error submitting license:', error);
messageDiv.className = 'form-message error';
messageDiv.textContent = 'Network error. Please check your connection or contact us on Telegram.';
submitBtn.disabled = false;
submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit License Request';
}
}

// Check License Status
async function checkLicenseStatus(event) {
event.preventDefault();

const mt5Id = document.getElementById('check-mt5-id').value.trim();
const resultDiv = document.getElementById('license-result');
const errorDiv = document.getElementById('license-error');

// Hide previous results
resultDiv.style.display = 'none';
errorDiv.style.display = 'none';

if (!mt5Id) {
document.getElementById('error-text').textContent = 'Please enter a valid MetaTrader ID.';
errorDiv.style.display = 'block';
return;
}

try {
// Fetch all licences from backend API
const response = await fetch(`${BACKEND_API_URL}?version=v3`, {
method: 'GET',
headers: {
'Content-Type': 'application/json',
}
});

if (!response.ok) {
throw new Error(`Failed to fetch licence data: ${response.status}`);
}

const data = await response.json();
const users = Array.isArray(data) ? data : (data.users || []);

// Find user by MT5 ID
const user = users.find(u => u.metatrader_id === mt5Id || u.metatrader_id == mt5Id);

if (user) {
// Display license details
document.getElementById('result-mt5-id').textContent = user.metatrader_id;
document.getElementById('result-name').textContent = user.name || 'N/A';
document.getElementById('result-valid-upto').textContent = user.valid_upto || 'N/A';

const verified = user.Verified === 'True' || user.Verified === true || user.Verified === 'true';
const statusBadge = document.getElementById('result-status');
const statusText = document.getElementById('result-verified');

if (verified) {
statusBadge.className = 'status-badge verified';
statusBadge.textContent = 'Verified';
statusText.className = 'result-value status-text verified';
statusText.textContent = 'Verified';
} else {
statusBadge.className = 'status-badge pending';
statusBadge.textContent = 'Pending';
statusText.className = 'result-value status-text pending';
statusText.textContent = 'Verification Ongoing';
}

resultDiv.style.display = 'block';
} else {
// License not found
document.getElementById('error-text').textContent = `License not found for MT5 ID: ${mt5Id}. Please check your ID or submit a new license request.`;
errorDiv.style.display = 'block';
}

} catch (error) {
console.error('Error checking license:', error);
document.getElementById('error-text').textContent = 'An error occurred while checking license status. Please try again. Ensure the backend API is accessible.';
errorDiv.style.display = 'block';
}
}

// Expose functions globally for inline event handlers
window.submitLicenseForm = submitLicenseForm;
window.checkLicenseStatus = checkLicenseStatus;
