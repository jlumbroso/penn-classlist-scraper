chrome.browserAction.onClicked.addListener(function(tab) {
    // Check if the URL matches the expected base URL
    if (tab.url.startsWith("https://hosted.apps.upenn.edu/PennantReports/ClassListInstructor.aspx")) {
        console.log("Calling Penn Class List Scraper on: " + tab.url);
        chrome.tabs.executeScript({
            file: "content.js"
        });
    } else {
        console.warn("The current URL does not match the expected base URL for the Penn Class List Scraper.");
    }
});

// Generate a filename based on unique sections
function generateFilename(data) {
    const sections = new Set(data.map(entry => entry["Registered Section"]));
    const baseName = Array.from(sections).join("_");
    return baseName ? `penn_class_list_data_${baseName}.json` : "penn_class_list_data.json";
}

// Listen for messages from content.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "downloadJSON" && request.data) {
        const blob = new Blob([JSON.stringify(request.data, null, 4)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const filename = generateFilename(request.data);
        chrome.downloads.download({
            url: url,
            filename: filename
        });
    }
});
