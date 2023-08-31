// Removed currentProgressDetails variable

// chrome.action.onClicked.addListener((tab) => {
//     console.log("Background: Penn Class List Scraper browser action clicked.");

//     // Check if the URL matches the expected base URL
//     if (tab.url.startsWith("https://hosted.apps.upenn.edu/PennantReports/ClassListInstructor.aspx")) {
//         console.log("Penn Class List Scraper: Browser action clicked. Sending message to content script...");
//         chrome.tabs.sendMessage(tab.id, { action: "startExtraction" });
//     } else {
//         console.warn("Penn Class List Scraper: The current URL does not match the expected base URL.");
//     }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // ======================================================================
    // PROGRESS BAR UPDATE ==================================================

    let currentProgressDetails = {
        progress: 0,
        entriesProgress: 0,
        imagesProgress: 0,
        totalEntries: 0,
        status: "Idle"
    };

    if (request.action === "updateProgress") {
        console.log("Background: Received progress details:", request);
        currentProgressDetails = {
            progress: request.progress,
            entriesProgress: request.entriesProgress,
            imagesProgress: request.imagesProgress,
            totalEntries: request.totalEntries,
            status: request.status
        };
    }
    if (request.action === "getProgress") {
        console.log("Background: Sending progress details:", currentProgressDetails);
        sendResponse(currentProgressDetails);
    }
    // if (request.action === "startExtraction") {
    //     chrome.tabs.sendMessage(tab.id, { action: "startExtraction" });
    //     sendResponse({message: "Extraction started"});
    // }    
    // ======================================================================

    if (request.action === "downloadJSON" && request.url && request.filename) {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: true
        }).then(downloadId => {
            console.log("Download started with ID:", downloadId);
            sendResponse({ status: "success", message: "Download started." });
        }).catch(error => {
            console.error("Download error:", error);
            sendResponse({ status: "error", message: error.message });
        });

        return true;  // Keep the message channel open for the asynchronous operation
    }
});

