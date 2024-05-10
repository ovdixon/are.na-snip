document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.sendMessage('requestScreenshot', (response) => {
        if (response) {
            console.log(response)
            document.getElementById('screenshot').src = response;
        } else {
            console.log('No screenshot available');
        }
    });
});
