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

// Translation Data for Multiple Languages
const translations = {
    en: {
        nav_download: "Download",
        nav_setup: "Setup",
        nav_license_check: "License Check",
        nav_account: "Account",
        nav_brokers: "Brokers",
        nav_about: "About",
        nav_join_telegram: "Join Telegram",
        hero_badge: "Dalal Street Quants",
        hero_title_1: "DSQ ",
        hero_title_2: "Forex Bot",
        hero_lead: "Algorithmic trading strategies built, tested, and analyzed for Nifty 50, Bank Nifty, Nifty 500 stocks, Gold and Bitcoin.",
        hero_btn_download: "Download Free Bot",
        hero_btn_setup: "Setup Guide",
        stat_bot_versions: "Bot Versions",
        stat_licenses: "V2 – V3 Licenses",
        stat_activation: "License Activation",
        stat_brokers: "Partner Brokers",
        tg_have_questions: "Have questions?",
        tg_text: "Join our Telegram group — our team & community will help you out.",
        tg_btn: "Join Telegram Group",
        section_download_eyebrow: "Bot Download",
        section_download_title: "Choose Your Version",
        section_download_subtitle: "Pick the version that fits your trading style — V1 to V3 are completely free.",
        v2_title: "DSQ V2",
        v2_tagline: "Version 2.0 — Adds trailing stop",
        v2_free: "FREE",
        v2_was: "₹2,000",
        v2_feature1: "Grid Trading",
        v2_feature2: "Trailing Stop",
        v2_feature3: "Max Risk Management",
        v2_feature4: "Hedging",
        v2_feature5: "Human Intervention",
        v2_btn: "Download V2",
        v2_notice: "Real Cent/Micro Account Only — Demo not available",
        v3_title: "DSQ V3",
        v3_tagline: "Version 3.0 — Adds hedging",
        v3_free: "FREE",
        v3_was: "₹4,000",
        v3_btn: "Download V3",
        v4_title: "DSQ V4",
        v4_tagline: "Version 4.0 — Full feature suite",
        v4_free: "FREE",
        v4_was: "₹6,000",
        v4_offer: "Offer ends in:",
        v4_days: "Days",
        v4_hours: "Hours",
        v4_mins: "Mins",
        v4_secs: "Secs",
        v4_btn: "Download V4",
        v4_ribbon: "Limited Offer",
        v4_badge: "FREE till Oct 15",
        setup_eyebrow: "Bot Setup",
        setup_title: "Step-by-Step Setup Guide",
        setup_subtitle: "Follow the guide below — setup is the same for all bot versions.",
        setup_alert_free: "Completely Free.",
        setup_alert_free_text: "DSQ V2 & V3 licenses are free. V4 is FREE until October 15th. No hidden charges ever.",
        setup_step1_num: "1",
        setup_step1_title: "Download MT5 & Login",
        setup_step1_li1: "Download MT5 from metatrader5.com",
        setup_step1_li2: "Login with your broker credentials (use Cent account only with maximum leverage set like 1:2000)",
        setup_step1_li3: "In MetaTrader, go to Tools → Options → Expert Advisors:",
        setup_step1_li3_sub1: "Allow Algorithmic Trading",
        setup_step1_li3_sub2: "Allow Web Request for listed URL → Add: https://raw.githubusercontent.com",
        setup_step2_num: "2",
        setup_step2_title: "Set Partner Code on Your Account",
        setup_step2_intro: "Our bots are supported only for the following brokers. Set the partner code on your broker account:",
        setup_step3_num: "3",
        setup_step3_title: "Download & Install Your Bot",
        setup_step3_li1: "Download your bot version (.ex5 file) from the Download section above",
        setup_step3_li2: "Double-click the downloaded file to add it to MetaTrader",
        setup_step3_li3: "Find your bot (dsq_v2, dsq_v3, or dsq_v4) in the Navigator panel under Expert Advisors",
        setup_step4_num: "4",
        setup_step4_title: "Activate Your License Online",
        partner_broker: "Partner broker",
        open_account: "Open Account",
        how_to_add: "How to add partner code",
        coming_soon: "Coming Soon",
        license_widget_title: "Activate Your License Online",
        license_widget_subtitle: "Select your bot version and fill the form below to submit your license request",
        label_bot_version: "Bot Version *",
        label_mt5_id: "MT5 ID *",
        label_name: "Full Name *",
        label_partner_code: "Partner Code Added? *",
        label_broker: "Broker Name *",
        label_account_type: "Account Type *",
        label_account_mode: "Account Mode *",
        select_bot_version: "Select Bot Version",
        select_partner_code: "Select Option",
        yes: "Yes",
        no: "No",
        select_broker: "Select Broker",
        select_account_type: "Select Account Type",
        select_account_mode: "Select Mode",
        real_account: "Real Account",
        demo_account: "Demo Account",
        cent_account: "Cent Account",
        micro_account: "Micro Account",
        standard_account: "Standard Account",
        btn_submit_license: "Submit License Request",
        submitting: "Submitting...",
        watch_video: "Watch: How to Get Your License",
        video_guide: "Step-by-step video guide",
        verification_eyebrow: "License Verification",
        verification_title: "Check Your License Status",
        verification_subtitle: "Enter your MetaTrader ID to verify your license status and details.",
        check_license: "Check License",
        license_details: "License Details",
        mt5_id_label: "MetaTrader ID:",
        name_label: "Name:",
        valid_upto_label: "Valid Upto:",
        status_label: "Status:",
        account_eyebrow: "Account Setup",
        account_title: "Choose Your Account",
        account_subtitle: "We only recommend Cent Accounts for optimal bot performance.",
        account_recommendation: "Our Recommendation: Cent Account Only",
        account_rec_text: "Cent accounts provide the best risk-to-capital ratio for grid trading bots. With 100 USD, you get 10,000 USC — enough margin buffer for the bot to operate safely.",
        capital_requirements: "Capital Requirements",
        capital_text: "10,000 INR (≈ 100 USD)<br>Deposit into a Cent Account → receive 10,000 USC<br>This is the minimum recommended capital for all DSQ bots.",
        usd_warning: "USD Account Warning",
        usd_warning_text: "A USD account needs at least 10,000 USD for safe operation. Not recommended for small capital traders.",
        compatible_accounts: "Compatible Cent Accounts",
        broker: "Broker",
        cent_account_col: "Cent Account",
        usd_account_col: "USD Account",
        manual_intervention: "Manual Intervention Required:",
        manual_intervention_text: "Watch the bot while it runs. Stop immediately and take the loss if you see a strong one-sided move (e.g., price keeps going up or down without pulling back). The bot is not designed for trending markets.",
        safety_first: "Safety First:",
        safety_first_text: "Always test on a Demo account first before using a Real account. Same broker, same cent account type.",
        brokers_eyebrow: "Partner Brokers",
        brokers_title: "Set Partner Code on Your Account",
        brokers_subtitle: "Our bots are supported only for the following brokers. Click a code to copy it.",
        about_eyebrow: "About Us",
        about_title: "About Dalal Street Quants",
        about_subtitle: "Who we are and what we do.",
        about_desc: "Dalal Street Quants builds, tests, and analyzes algorithmic trading strategies for Nifty 50, Bank Nifty, Nifty 500 stocks, Gold and Bitcoin.",
        subscribe_to: "Subscribe to:",
        subscribe_1: "Replace guesswork with algorithms & Expert Advisors",
        subscribe_2: "Learn backtesting",
        telegram_channel: "Telegram Channel",
        youtube: "YouTube",
        facebook: "Facebook",
        instagram: "Instagram",
        email_us: "Email Us",
        footer_desc: "Building, testing, and analyzing algorithmic trading strategies for Nifty 50, Bank Nifty, Nifty 500 stocks, Gold and Bitcoin.",
        weekly_call: "Weekly live 1-hour setup call — FREE!",
        disclaimer: "Trading involves risk. Always test on Demo first.",
        copied_toast: "Copied to clipboard"
    },
    hi: {
        nav_download: "डाउनलोड",
        nav_setup: "सेटअप",
        nav_license_check: "लाइसेंस जांच",
        nav_account: "खाता",
        nav_brokers: "ब्रोकर",
        nav_about: "हमारे बारे में",
        nav_join_telegram: "टेलीग्राम जॉइन करें",
        hero_badge: "दलाल स्ट्रीट क्वांट्स",
        hero_title_1: "DSQ ",
        hero_title_2: "फॉरेक्स बॉट",
        hero_lead: "निफ्टी 50, बैंक निफ्टी, निफ्टी 500 स्टॉक्स, गोल्ड और बिटकॉइन के लिए एल्गोरिदमिक ट्रेडिंग रणनीतियां।",
        hero_btn_download: "मुफ्त बॉट डाउनलोड करें",
        hero_btn_setup: "सेटअप गाइड",
        stat_bot_versions: "बॉट संस्करण",
        stat_licenses: "V2 – V3 लाइसेंस",
        stat_activation: "लाइसेंस सक्रियण",
        stat_brokers: "साझेदार ब्रोकर",
        tg_have_questions: "क्या आपके पास प्रश्न हैं?",
        tg_text: "हमारे टेलीग्राम समूह से जुड़ें — हमारी टीम और समुदाय आपकी मदद करेगा।",
        tg_btn: "टेलीग्राम समूह जॉइन करें",
        section_download_eyebrow: "बॉट डाउनलोड",
        section_download_title: "अपना संस्करण चुनें",
        section_download_subtitle: "वह संस्करण चुनें जो आपकी ट्रेडिंग शैली के अनुकूल हो — V1 से V3 पूरी तरह मुफ्त हैं।",
        v2_title: "DSQ V2",
        v2_tagline: "संस्करण 2.0 — ट्रेलिंग स्टॉप जोड़ता है",
        v2_free: "मुफ्त",
        v2_was: "₹2,000",
        v2_feature1: "ग्रिड ट्रेडिंग",
        v2_feature2: "ट्रेलिंग स्टॉप",
        v2_feature3: "अधिकतम जोखिम प्रबंधन",
        v2_feature4: "हेजिंग",
        v2_feature5: "मानव हस्तक्षेप",
        v2_btn: "V2 डाउनलोड करें",
        v2_notice: "केवल वास्तविक सेंट/माइक्रो खाता — डेमो उपलब्ध नहीं",
        v3_title: "DSQ V3",
        v3_tagline: "संस्करण 3.0 — हेजिंग जोड़ता है",
        v3_free: "मुफ्त",
        v3_was: "₹4,000",
        v3_btn: "V3 डाउनलोड करें",
        v4_title: "DSQ V4",
        v4_tagline: "संस्करण 4.0 — पूर्ण सुविधा सूट",
        v4_free: "मुफ्त",
        v4_was: "₹6,000",
        v4_offer: "ऑफर समाप्त होता है:",
        v4_days: "दिन",
        v4_hours: "घंटे",
        v4_mins: "मिनट",
        v4_secs: "सेकंड",
        v4_btn: "V4 डाउनलोड करें",
        v4_ribbon: "सीमित ऑफर",
        v4_badge: "15 अक्टूबर तक मुफ्त",
        setup_eyebrow: "बॉट सेटअप",
        setup_title: "चरण-दर-चरण सेटअप गाइड",
        setup_subtitle: "नीचे दी गई गाइड का पालन करें — सभी बॉट संस्करणों के लिए सेटअप समान है।",
        setup_alert_free: "पूरी तरह मुफ्त।",
        setup_alert_free_text: "DSQ V2 और V3 लाइसेंस मुफ्त हैं। V4 15 अक्टूबर तक मुफ्त है। कोई छिपी हुई शुल्क नहीं।",
        setup_step1_num: "1",
        setup_step1_title: "MT5 डाउनलोड करें और लॉगिन करें",
        setup_step1_li1: "metatrader5.com से MT5 डाउनलोड करें",
        setup_step1_li2: "अपने ब्रोकर क्रेडेंशियल के साथ लॉगिन करें (केवल सेंट खाता उपयोग करें अधिकतम लिवरेज 1:2000 के साथ)",
        setup_step1_li3: "MetaTrader में, Tools → Options → Expert Advisors पर जाएं:",
        setup_step1_li3_sub1: "Algorithmic Trading अनुमति दें",
        setup_step1_li3_sub2: "Web Request for listed URL अनुमति दें → जोड़ें: https://raw.githubusercontent.com",
        setup_step2_num: "2",
        setup_step2_title: "अपने खाते पर पार्टनर कोड सेट करें",
        setup_step2_intro: "हमारे बॉट केवल निम्नलिखित ब्रोकरों के लिए समर्थित हैं। अपने ब्रोकर खाते पर पार्टनर कोड सेट करें:",
        setup_step3_num: "3",
        setup_step3_title: "अपना बॉट डाउनलोड और इंस्टॉल करें",
        setup_step3_li1: "ऊपर दिए गए Download section से अपना बॉट संस्करण (.ex5 फ़ाइल) डाउनलोड करें",
        setup_step3_li2: "डाउनलोड की गई फ़ाइल पर डबल-क्लिक करके इसे MetaTrader में जोड़ें",
        setup_step3_li3: "Navigator panel में Expert Advisors के तहत अपना बॉट (dsq_v2, dsq_v3, या dsq_v4) खोजें",
        setup_step4_num: "4",
        setup_step4_title: "अपना लाइसेंस ऑनलाइन सक्रिय करें",
        partner_broker: "साझेदार ब्रोकर",
        open_account: "खाता खोलें",
        how_to_add: "पार्टनर कोड कैसे जोड़ें",
        coming_soon: "जल्द आ रहा है",
        license_widget_title: "अपना लाइसेंस ऑनलाइन सक्रिय करें",
        license_widget_subtitle: "अपना बॉट संस्करण चुनें और लाइसेंस अनुरोध सबमिट करने के लिए नीचे दिए गए फॉर्म को भरें",
        label_bot_version: "बॉट संस्करण *",
        label_mt5_id: "MT5 ID *",
        label_name: "पूर्ण नाम *",
        label_partner_code: "पार्टनर कोड जोड़ा गया? *",
        label_broker: "ब्रोकर का नाम *",
        label_account_type: "खाता प्रकार *",
        label_account_mode: "खाता मोड *",
        select_bot_version: "बॉट संस्करण चुनें",
        select_partner_code: "विकल्प चुनें",
        yes: "हाँ",
        no: "नहीं",
        select_broker: "ब्रोकर चुनें",
        select_account_type: "खाता प्रकार चुनें",
        select_account_mode: "मोड चुनें",
        real_account: "वास्तविक खाता",
        demo_account: "डेमो खाता",
        cent_account: "सेंट खाता",
        micro_account: "माइक्रो खाता",
        standard_account: "स्टैंडर्ड खाता",
        btn_submit_license: "लाइसेंस अनुरोध सबमिट करें",
        submitting: "सबमिट कर रहे हैं...",
        watch_video: "देखें: लाइसेंस कैसे प्राप्त करें",
        video_guide: "चरण-दर-चरण वीडियो गाइड",
        verification_eyebrow: "लाइसेंस सत्यापन",
        verification_title: "अपनी लाइसेंस स्थिति जांचें",
        verification_subtitle: "अपनी लाइसेंस स्थिति और विवरण सत्यापित करने के लिए अपना मेटाट्रेडर ID दर्ज करें।",
        check_license: "लाइसेंस जांचें",
        license_details: "लाइसेंस विवरण",
        mt5_id_label: "मेटाट्रेडर ID:",
        name_label: "नाम:",
        valid_upto_label: "तक वैध:",
        status_label: "स्थिति:",
        account_eyebrow: "खाता सेटअप",
        account_title: "अपना खाता चुनें",
        account_subtitle: "हम केवल इष्टतम बॉट प्रदर्शन के लिए सेंट खातों की सलाह देते हैं।",
        account_recommendation: "हमारी सलाह: केवल सेंट खाता",
        account_rec_text: "ग्रिड ट्रेडिंग बॉट्स के लिए सेंट खाते सर्वोत्तम जोखिम-से-पूंजी अनुपात प्रदान करते हैं। 100 USD के साथ, आपको 10,000 USC मिलता है — बॉट को सुरक्षित रूप से संचालित करने के लिए पर्याप्त मार्जिन बफर।",
        capital_requirements: "पूंजी आवश्यकताएं",
        capital_text: "10,000 INR (≈ 100 USD)<br>सेंट खाते में जमा करें → 10,000 USC प्राप्त करें<br>यह सभी DSQ बॉट्स के लिए न्यूनतम अनुशंसित पूंजी है।",
        usd_warning: "USD खाता चेतावनी",
        usd_warning_text: "USD खाते को सुरक्षित संचालन के लिए कम से कम 10,000 USD की आवश्यकता है। छोटी पूंजी वाले व्यापारियों के लिए अनुशंसित नहीं।",
        compatible_accounts: "संगत सेंट खाते",
        broker: "ब्रोकर",
        cent_account_col: "सेंट खाता",
        usd_account_col: "USD खाता",
        manual_intervention: "मैन्युअल हस्तक्षेप आवश्यक:",
        manual_intervention_text: "बॉट चलते समय उसे देखें। यदि आप एक मजबूत एकतरफा गति देखते हैं (जैसे, कीमत लगातार ऊपर या नीचे जा रही है बिना पुलबैक के), तो तुरंत रुकें और नुकसान स्वीकार करें। बॉट ट्रेंडिंग बाजारों के लिए डिज़ाइन नहीं किया गया है।",
        safety_first: "सुरक्षा पहले:",
        safety_first_text: "वास्तविक खाते का उपयोग करने से पहले हमेशा डेमो खाते पर परीक्षण करें। वही ब्रोकर, वही सेंट खाता प्रकार।",
        brokers_eyebrow: "साझेदार ब्रोकर",
        brokers_title: "अपने खाते पर पार्टनर कोड सेट करें",
        brokers_subtitle: "हमारे बॉट केवल निम्नलिखित ब्रोकरों के लिए समर्थित हैं। कोड को कॉपी करने के लिए उस पर क्लिक करें।",
        about_eyebrow: "हमारे बारे में",
        about_title: "दलाल स्ट्रीट क्वांट्स के बारे में",
        about_subtitle: "हम कौन हैं और हम क्या करते हैं।",
        about_desc: "दलाल स्ट्रीट क्वांट्स निफ्टी 50, बैंक निफ्टी, निफ्टी 500 स्टॉक्स, गोल्ड और बिटकॉइन के लिए एल्गोरिदमिक ट्रेडिंग रणनीतियां बनाता, परीक्षण करता और विश्लेषण करता है।",
        subscribe_to: "सदस्यता लें:",
        subscribe_1: "अनुमान को एल्गोरिदम और एक्सपर्ट एडवाइजर्स से बदलें",
        subscribe_2: "बैकटेस्टिंग सीखें",
        telegram_channel: "टेलीग्राम चैनल",
        youtube: "यूट्यूब",
        facebook: "फेसबुक",
        instagram: "इंस्टाग्राम",
        email_us: "हमें ईमेल करें",
        footer_desc: "निफ्टी 50, बैंक निफ्टी, निफ्टी 500 स्टॉक्स, गोल्ड और बिटकॉइन के लिए एल्गोरिदमिक ट्रेडिंग रणनीतियां बनाना, परीक्षण करना और विश्लेषण करना।",
        weekly_call: "साप्ताहिक लाइव 1-घंटे का सेटअप कॉल — मुफ्त!",
        disclaimer: "ट्रेडिंग में जोखिम शामिल है। हमेशा पहले डेमो पर परीक्षण करें।",
        copied_toast: "क्लिपबोर्ड पर कॉपी किया गया"
    },
    bn: {
        nav_download: "ডাউনলোড",
        nav_setup: "সেটআপ",
        nav_license_check: "লাইসেন্স চেক",
        nav_account: "অ্যাকাউন্ট",
        nav_brokers: "ব্রোকার",
        nav_about: "আমাদের সম্পর্কে",
        nav_join_telegram: "টেলিগ্রাম যোগ দিন",
        hero_badge: "দালাল স্ট্রিট কোয়ান্টস",
        hero_title_1: "DSQ ",
        hero_title_2: "ফরেক্স বট",
        hero_lead: "নিফটি 50, ব্যাঙ্ক নিফটি, নিফটি 500 স্টক, সোনা এবং বিটকয়েনের জন্য অ্যালগরিদমিক ট্রেডিং কৌশল।",
        hero_btn_download: "বিনামূল্যে বট ডাউনলোড করুন",
        hero_btn_setup: "সেটআপ গাইড",
        stat_bot_versions: "বট সংস্করণ",
        stat_licenses: "V2 – V3 লাইসেন্স",
        stat_activation: "লাইসেন্স সক্রিয়করণ",
        stat_brokers: "অংশীদার ব্রোকার",
        tg_have_questions: "আপনার কি প্রশ্ন আছে?",
        tg_text: "আমাদের টেলিগ্রাম গ্রুপে যোগ দিন — আমাদের দল ও সম্প্রদায় আপনাকে সাহায্য করবে।",
        tg_btn: "টেলিগ্রাম গ্রুপে যোগ দিন",
        section_download_eyebrow: "বট ডাউনলোড",
        section_download_title: "আপনার সংস্করণ বেছে নিন",
        section_download_subtitle: "আপনার ট্রেডিং স্টাইলের উপযোগী সংস্করণ বেছে নিন — V1 থেকে V3 সম্পূর্ণ বিনামূল্যে।",
        v2_title: "DSQ V2",
        v2_tagline: "সংস্করণ 2.0 — ট্রেইলিং স্টপ যোগ করে",
        v2_free: "বিনামূল্যে",
        v2_was: "₹2,000",
        v2_feature1: "গ্রিড ট্রেডিং",
        v2_feature2: "ট্রেইলিং স্টপ",
        v2_feature3: "সর্বোচ্চ ঝুঁকি ব্যবস্থাপনা",
        v2_feature4: "হেজিং",
        v2_feature5: "মানব হস্তক্ষেপ",
        v2_btn: "V2 ডাউনলোড করুন",
        v2_notice: "শুধুমাত্র রিয়েল সেন্ট/মাইক্রো অ্যাকাউন্ট — ডেমো উপলব্ধ নয়",
        v3_title: "DSQ V3",
        v3_tagline: "সংস্করণ 3.0 — হেজিং যোগ করে",
        v3_free: "বিনামূল্যে",
        v3_was: "₹4,000",
        v3_btn: "V3 ডাউনলোড করুন",
        v4_title: "DSQ V4",
        v4_tagline: "সংস্করণ 4.0 — পূর্ণ বৈশিষ্ট্য সুট",
        v4_free: "বিনামূল্যে",
        v4_was: "₹6,000",
        v4_offer: "অফার শেষ হচ্ছে:",
        v4_days: "দিন",
        v4_hours: "ঘণ্টা",
        v4_mins: "মিনিট",
        v4_secs: "সেকেন্ড",
        v4_btn: "V4 ডাউনলোড করুন",
        v4_ribbon: "সীমিত অফার",
        v4_badge: "15 অক্টোবর পর্যন্ত বিনামূল্যে",
        setup_eyebrow: "বট সেটআপ",
        setup_title: "ধাপে ধাপে সেটআপ গাইড",
        setup_subtitle: "নীচের গাইড অনুসরণ করুন — সমস্ত বট সংস্করণের জন্য সেটআপ একই।",
        setup_alert_free: "সম্পূর্ণ বিনামূল্যে।",
        setup_alert_free_text: "DSQ V2 এবং V3 লাইসেন্স বিনামূল্যে। V3 15 অক্টোবর পর্যন্ত বিনামূল্যে। কোনো লুকানো চার্জ নেই।",
        setup_step1_num: "1",
        setup_step1_title: "MT5 ডাউনলোড করুন এবং লগইন করুন",
        setup_step1_li1: "metatrader5.com থেকে MT5 ডাউনলোড করুন",
        setup_step1_li2: "আপনার ব্রোকার ক্রেডেনশিয়াল দিয়ে লগইন করুন (সর্বোচ্চ লিভারেজ 1:2000 সহ শুধুমাত্র সেন্ট অ্যাকাউন্ট ব্যবহার করুন)",
        setup_step1_li3: "MetaTrader-এ, Tools → Options → Expert Advisors-এ যান:",
        setup_step1_li3_sub1: "Algorithmic Trading অনুমতি দিন",
        setup_step1_li3_sub2: "Web Request for listed URL অনুমতি দিন → যোগ করুন: https://raw.githubusercontent.com",
        setup_step2_num: "2",
        setup_step2_title: "আপনার অ্যাকাউন্টে পার্টনার কোড সেট করুন",
        setup_step2_intro: "আমাদের বট শুধুমাত্র নিম্নলিখিত ব্রোকারের জন্য সমর্থিত। আপনার ব্রোকার অ্যাকাউন্টে পার্টনার কোড সেট করুন:",
        setup_step3_num: "3",
        setup_step3_title: "আপনার বট ডাউনলোড এবং ইনস্টল করুন",
        setup_step3_li1: "উপরের Download section থেকে আপনার বট সংস্করণ (.ex5 ফাইল) ডাউনলোড করুন",
        setup_step3_li2: "ডাউনলোড করা ফাইলে ডাবল-ক্লিক করে এটি MetaTrader-এ যোগ করুন",
        setup_step3_li3: "Expert Advisors-এর অধীনে Navigator panel-এ আপনার বট (dsq_v2, dsq_v3, বা dsq_v4) খুঁজুন",
        setup_step4_num: "4",
        setup_step4_title: "আপনার লাইসেন্স অনলাইনে সক্রিয় করুন",
        partner_broker: "অংশীদার ব্রোকার",
        open_account: "অ্যাকাউন্ট খুলুন",
        how_to_add: "কীভাবে পার্টনার কোড যোগ করবেন",
        coming_soon: "শীঘ্রই আসছে",
        license_widget_title: "আপনার লাইসেন্স অনলাইনে সক্রিয় করুন",
        license_widget_subtitle: "আপনার বট সংস্করণ নির্বাচন করুন এবং লাইসেন্স অনুরোধ জমা দিতে নীচের ফর্ম পূরণ করুন",
        label_bot_version: "বট সংস্করণ *",
        label_mt5_id: "MT5 ID *",
        label_name: "পুরো নাম *",
        label_partner_code: "পার্টনার কোড যোগ করা হয়েছে? *",
        label_broker: "ব্রোকারের নাম *",
        label_account_type: "অ্যাকাউন্টের ধরণ *",
        label_account_mode: "অ্যাকাউন্ট মোড *",
        select_bot_version: "বট সংস্করণ নির্বাচন করুন",
        select_partner_code: "বিকল্প নির্বাচন করুন",
        yes: "হ্যাঁ",
        no: "না",
        select_broker: "ব্রোকার নির্বাচন করুন",
        select_account_type: "অ্যাকাউন্টের ধরণ নির্বাচন করুন",
        select_account_mode: "মোড নির্বাচন করুন",
        real_account: "রিয়েল অ্যাকাউন্ট",
        demo_account: "ডেমো অ্যাকাউন্ট",
        cent_account: "সেন্ট অ্যাকাউন্ট",
        micro_account: "মাইক্রো অ্যাকাউন্ট",
        standard_account: "স্ট্যান্ডার্ড অ্যাকাউন্ট",
        btn_submit_license: "লাইসেন্স অনুরোধ জমা দিন",
        submitting: "জমা দেওয়া হচ্ছে...",
        watch_video: "দেখুন: কীভাবে লাইসেন্স পাবেন",
        video_guide: "ধাপে ধাপে ভিডিও গাইড",
        verification_eyebrow: "লাইসেন্স যাচাইকরণ",
        verification_title: "আপনার লাইসেন্স স্থিতি পরীক্ষা করুন",
        verification_subtitle: "আপনার লাইসেন্স স্থিতি এবং বিবরণ যাচাই করতে আপনার মেটাট্রেডার ID লিখুন।",
        check_license: "লাইসেন্স চেক করুন",
        license_details: "লাইসেন্স বিবরণ",
        mt5_id_label: "মেটাট্রেডার ID:",
        name_label: "নাম:",
        valid_upto_label: "পর্যন্ত বৈধ:",
        status_label: "স্থিতি:",
        account_eyebrow: "অ্যাকাউন্ট সেটআপ",
        account_title: "আপনার অ্যাকাউন্ট বেছে নিন",
        account_subtitle: "আমরা শুধুমাত্র সর্বোত্তম বট পারফরম্যান্সের জন্য সেন্ট অ্যাকাউন্টের সুপারিশ করি।",
        account_recommendation: "আমাদের সুপারিশ: শুধুমাত্র সেন্ট অ্যাকাউন্ট",
        account_rec_text: "গ্রিড ট্রেডিং বটের জন্য সেন্ট অ্যাকাউন্ট সেরা ঝুঁকি-থেকে-মূলধন অনুপাত প্রদান করে। 100 USD দিয়ে, আপনি 10,000 USC পান — বট নিরাপদে পরিচালনা করার জন্য পর্যাপ্ত মার্জিন বাফার।",
        capital_requirements: "মূলধন প্রয়োজনীয়তা",
        capital_text: "10,000 INR (≈ 100 USD)<br>সেন্ট অ্যাকাউন্টে জমা দিন → 10,000 USC পান<br>এটি সমস্ত DSQ বটের জন্য সর্বনিম্ন সুপারিশকৃত মূলধন।",
        usd_warning: "USD অ্যাকাউন্ট সতর্কতা",
        usd_warning_text: "USD অ্যাকাউন্টের নিরাপদ পরিচালনার জন্য কমপক্ষে 10,000 USD প্রয়োজন। ছোট মূলধন ব্যবসায়ীদের জন্য সুপারিশ করা হয় না।",
        compatible_accounts: "সঙ্গতিপূর্ণ সেন্ট অ্যাকাউন্ট",
        broker: "ব্রোকার",
        cent_account_col: "সেন্ট অ্যাকাউন্ট",
        usd_account_col: "USD অ্যাকাউন্ট",
        manual_intervention: "ম্যানুয়াল হস্তক্ষেপ প্রয়োজন:",
        manual_intervention_text: "বট চলার সময় এটি পর্যবেক্ষণ করুন। যদি আপনি একটি শক্তিশালী একপাক্ষিক গতি দেখেন (যেমন, দাম টানা ছাড়াই ক্রমাগত উপরে বা নিচে যাচ্ছে), তাহলে তৎক্ষণাৎ থামুন এবং ক্ষতি গ্রহণ করুন। বট ট্রেন্ডিং বাজারের জন্য ডিজাইন করা হয়নি।",
        safety_first: "নিরাপত্তা প্রথম:",
        safety_first_text: "রিয়েল অ্যাকাউন্ট ব্যবহার করার আগে সর্বদা ডেমো অ্যাকাউন্টে পরীক্ষা করুন। একই ব্রোকার, একই সেন্ট অ্যাকাউন্টের ধরণ।",
        brokers_eyebrow: "অংশীদার ব্রোকার",
        brokers_title: "আপনার অ্যাকাউন্টে পার্টনার কোড সেট করুন",
        brokers_subtitle: "আমাদের বট শুধুমাত্র নিম্নলিখিত ব্রোকারের জন্য সমর্থিত। কোড কপি করতে এটিতে ক্লিক করুন।",
        about_eyebrow: "আমাদের সম্পর্কে",
        about_title: "দালাল স্ট্রিট কোয়ান্টস সম্পর্কে",
        about_subtitle: "আমরা কে এবং আমরা কী করি।",
        about_desc: "দালাল স্ট্রিট কোয়ান্টস নিফটি 50, ব্যাঙ্ক নিফটি, নিফটি 500 স্টক, সোনা এবং বিটকয়েনের জন্য অ্যালগরিদমিক ট্রেডিং কৌশল তৈরি, পরীক্ষা এবং বিশ্লেষণ করে।",
        subscribe_to: "সাবস্ক্রাইব করুন:",
        subscribe_1: "অনুমানকে অ্যালগরিদম এবং এক্সপার্ট অ্যাডভাইজার দিয়ে প্রতিস্থাপন করুন",
        subscribe_2: "ব্যাকটেস্টিং শিখুন",
        telegram_channel: "টেলিগ্রাম চ্যানেল",
        youtube: "ইউটিউব",
        facebook: "ফেসবুক",
        instagram: "ইনস্টাগ্রাম",
        email_us: "আমাদের ইমেল করুন",
        footer_desc: "নিফটি 50, ব্যাঙ্ক নিফটি, নিফটি 500 স্টক, সোনা এবং বিটকয়েনের জন্য অ্যালগরিদমিক ট্রেডিং কৌশল তৈরি, পরীক্ষা এবং বিশ্লেষণ।",
        weekly_call: "সাপ্তাহিক লাইভ 1-ঘণ্টার সেটআপ কল — বিনামূল্যে!",
        disclaimer: "ট্রেডিংয়ে ঝুঁকি জড়িত। সর্বদা প্রথমে ডেমোতে পরীক্ষা করুন।",
        copied_toast: "ক্লিপবোর্ডে কপি করা হয়েছে"
    },
    fa: {
        nav_download: "دانلود",
        nav_setup: "راه‌اندازی",
        nav_license_check: "بررسی مجوز",
        nav_account: "حساب",
        nav_brokers: "کارگزاران",
        nav_about: "درباره ما",
        nav_join_telegram: "عضویت در تلگرام",
        hero_badge: "دلال استریت کوانتس",
        hero_title_1: "DSQ ",
        hero_title_2: "ربات فارکس",
        hero_lead: "استراتژی‌های معاملاتی الگوریتمی ساخته، آزمایش و تحلیل شده برای نیفتی 50، بانک نیفتی، سهام نیفتی 500، طلا و بیت‌کوین.",
        hero_btn_download: "دانلود رایگان ربات",
        hero_btn_setup: "راهنمای راه‌اندازی",
        stat_bot_versions: "نسخه‌های ربات",
        stat_licenses: "مجوزهای V2 – V3",
        stat_activation: "فعال‌سازی مجوز",
        stat_brokers: "کارگزاران شریک",
        tg_have_questions: "سوالی دارید؟",
        tg_text: "به گروه تلگرام ما بپیوندید — تیم و جامعه ما به شما کمک خواهند کرد.",
        tg_btn: "عضویت در گروه تلگرام",
        section_download_eyebrow: "دانلود ربات",
        section_download_title: "نسخه خود را انتخاب کنید",
        section_download_subtitle: "نسخه‌ای را انتخاب کنید که با سبک معاملاتی شما مناسب است — V1 تا V3 کاملاً رایگان هستند.",
        v2_title: "DSQ V2",
        v2_tagline: "نسخه 2.0 — اضافه کردن تریلینگ استاپ",
        v2_free: "رایگان",
        v2_was: "₹2,000",
        v2_feature1: "معاملات گرید",
        v2_feature2: "تریلینگ استاپ",
        v2_feature3: "مدیریت حداکثر ریسک",
        v2_feature4: "پوشش ریسک",
        v2_feature5: "مداخله انسانی",
        v2_btn: "دانلود V2",
        v2_notice: "فقط حساب واقعی سنت/میکرو — دمو موجود نیست",
        v3_title: "DSQ V3",
        v3_tagline: "نسخه 3.0 — اضافه کردن پوشش ریسک",
        v3_free: "رایگان",
        v3_was: "₹4,000",
        v3_btn: "دانلود V3",
        v4_title: "DSQ V4",
        v4_tagline: "نسخه 4.0 — مجموعه کامل ویژگی‌ها",
        v4_free: "رایگان",
        v4_was: "₹6,000",
        v4_offer: "پیشنهاد پایان می‌یابد در:",
        v4_days: "روز",
        v4_hours: "ساعت",
        v4_mins: "دقیقه",
        v4_secs: "ثانیه",
        v4_btn: "دانلود V4",
        v4_ribbon: "پیشنهاد محدود",
        v4_badge: "رایگان تا 15 اکتبر",
        setup_eyebrow: "راه‌اندازی ربات",
        setup_title: "راهنمای گام به گام راه‌اندازی",
        setup_subtitle: "راهنمای زیر را دنبال کنید — راه‌اندازی برای همه نسخه‌های ربات یکسان است.",
        setup_alert_free: "کاملاً رایگان.",
        setup_alert_free_text: "مجوزهای DSQ V2 و V3 رایگان هستند. V4 تا 15 اکتبر رایگان است. بدون هزینه پنهان.",
        setup_step1_num: "1",
        setup_step1_title: "MT5 را دانلود کرده و وارد شوید",
        setup_step2_num: "2",
        setup_step2_title: "کد شریک را روی حساب خود تنظیم کنید",
        setup_step2_intro: "ربات‌های ما فقط برای کارگزاران زیر پشتیبانی می‌شوند. کد شریک را روی حساب کارگزار خود تنظیم کنید:",
        setup_step3_num: "3",
        setup_step3_title: "ربات خود را دانلود و نصب کنید",
        setup_step4_num: "4",
        setup_step4_title: "مجوز خود را آنلاین فعال کنید",
        partner_broker: "کارگزار شریک",
        open_account: "باز کردن حساب",
        how_to_add: "چگونه کد شریک را اضافه کنیم",
        coming_soon: "به زودی",
        license_widget_title: "مجوز خود را آنلاین فعال کنید",
        license_widget_subtitle: "نسخه ربات خود را انتخاب کرده و فرم زیر را برای ارسال درخواست مجوز پر کنید",
        label_bot_version: "نسخه ربات *",
        label_mt5_id: "شناسه MT5 *",
        label_name: "نام کامل *",
        label_partner_code: "کد شریک اضافه شده است؟ *",
        label_broker: "نام کارگزار *",
        label_account_type: "نوع حساب *",
        label_account_mode: "حالت حساب *",
        select_bot_version: "انتخاب نسخه ربات",
        select_partner_code: "انتخاب گزینه",
        yes: "بله",
        no: "خیر",
        select_broker: "انتخاب کارگزار",
        select_account_type: "انتخاب نوع حساب",
        select_account_mode: "انتخاب حالت",
        real_account: "حساب واقعی",
        demo_account: "حساب دمو",
        cent_account: "حساب سنت",
        micro_account: "حساب میکرو",
        standard_account: "حساب استاندارد",
        btn_submit_license: "ارسال درخواست مجوز",
        submitting: "در حال ارسال...",
        watch_video: "تماشا کنید: چگونه مجوز دریافت کنید",
        video_guide: "راهنمای ویدیویی گام به گام",
        verification_eyebrow: "بررسی مجوز",
        verification_title: "وضعیت مجوز خود را بررسی کنید",
        verification_subtitle: "برای تأیید وضعیت و جزئیات مجوز خود، شناسه متاتریدر خود را وارد کنید.",
        check_license: "بررسی مجوز",
        license_details: "جزئیات مجوز",
        mt5_id_label: "شناسه متاتریدر:",
        name_label: "نام:",
        valid_upto_label: "معتبر تا:",
        status_label: "وضعیت:",
        account_eyebrow: "راه‌اندازی حساب",
        account_title: "حساب خود را انتخاب کنید",
        account_subtitle: "ما فقط حساب‌های سنت را برای عملکرد بهینه ربات توصیه می‌کنیم.",
        account_recommendation: "توصیه ما: فقط حساب سنت",
        account_rec_text: "حساب‌های سنت بهترین نسبت ریسک به سرمایه را برای ربات‌های معاملاتی گرید ارائه می‌دهند. با 100 دلار، شما 10,000 USC دریافت می‌کنید — حاشیه کافی برای عملیات ایمن ربات.",
        capital_requirements: "نیازهای سرمایه",
        capital_text: "10,000 روپیه (≈ 100 دلار)<br>در حساب سنت واریز کنید → 10,000 USC دریافت کنید<br>این حداقل سرمایه توصیه شده برای همه ربات‌های DSQ است.",
        usd_warning: "هشدار حساب USD",
        usd_warning_text: "حساب USD حداقل به 10,000 دلار برای عملیات ایمن نیاز دارد. برای معامله‌گران با سرمایه کوچک توصیه نمی‌شود.",
        compatible_accounts: "حساب‌های سنت سازگار",
        broker: "کارگزار",
        cent_account_col: "حساب سنت",
        usd_account_col: "حساب USD",
        manual_intervention: "مداخله دستی مورد نیاز:",
        manual_intervention_text: "ربات را هنگام اجرا تماشا کنید. اگر حرکت یک‌طرفه قوی مشاهده کردید (مثلاً قیمت بدون عقب‌نشینی مداوم بالا یا پایین می‌رود)، بلافاصله متوقف شده و ضرر را بپذیرید. ربات برای بازارهای رونددار طراحی نشده است.",
        safety_first: "اول ایمنی:",
        safety_first_text: "همیشه قبل از استفاده از حساب واقعی، ابتدا روی حساب دمو آزمایش کنید. همان کارگزار، همان نوع حساب سنت.",
        brokers_eyebrow: "کارگزاران شریک",
        brokers_title: "کد شریک را روی حساب خود تنظیم کنید",
        brokers_subtitle: "ربات‌های ما فقط برای کارگزاران زیر پشتیبانی می‌شوند. برای کپی کردن کد روی آن کلیک کنید.",
        about_eyebrow: "درباره ما",
        about_title: "درباره دلال استریت کوانتس",
        about_subtitle: "ما کی هستیم و چه کاری انجام می‌دهیم.",
        about_desc: "دلال استریت کوانتس استراتژی‌های معاملاتی الگوریتمی را برای نیفتی 50، بانک نیفتی، سهام نیفتی 500، طلا و بیت‌کوین می‌سازد، آزمایش و تحلیل می‌کند.",
        subscribe_to: "عضویت در:",
        subscribe_1: "حدس و گمان را با الگوریتم‌ها و مشاوران خبره جایگزین کنید",
        subscribe_2: "بک‌تستینگ را یاد بگیرید",
        telegram_channel: "کانال تلگرام",
        youtube: "یوتیوب",
        facebook: "فیسبوک",
        instagram: "اینستاگرام",
        email_us: "ایمیل به ما",
        footer_desc: "ساخت، آزمایش و تحلیل استراتژی‌های معاملاتی الگوریتمی برای نیفتی 50، بانک نیفتی، سهام نیفتی 500، طلا و بیت‌کوین.",
        weekly_call: "تم راه‌اندازی زنده هفتگی 1 ساعته — رایگان!",
        disclaimer: "معامله شامل ریسک است. همیشه ابتدا روی دمو آزمایش کنید.",
        copied_toast: "در کلیپ‌بورد کپی شد"
    },
    ar: {
        nav_download: "تحميل",
        nav_setup: "الإعداد",
        nav_license_check: "فحص الترخيص",
        nav_account: "الحساب",
        nav_brokers: "الوسطاء",
        nav_about: "من نحن",
        nav_join_telegram: "انضم إلى تليجرام",
        hero_badge: "دالال ستريت كوانتس",
        hero_title_1: "DSQ ",
        hero_title_2: "بوت الفوركس",
        hero_lead: "استراتيجيات التداول الخوارزمية المبنية والمختبرة والمحسسة لـ Nifty 50 و Bank Nifty وأسهم Nifty 500 والذهب والبيتكوين.",
        hero_btn_download: "تحميل البوت مجاناً",
        hero_btn_setup: "دليل الإعداد",
        stat_bot_versions: "إصدارات البوت",
        stat_licenses: "تراخيص V2 – V3",
        stat_activation: "تفعيل الترخيص",
        stat_brokers: "الوسطاء الشركاء",
        tg_have_questions: "هل لديك أسئلة؟",
        tg_text: "انضم إلى مجموعة تليجرام الخاصة بنا — سيساعدك فريقنا ومجتمعنا.",
        tg_btn: "انضم إلى مجموعة تليجرام",
        section_download_eyebrow: "تحميل البوت",
        section_download_title: "اختر نسختك",
        section_download_subtitle: "اختر النسخة التي تناسب أسلوب التداول الخاص بك — V1 إلى V3 مجانية تماماً.",
        v2_title: "DSQ V2",
        v2_tagline: "الإصدار 2.0 — يضيف وقف الزحف",
        v2_free: "مجاناً",
        v2_was: "₹2,000",
        v2_feature1: "تداول الشبكة",
        v2_feature2: "وقف الزحف",
        v2_feature3: "إدارة المخاطر القصوى",
        v2_feature4: "التحوط",
        v2_feature5: "التدخل البشري",
        v2_btn: "تحميل V2",
        v2_notice: "حقيقي سنت/مايكرو فقط — لا يوجد تجريبي",
        v3_title: "DSQ V3",
        v3_tagline: "الإصدار 3.0 — يضيف التحوط",
        v3_free: "مجاناً",
        v3_was: "₹4,000",
        v3_btn: "تحميل V3",
        v4_title: "DSQ V4",
        v4_tagline: "الإصدار 4.0 — مجموعة الميزات الكاملة",
        v4_free: "مجاناً",
        v4_was: "₹6,000",
        v4_offer: "ينتهي العرض في:",
        v4_days: "أيام",
        v4_hours: "ساعات",
        v4_mins: "دقائق",
        v4_secs: "ثواني",
        v4_btn: "تحميل V4",
        v4_ribbon: "عرض محدود",
        v4_badge: "مجاناً حتى 15 أكتوبر",
        setup_eyebrow: "إعداد البوت",
        setup_title: "دليل الإعداد خطوة بخطوة",
        setup_subtitle: "اتبع الدليل أدناه — الإعداد هو نفسه لجميع إصدارات البوت.",
        setup_alert_free: "مجاناً تماماً.",
        setup_alert_free_text: "تراخيص DSQ V2 و V3 مجانية. V4 مجاني حتى 15 أكتوبر. بدون رسوم مخفية.",
        setup_step1_num: "1",
        setup_step1_title: "تحميل MT5 وتسجيل الدخول",
        setup_step2_num: "2",
        setup_step2_title: "تعيين رمز الشريك على حسابك",
        setup_step2_intro: "بوتاتنا مدعومة فقط للوسطاء التاليين. عيّن رمز الشريك على حساب الوسيط الخاص بك:",
        setup_step3_num: "3",
        setup_step3_title: "تحميل وتثبيت البوت الخاص بك",
        setup_step4_num: "4",
        setup_step4_title: "تفعيل الترخيص الخاص بك عبر الإنترنت",
        partner_broker: "الوسيط الشريك",
        open_account: "فتح حساب",
        how_to_add: "كيفية إضافة رمز الشريك",
        coming_soon: "قريباً",
        license_widget_title: "تفعيل الترخيص الخاص بك عبر الإنترنت",
        license_widget_subtitle: "اختر إصدار البوت الخاص بك واملأ النموذج أدناه لتقديم طلب الترخيص",
        label_bot_version: "إصدار البوت *",
        label_mt5_id: "معرف MT5 *",
        label_name: "الاسم الكامل *",
        label_partner_code: "تمت إضافة رمز الشريك؟ *",
        label_broker: "اسم الوسيط *",
        label_account_type: "نوع الحساب *",
        label_account_mode: "وضع الحساب *",
        select_bot_version: "اختر إصدار البوت",
        select_partner_code: "اختر الخيار",
        yes: "نعم",
        no: "لا",
        select_broker: "اختر الوسيط",
        select_account_type: "اختر نوع الحساب",
        select_account_mode: "اختر الوضع",
        real_account: "حساب حقيقي",
        demo_account: "حساب تجريبي",
        cent_account: "حساب سنت",
        micro_account: "حساب مايكرو",
        standard_account: "حساب قياسي",
        btn_submit_license: "تقديم طلب الترخيص",
        submitting: "جاري التقديم...",
        watch_video: "شاهد: كيفية الحصول على الترخيص",
        video_guide: "دليل الفيديو خطوة بخطوة",
        verification_eyebrow: "التحقق من الترخيص",
        verification_title: "تحقق من حالة الترخيص الخاص بك",
        verification_subtitle: "أدخل معرف MetaTrader الخاص بك للتحقق من حالة الترخيص والتفاصيل.",
        check_license: "فحص الترخيص",
        license_details: "تفاصيل الترخيص",
        mt5_id_label: "معرف MetaTrader:",
        name_label: "الاسم:",
        valid_upto_label: "صالح حتى:",
        status_label: "الحالة:",
        account_eyebrow: "إعداد الحساب",
        account_title: "اختر حسابك",
        account_subtitle: "نوصي فقط بحسابات سنت لأداء البوت الأمثل.",
        account_recommendation: "توصيتنا: حساب سنت فقط",
        account_rec_text: "توفر حسابات سنت أفضل نسبة مخاطرة إلى رأس المال لبوتات تداول الشبكة. مع 100 دولار، تحصل على 10,000 USC — هامش كافٍ لتشغيل البوت بأمان.",
        capital_requirements: "متطلبات رأس المال",
        capital_text: "10,000 روبية (≈ 100 دولار)<br>أودع في حساب سنت → احصل على 10,000 USC<br>هذا هو الحد الأدنى الموصى به من رأس المال لجميع بوتات DSQ.",
        usd_warning: "تحذير حساب USD",
        usd_warning_text: "يحتاج حساب USD إلى 10,000 دولار على الأقل للتشغيل الآمن. غير موصى به للمتداولين برأس مال صغير.",
        compatible_accounts: "حسابات سنت المتوافقة",
        broker: "الوسيط",
        cent_account_col: "حساب سنت",
        usd_account_col: "حساب USD",
        manual_intervention: "التدخل اليدوي مطلوب:",
        manual_intervention_text: "راقب البوت أثناء تشغيله. توقف فوراً واقبل الخسارة إذا رأيت حركة أحادية الجانب قوية (مثل استمرار السعر في الصعود أو الهبوط دون تراجع). البوت غير مصمم للأسواق ذات الاتجاه.",
        safety_first: "السلامة أولاً:",
        safety_first_text: "اختبر دائماً على حساب تجريبي أولاً قبل استخدام حساب حقيقي. نفس الوسيط، نفس نوع حساب السنت.",
        brokers_eyebrow: "الوسطاء الشركاء",
        brokers_title: "عيّن رمز الشريك على حسابك",
        brokers_subtitle: "بوتاتنا مدعومة فقط للوسطاء التاليين. انقر على الرمز لنسخه.",
        about_eyebrow: "من نحن",
        about_title: "عن دالال ستريت كوانتس",
        about_subtitle: "من نحن وماذا نفعل.",
        about_desc: "دالال ستريت كوانتس تبني وتختبر وتحلل استراتيجيات التداول الخوارزمية لـ Nifty 50 و Bank Nifty وأسهم Nifty 500 والذهب والبيتكوين.",
        subscribe_to: "اشترك في:",
        subscribe_1: "استبدل التخمين بالخوارزميات والمستشارين الخبراء",
        subscribe_2: "تعلم الاختبار الخلفي",
        telegram_channel: "قناة تليجرام",
        youtube: "يوتيوب",
        facebook: "فيسبوك",
        instagram: "إنستغرام",
        email_us: "راسلنا عبر البريد الإلكتروني",
        footer_desc: "بناء واختبار وتحليل استراتيجيات التداول الخوارزمية لـ Nifty 50 و Bank Nifty وأسهم Nifty 500 والذهب والبيتكوين.",
        weekly_call: "مكالمة إعداد مباشرة أسبوعية لمدة ساعة — مجانية!",
        disclaimer: "التداول ينطوي على مخاطر. اختبر دائماً على الحساب التجريبي أولاً.",
        copied_toast: "تم النسخ إلى الحافظة"
    },
    es: {
        nav_download: "Descargar",
        nav_setup: "Configuración",
        nav_license_check: "Verificar Licencia",
        nav_account: "Cuenta",
        nav_brokers: "Brókeres",
        nav_about: "Acerca de",
        nav_join_telegram: "Unirse a Telegram",
        hero_badge: "Dalal Street Quants",
        hero_title_1: "DSQ ",
        hero_title_2: "Bot de Forex",
        hero_lead: "Estrategias de trading algorítmico construidas, probadas y analizadas para Nifty 50, Bank Nifty, acciones Nifty 500, oro y Bitcoin.",
        hero_btn_download: "Descargar Bot Gratis",
        hero_btn_setup: "Guía de Configuración",
        stat_bot_versions: "Versiones del Bot",
        stat_licenses: "Licencias V2 – V3",
        stat_activation: "Activación de Licencia",
        stat_brokers: "Brókeres Asociados",
        tg_have_questions: "¿Tienes preguntas?",
        tg_text: "Únete a nuestro grupo de Telegram — nuestro equipo y comunidad te ayudarán.",
        tg_btn: "Unirse al Grupo de Telegram",
        section_download_eyebrow: "Descarga del Bot",
        section_download_title: "Elige Tu Versión",
        section_download_subtitle: "Elige la versión que se adapte a tu estilo de trading — V1 a V3 son completamente gratis.",
        v2_title: "DSQ V2",
        v2_tagline: "Versión 2.0 — Añade trailing stop",
        v2_free: "GRATIS",
        v2_was: "₹2,000",
        v2_feature1: "Trading en Cuadrícula",
        v2_feature2: "Trailing Stop",
        v2_feature3: "Gestión Máxima de Riesgo",
        v2_feature4: "Cobertura",
        v2_feature5: "Intervención Humana",
        v2_btn: "Descargar V2",
        v2_notice: "Solo Cuenta Real Cent/Micro — No disponible Demo",
        v3_title: "DSQ V3",
        v3_tagline: "Versión 3.0 — Añade cobertura",
        v3_free: "GRATIS",
        v3_was: "₹4,000",
        v3_btn: "Descargar V3",
        v4_title: "DSQ V4",
        v4_tagline: "Versión 4.0 — Suite completa de funciones",
        v4_free: "GRATIS",
        v4_was: "₹6,000",
        v4_offer: "La oferta termina en:",
        v4_days: "Días",
        v4_hours: "Horas",
        v4_mins: "Mins",
        v4_secs: "Segs",
        v4_btn: "Descargar V4",
        v4_ribbon: "Oferta Limitada",
        v4_badge: "GRATIS hasta el 15 de octubre",
        setup_eyebrow: "Configuración del Bot",
        setup_title: "Guía de Configuración Paso a Paso",
        setup_subtitle: "Sigue la guía a continuación — la configuración es la misma para todas las versiones del bot.",
        setup_alert_free: "Completamente Gratis.",
        setup_alert_free_text: "Las licencias DSQ V2 y V3 son gratis. V4 es GRATIS hasta el 15 de octubre. Sin cargos ocultos.",
        setup_step1_num: "1",
        setup_step1_title: "Descargar MT5 e Iniciar Sesión",
        setup_step2_num: "2",
        setup_step2_title: "Establecer Código de Asociado en Tu Cuenta",
        setup_step2_intro: "Nuestros bots solo son compatibles con los siguientes brókeres. Establece el código de asociado en tu cuenta de bróker:",
        setup_step3_num: "3",
        setup_step3_title: "Descargar e Instalar Tu Bot",
        setup_step4_num: "4",
        setup_step4_title: "Activar Tu Licencia en Línea",
        partner_broker: "Bróker asociado",
        open_account: "Abrir Cuenta",
        how_to_add: "Cómo agregar código de asociado",
        coming_soon: "Próximamente",
        license_widget_title: "Activar Tu Licencia en Línea",
        license_widget_subtitle: "Selecciona tu versión de bot y completa el formulario a continuación para enviar tu solicitud de licencia",
        label_bot_version: "Versión del Bot *",
        label_mt5_id: "ID de MT5 *",
        label_name: "Nombre Completo *",
        label_partner_code: "¿Código de Asociado Agregado? *",
        label_broker: "Nombre del Bróker *",
        label_account_type: "Tipo de Cuenta *",
        label_account_mode: "Modo de Cuenta *",
        select_bot_version: "Seleccionar Versión del Bot",
        select_partner_code: "Seleccionar Opción",
        yes: "Sí",
        no: "No",
        select_broker: "Seleccionar Bróker",
        select_account_type: "Seleccionar Tipo de Cuenta",
        select_account_mode: "Seleccionar Modo",
        real_account: "Cuenta Real",
        demo_account: "Cuenta Demo",
        cent_account: "Cuenta Cent",
        micro_account: "Cuenta Micro",
        standard_account: "Cuenta Estándar",
        btn_submit_license: "Enviar Solicitud de Licencia",
        submitting: "Enviando...",
        watch_video: "Ver: Cómo Obtener Tu Licencia",
        video_guide: "Guía en video paso a paso",
        verification_eyebrow: "Verificación de Licencia",
        verification_title: "Verifica el Estado de Tu Licencia",
        verification_subtitle: "Ingresa tu ID de MetaTrader para verificar el estado y detalles de tu licencia.",
        check_license: "Verificar Licencia",
        license_details: "Detalles de la Licencia",
        mt5_id_label: "ID de MetaTrader:",
        name_label: "Nombre:",
        valid_upto_label: "Válido Hasta:",
        status_label: "Estado:",
        account_eyebrow: "Configuración de Cuenta",
        account_title: "Elige Tu Cuenta",
        account_subtitle: "Solo recomendamos Cuentas Cent para un rendimiento óptimo del bot.",
        account_recommendation: "Nuestra Recomendación: Solo Cuenta Cent",
        account_rec_text: "Las cuentas cent proporcionan la mejor relación riesgo-capital para bots de trading en cuadrícula. Con 100 USD, obtienes 10,000 USC — suficiente margen para que el bot opere de manera segura.",
        capital_requirements: "Requisitos de Capital",
        capital_text: "10,000 INR (≈ 100 USD)<br>Deposita en una Cuenta Cent → recibe 10,000 USC<br>Este es el capital mínimo recomendado para todos los bots DSQ.",
        usd_warning: "Advertencia de Cuenta USD",
        usd_warning_text: "Una cuenta USD necesita al menos 10,000 USD para operar de manera segura. No recomendado para traders con pequeño capital.",
        compatible_accounts: "Cuentas Cent Compatibles",
        broker: "Bróker",
        cent_account_col: "Cuenta Cent",
        usd_account_col: "Cuenta USD",
        manual_intervention: "Intervención Manual Requerida:",
        manual_intervention_text: "Observa el bot mientras funciona. Detente inmediatamente y acepta la pérdida si ves un movimiento unilateral fuerte (por ejemplo, el precio sigue subiendo o bajando sin retroceder). El bot no está diseñado para mercados con tendencia.",
        safety_first: "Seguridad Primero:",
        safety_first_text: "Siempre prueba en una cuenta Demo primero antes de usar una cuenta Real. Mismo bróker, mismo tipo de cuenta cent.",
        brokers_eyebrow: "Brókeres Asociados",
        brokers_title: "Establecer Código de Asociado en Tu Cuenta",
        brokers_subtitle: "Nuestros bots solo son compatibles con los siguientes brókeres. Haz clic en un código para copiarlo.",
        about_eyebrow: "Acerca de Nosotros",
        about_title: "Acerca de Dalal Street Quants",
        about_subtitle: "Quiénes somos y qué hacemos.",
        about_desc: "Dalal Street Quants construye, prueba y analiza estrategias de trading algorítmico para Nifty 50, Bank Nifty, acciones Nifty 500, oro y Bitcoin.",
        subscribe_to: "Suscríbete a:",
        subscribe_1: "Reemplaza las suposiciones con algoritmos y Asesores Expertos",
        subscribe_2: "Aprende backtesting",
        telegram_channel: "Canal de Telegram",
        youtube: "YouTube",
        facebook: "Facebook",
        instagram: "Instagram",
        email_us: "Envíanos un Correo",
        footer_desc: "Construyendo, probando y analizando estrategias de trading algorítmico para Nifty 50, Bank Nifty, acciones Nifty 500, oro y Bitcoin.",
        weekly_call: "Llamada de configuración en vivo semanal de 1 hora — ¡GRATIS!",
        disclaimer: "El trading implica riesgo. Siempre prueba en Demo primero.",
        copied_toast: "Copiado al portapapeles"
    }
};

// Change Language Function
function changeLanguage(lang) {
    // Save language preference to localStorage
    localStorage.setItem('dsq_language', lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            // If element has child nodes, check if first child is text
            if (element.childNodes.length > 0 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
                element.childNodes[0].textContent = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
    
    // Update title attributes and placeholders
    const inputs = document.querySelectorAll('input[data-i18n-placeholder], select[data-i18n-placeholder]');
    inputs.forEach(input => {
        const key = input.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            input.placeholder = translations[lang][key];
        }
    });
}

// Load saved language preference on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedLang = localStorage.getItem('dsq_language') || 'en';
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.value = savedLang;
    }
    changeLanguage(savedLang);
});
