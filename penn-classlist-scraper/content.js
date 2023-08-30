
// **************************************************************************
// HELPER METHODS
// **************************************************************************

// Function to extract data from the table row
function extractDataFromRow(row) {
    const data = {};

    // Extract image link and student ID
    const imgElement = row.querySelector('.pdfImage');
    if (imgElement) {
        data.imageLink = imgElement.src;
        const studentIdMatch = imgElement.alt.match(/(\d+)/);
        if (studentIdMatch) {
            data.studentId = studentIdMatch[1];
        }
    }

    // Extract other details
    const detailsCell = row.querySelector('td.TableRecords_EvenLine:not(.pdfImageTd)');
    if (detailsCell) {
        const detailsHtml = detailsCell.innerHTML.split('<br>');
        detailsHtml.forEach(detail => {
            const match = detail.match(/<b>([^:]+): <\/b>(.*)/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if (key === 'EmailAddress' && value.includes('mailto:')) {
                    value = value.match(/<a href="mailto:([^"]+)">/)[1];
                }
                data[key] = value;
            }
        });
    }

    // Split Name into Last and First, if Name exists
    if (data.Name && typeof data.Name === 'string') {
        const nameParts = data.Name.split(',');
        data.Last = nameParts[0]?.trim();
        data.First = nameParts[1]?.trim();
    }

    // Convert Privacy to boolean, if Privacy exists
    if (data.Privacy) {
        data.Privacy = data.Privacy === 'Y';
    }

    // Parse Advisors as a list, if Advisor exists
    if (data.Advisor && typeof data.Advisor === 'string') {
        data.Advisor = data.Advisor.split(';').map(advisor => advisor.trim());
    }

    // Split Primary Major and Primary Division, if they exist
    if (data['Primary Major'] && typeof data['Primary Major'] === 'string') {
        const majorMatch = data['Primary Major'].match(/(\w+) \(([^)]+)\)/);
        if (majorMatch) {
            data['Primary Major'] = majorMatch[1];
            data['Primary Major Title'] = majorMatch[2];
        }
    }

    if (data['Primary Division'] && typeof data['Primary Division'] === 'string') {
        const divisionMatch = data['Primary Division'].match(/(\w+) \(([^)]+)\)/);
        if (divisionMatch) {
            data['Primary Division'] = divisionMatch[1];
            data['Primary Division Title'] = divisionMatch[2];
        }
    }

    return data;
}

// Function to fetch and encode image in base64
// This function is separate from extractDataFromRow to maintain a clear separation of concerns.
// extractDataFromRow is designed to extract data from the DOM, while this function deals with 
// asynchronous network requests and blob manipulation.
async function fetchAndEncodeImage(imageLink) {
    try {
        const response = await fetch(imageLink);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn('Failed to fetch or encode image:', imageLink);
        return null; // Return null for failed image fetches
    }
}

// Function to fetch all records
async function fetchAllRecords() {
    const tableRows = document.querySelectorAll('.pdfClassListEntry');
    const allDataPromises = Array.from(tableRows).map(async row => {
        try {
            const data = extractDataFromRow(row);
            data.imageBlob = await fetchAndEncodeImage(data.imageLink);
            return data;
        } catch (error) {
            console.error('Error processing row:', row, error);
            return null; // Return null for rows that encountered errors
        }
    });

    const allData = await Promise.all(allDataPromises);
    return allData.filter(data => data !== null); // Filter out null entries
}

// Generate a filename based on unique sections
function generateFilename(data) {
    const sections = new Set(data.map(entry => entry["Registered Section"]));
    const baseName = Array.from(sections).join("_");
    return baseName ? `penn_class_list_data_${baseName}.json` : "penn_class_list_data.json";
}


// **************************************************************************
// MESSAGE LISTENER
// **************************************************************************

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startExtraction") {
        console.log("Penn Class List Scraper: Message received. Starting data extraction...");

        // Check if there are any elements with class ".pdfClassListEntry"
        const classListEntries = document.querySelectorAll('.pdfClassListEntry');
        if (classListEntries.length === 0) {
            console.warn("Penn Class List Scraper: No class list data found. Please ensure a proper search has been launched.");
            sendResponse({ status: "error", message: "No class list data found." });
        } else {
            fetchAllRecords().then(allData => {
                console.log("Penn Class List Scraper: Data extraction complete. Preparing data for download...");
            
                const blob = new Blob([JSON.stringify(allData, null, 4)], {type: "application/json"});
                const blobURL = URL.createObjectURL(blob);  // Convert Blob to Blob URL
            
                console.log("Penn Class List Scraper: Sending data for download...");
                // Send the blob URL and filename to background.js to trigger the download
                chrome.runtime.sendMessage({
                    action: "downloadJSON",
                    url: blobURL,
                    filename: generateFilename(allData)
                }, response => {
                    if (chrome.runtime.lastError) {
                        console.error("Message error:", chrome.runtime.lastError);
                    } else if (response.status === "error") {
                        console.error("Download error:", response.message);
                    } else {
                        console.log("Message received:", response.message);
                    }
                });
            }).catch(error => {
                console.error('Penn Class List Scraper: Error fetching all records:', error);
            });            
        }
    }
    return true;  // This keeps the message channel open until sendResponse is called
});