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
const BACKEND_API_URL = 'https://zhedge.tailc7f7ac.ts.net/api/v1/licences';

// License Form Submission
async function submitLicenseForm(event, version) {
event.preventDefault();

const form = event.target;
const formData = new FormData(form);
const mt5Id = formData.get('mt5_id');
const name = formData.get('name');
const broker = formData.get('broker');
const accountType = formData.get('account_type');
const accountMode = formData.get('account_mode');
const partnerCode = formData.get('partner_code');

const messageDiv = document.getElementById(`${version}-form-message`);
const submitBtn = form.querySelector('.btn-submit-license');

// Validation for DSQ V3 and V4: Real account and partner code required
if (version === 'v3' || version === 'v4') {
    if (accountMode !== 'real') {
        alert(`DSQ ${version.toUpperCase()} is supported only for Real accounts. Demo accounts are not allowed.`);
        return;
    }
    if (partnerCode !== 'yes') {
        alert(`DSQ ${version.toUpperCase()} requires Partner Code to be added. Please add the partner code to your MetaTrader account before submitting.`);
        return;
    }
}

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
account_type: accountType,
account_mode: accountMode,
partner_code: partnerCode
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

// Search Licence by MT5 ID and Bot Version
async function searchLicence() {
    const baseUrl = 'https://zhedge.tailc7f7ac.ts.net';
    const mt5 = document.getElementById('searchMt5').value.trim();
    const version = document.getElementById('searchVersion').value.trim();
    const resultDiv = document.getElementById('license-result');
    const errorDiv = document.getElementById('license-error');

    // Hide previous results
    resultDiv.style.display = 'none';
    errorDiv.style.display = 'none';

    if (!mt5) {
        document.getElementById('error-text').textContent = 'Please enter an MT5 ID to search';
        errorDiv.style.display = 'block';
        return;
    }

    const url = `${baseUrl}/api/v1/licences/search`;
    const payload = {
        metatrader_id: mt5,
        bot_version: version
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok && data.metatrader_id) {
            // License found - display details
            document.getElementById('result-mt5-id').textContent = data.metatrader_id;
            document.getElementById('result-name').textContent = data.name || 'N/A';
            document.getElementById('result-valid-upto').textContent = data.valid_upto || 'N/A';
            
            const statusBadge = document.getElementById('result-status');
            const statusText = document.getElementById('result-verified');
            
            // Check if valid_upto is expired
            let isExpired = false;
            if (data.valid_upto) {
                // Parse date in DD-MM-YYYY format
                const parts = data.valid_upto.split('-');
                if (parts.length === 3) {
                    const expiryDate = new Date(parts[2], parts[1] - 1, parts[0]);
                    const today = new Date();
                    if (expiryDate < today) {
                        isExpired = true;
                    }
                }
            }
            
            // Check verification status
            const isVerified = data.Verified === 'True' || data.Verified === true || data.Verified === 'true';
            
            if (isExpired) {
                // License expired
                statusBadge.className = 'status-badge expired';
                statusBadge.textContent = 'Expired';
                statusText.className = 'result-value status-text expired';
                statusText.textContent = 'Licence expired. Please apply again.';
                
                // Remove any existing disclaimer
                const existingDisclaimer = statusText.parentElement.querySelector('.alert-box');
                if (existingDisclaimer) {
                    existingDisclaimer.remove();
                }
            } else if (!isVerified) {
                // Verification in progress
                statusBadge.className = 'status-badge pending';
                statusBadge.textContent = 'Pending';
                statusText.className = 'result-value status-text pending';
                statusText.textContent = 'Verification in progress.';
                
                // Remove any existing disclaimer
                const existingDisclaimer = statusText.parentElement.querySelector('.license-disclaimer');
                if (existingDisclaimer) {
                    existingDisclaimer.remove();
                }
                
                // Add disclaimer container
                const disclaimerContainer = document.createElement('div');
                disclaimerContainer.className = 'license-disclaimer mt-3';
                disclaimerContainer.innerHTML = `
                    <div class="alert-box alert-warning-custom">
                        <i class="fas fa-exclamation-circle alert-icon"></i>
                        <div><strong>Disclaimer:</strong> It takes 24/48 hours for the license to activate. Note: If you have not added the partner code, verification will not work.</div>
                    </div>
                    <div class="alert-box alert-info-custom">
                        <i class="fab fa-telegram alert-icon"></i>
                        <div>If any questions, drop a message to Telegram <a href="https://t.me/dsq_license_support" target="_blank">@dsq_license_support</a></div>
                    </div>
                `;
                statusText.parentElement.appendChild(disclaimerContainer);
            } else {
                // Verified and valid
                statusBadge.className = 'status-badge verified';
                statusBadge.textContent = 'Verified';
                statusText.className = 'result-value status-text verified';
                statusText.textContent = 'Licence is Valid';
                
                // Remove any existing disclaimer
                const existingDisclaimer = statusText.parentElement.querySelector('.alert-box');
                if (existingDisclaimer) {
                    existingDisclaimer.remove();
                }
            }
            
            resultDiv.style.display = 'block';
        } else {
            // License not found
            document.getElementById('error-text').textContent = `License not found for MT5 ID: ${mt5}. Please check your MT5 ID and bot version, or submit a license request first.`;
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        console.error('Error searching licence:', err);
        document.getElementById('error-text').textContent = 'An error occurred while checking license status. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Expose functions globally for inline event handlers
window.submitLicenseForm = submitLicenseForm;
window.searchLicence = searchLicence;

// Unified License Form Submission
async function submitUnifiedLicenseForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const version = formData.get('bot_version');
    const mt5Id = formData.get('mt5_id');
    const name = formData.get('name');
    const broker = formData.get('broker');
    const accountType = formData.get('account_type');
    const accountMode = formData.get('account_mode');
    const partnerCode = formData.get('partner_code');
    
    const messageDiv = document.getElementById('unified-form-message');
    const submitBtn = form.querySelector('.btn-submit-license');
    
    if (!version) {
        alert('Please select a bot version.');
        return;
    }
    
    // Validation for DSQ V3 and V4: Real account and partner code required
    if (version === 'v3' || version === 'v4') {
        if (accountMode !== 'real') {
            alert(`DSQ ${version.toUpperCase()} is supported only for Real accounts. Demo accounts are not allowed.`);
            return;
        }
        if (partnerCode !== 'yes') {
            alert(`DSQ ${version.toUpperCase()} requires Partner Code to be added. Please add the partner code to your MetaTrader account before submitting.`);
            return;
        }
    }
    
    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const response = await fetch(`${BACKEND_API_URL}?version=${version}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mt5_id: mt5Id,
                name: name,
                broker: broker,
                account_type: accountType,
                account_mode: accountMode,
                partner_code: partnerCode
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.className = 'form-message success';
            messageDiv.textContent = `License request submitted successfully for MT5 ID: ${mt5Id}. Status: Verification Ongoing. You will receive confirmation within 24-48 hours.`;
            form.reset();
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

// Bot Version Change Handler - Add notices for V3/V4
function onBotVersionChange() {
    const version = document.getElementById('license-bot-version').value;
    const accountModeSelect = document.getElementById('license-account-mode');
    const partnerCodeSelect = document.getElementById('license-partner-code');
    
    // Reset any existing warnings
    const existingWarning = document.getElementById('version-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    if (version === 'v3' || version === 'v4') {
        // Force real account mode
        accountModeSelect.value = 'real';
        accountModeSelect.disabled = true;
        
        // Force partner code yes
        partnerCodeSelect.value = 'yes';
        partnerCodeSelect.disabled = true;
        
        // Add warning notice
        const warningDiv = document.createElement('div');
        warningDiv.id = 'version-warning';
        warningDiv.className = 'alert-box alert-warning-custom mt-2';
        warningDiv.innerHTML = `<i class="fas fa-exclamation-triangle alert-icon"></i><div><strong>Note:</strong> DSQ ${version.toUpperCase()} requires a Real account with Partner Code added.</div>`;
        
        const form = document.getElementById('unified-license-form');
        const btnSubmit = form.querySelector('.btn-submit-license');
        form.insertBefore(warningDiv, btnSubmit);
    } else {
        // Enable fields for V2
        accountModeSelect.disabled = false;
        partnerCodeSelect.disabled = false;
    }
}

// Expose new functions globally
window.submitUnifiedLicenseForm = submitUnifiedLicenseForm;
window.onBotVersionChange = onBotVersionChange;
