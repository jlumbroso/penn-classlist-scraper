chrome.action.onClicked.addListener((tab) => {
    // Check if the URL matches the expected base URL
    if (tab.url.startsWith("https://hosted.apps.upenn.edu/PennantReports/ClassListInstructor.aspx")) {
        console.log("Penn Class List Scraper: Browser action clicked. Sending message to content script...");
        chrome.tabs.sendMessage(tab.id, { action: "startExtraction" });
    } else {
        console.warn("Penn Class List Scraper: The current URL does not match the expected base URL.");
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "downloadJSON" && request.url && request.filename) {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: true
        }, downloadId => {
            if (chrome.runtime.lastError) {
                console.error("Download error:", chrome.runtime.lastError);
                sendResponse({ status: "error", message: chrome.runtime.lastError.message });
            } else {
                console.log("Download started with ID:", downloadId);
                sendResponse({ status: "success", message: "Download started." });
            }
        });

        return true;  // Keep the message channel open for the asynchronous operation
    }
});
