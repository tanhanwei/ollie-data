document.getElementById('testButton').addEventListener('click', function() {
    console.log('Button clicked');
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "performTestActions") {
        console.log("Performing test actions");
        document.getElementById('testButton').click();
        window.scrollTo(0, 100);
    }
});