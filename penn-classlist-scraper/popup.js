document.addEventListener('DOMContentLoaded', () => {
    // Start extraction
    console.log("Popup clicked. Sending startExtraction message to content script.");
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "startExtraction" });
    });

    // Request progress update from background script
    chrome.runtime.sendMessage({ action: "getProgress" }, response => {
        updateUI(response);
    });
});

function updateUI(response) {
    const progressBar = document.querySelector("#progressBar div");
    const entriesProgress = document.querySelector("#entriesProgress");
    const imagesProgress = document.querySelector("#imagesProgress");
    const totalEntries = document.querySelector("#totalEntries");
    const totalImages = document.querySelector("#totalImages");
    const status = document.querySelector("#status");

    if (response) {
        progressBar.style.width = response.progress ? response.progress + "%" : "0%";
        entriesProgress.textContent = response.entriesProgress || "0";
        imagesProgress.textContent = response.imagesProgress || "0";
        totalEntries.textContent = response.totalEntries || "0";
        totalImages.textContent = response.totalEntries || "0"; // Assuming each entry has one image
        status.textContent = response.status || "Unknown";
    } else {
        console.error("Received undefined response.");
    }
}

// Add the following functions to inject the content script:
async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

function injectContentScript(tab) {
    // This version could be injected multiple times:
    
    // const { id, url } = tab;
    // chrome.scripting.executeScript({
    //     target: { tabId: id },
    //     files: ['content.js']
    // });
    // console.log(`Loading content script on: ${url}`);

    // Check if the content script is already injected
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => typeof initializeMessageListener === "function"
    }).then(results => {
        // If the content script is not injected, inject it
        if (!results || !results[0] || !results[0].result) {
            return chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        }
    }).then(() => {
        console.log(`Loading content script on: ${tab.url}`);
    }).catch(error => {
        console.error("Error injecting content script:", error);
    });
}
    

// Call the functions:
getCurrentTab().then((tab) => {
    injectContentScript(tab);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateProgress") {
        updateUI(message);
    }
});
