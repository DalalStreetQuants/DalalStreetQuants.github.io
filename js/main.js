let toastTimer;
function copyToClipboard(element, text) {
navigator.clipboard.writeText(text).then(() => {
const toast = document.getElementById('copyToast');
toast.classList.add('show');
clearTimeout(toastTimer);
toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
});
}
