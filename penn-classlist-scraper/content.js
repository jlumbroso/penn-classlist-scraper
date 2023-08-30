// **************************************************************************
// LOAD EXTERNAL RESOURCES
// **************************************************************************

let programData = [];
let departmentCodes = [];

async function loadProgramData() {
    try {
        const response = await fetch(chrome.runtime.getURL('programData.json'));
        const data = await response.json();
        
        programData = data;
        departmentCodes = programData.map(entry => entry.department);
        return programData;  // Return the loaded data
    } catch (error) {
        console.error("Error loading programData:", error);
        return null;  // Return null in case of an error
    }
}


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
    const detailsCell = row.querySelector('td.TableRecords_EvenLine:not(.pdfImageTd), td.TableRecords_OddLine:not(.pdfImageTd)');
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
    else {
        console.log("No details cell found for " + data.studentId + ".");
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


// Function to extract section information
function extractSectionInfo(div) {
    const sectionInfo = {};

    // Extract section ID
    const sectionMatch = div.textContent.match(/([A-Z0-9]+)\s+-\s+/);
    if (sectionMatch) {
        sectionInfo.sectionId = sectionMatch[1];
    }

    // Extract section title
    const titleMatch = div.textContent.match(/-\s+([A-Za-z\s]+)\s+Enrl:/);
    if (titleMatch) {
        sectionInfo.title = titleMatch[1].trim();
    }

    // Extract enrollment
    const enrollmentMatch = div.textContent.match(/Enrl:\s*(\d+)/);
    if (enrollmentMatch) {
        sectionInfo.enrollment = enrollmentMatch[1];
    }

    // Extract max enrollment
    const maxEnrollmentMatch = div.textContent.match(/Mx Enrl:\s*(\d+)/);
    if (maxEnrollmentMatch) {
        sectionInfo.maxEnrollment = maxEnrollmentMatch[1];
    }

    // Extract mail using anchor tag with mailto
    const mailAnchor = div.querySelector('a[href^="mailto:"]');
    if (mailAnchor) {
        sectionInfo.mail = mailAnchor.textContent;

        // Extract year and term code from the mail
        const termCodeMatch = mailAnchor.textContent.match(/(\d{6})@/);
        if (termCodeMatch) {
            sectionInfo.termCode = termCodeMatch[1];
            sectionInfo.year = termCodeMatch[1].substring(0, 4);

            const termTypeCode = termCodeMatch[1].substring(4);
            switch (termTypeCode) {
                case '10':
                    sectionInfo.termType = 'Spring';
                    break;
                case '20':
                    sectionInfo.termType = 'Summer';
                    break;
                case '30':
                    sectionInfo.termType = 'Fall';
                    break;
            }
        }
    }

    // Extract instructors
    const instructorsDiv = div.querySelector('.ThemeGrid_Width8.ThemeGrid_MarginGutter');
    if (instructorsDiv) {
        sectionInfo.instructors = Array.from(instructorsDiv.querySelectorAll('span'))
            .map(span => span.textContent.trim())
            .filter(Boolean); // Filter out any empty strings
    } else {
        // Fallback to text parsing
        const instructorsMatch = div.textContent.match(/Instructors:\s*([\s\S]+)/);
        if (instructorsMatch) {
            sectionInfo.instructors = instructorsMatch[1].split(',').map(instr => instr.trim());
        }
    }

    // Construct sectionIdWithTerm using email address
    if (sectionInfo.mail) {
        const emailBreakdownMatch = sectionInfo.mail.match(/^([A-Z]+)-(\d{4})-(\d{3})-(\d{6})@/);
        if (emailBreakdownMatch) {
            sectionInfo.sectionIdWithTerm = emailBreakdownMatch[0].slice(0, -1);  // Remove trailing '@'
        }
    }

    // If sectionIdWithTerm is not set using email, use programData.json
    if (!sectionInfo.sectionIdWithTerm && sectionInfo.sectionId) {
        for (const dept of departmentCodes) {
            if (sectionInfo.sectionId.startsWith(dept)) {
                const remainingPart = sectionInfo.sectionId.slice(dept.length);
                sectionInfo.sectionIdWithTerm = `${dept}-${remainingPart}-${sectionInfo.termCode}`;
                break;
            }
        }
    }

    // If sectionIdWithTerm is still not set, fall back to the original heuristic
    if (!sectionInfo.sectionIdWithTerm && sectionInfo.sectionId && sectionInfo.termCode) {
        // Heuristic: If sectionId is of the form ABC1234567, break it down into ABC-1234-567
        const idBreakdownMatch = sectionInfo.sectionId.match(/^([A-Z]+)(\d{4})(\d{3})$/);
        if (idBreakdownMatch) {
            sectionInfo.sectionIdWithTerm = `${idBreakdownMatch[1]}-${idBreakdownMatch[2]}-${idBreakdownMatch[3]}-${sectionInfo.termCode}`;
        } else {
            // Fallback: Use the sectionId directly
            sectionInfo.sectionIdWithTerm = `${sectionInfo.sectionId}-${sectionInfo.termCode}`;
        }
    }

    return sectionInfo;
}



// Function to fetch all records
async function fetchAllRecords() {
    const tableRows = document.querySelectorAll('.pdfClassListEntry, .resultsWrappers.ClassListTable');
    let currentSectionInfo = null;
    const allData = [];

    // Ensure programData is loaded before proceeding
    if (!programData.length) {
        await loadProgramData();
    }

    for (const row of tableRows) {
        try {
            // Check if the row is a section information row
            if (row.classList.contains('resultsWrappers') && row.classList.contains('ClassListTable')) {
                currentSectionInfo = extractSectionInfo(row);
                console.log('Detected section information row:', currentSectionInfo);
                // We don't want to store section info rows in the same array as student rows
                continue;
            } 
            // Check if the row is a student data row
            else if (row.classList.contains('pdfClassListEntry')) {
                const data = extractDataFromRow(row);
                console.log('Extracted student row:', data);

                // Inject the current section information
                if (currentSectionInfo) {
                    data.sectionInformation = currentSectionInfo;
                }

                data.imageBlob = await fetchAndEncodeImage(data.imageLink);
                allData.push(data);
            }
        } catch (error) {
            console.error('Error processing row:', row, error);
        }
    }

    return allData;
}


// Generate a filename based on unique sections
function generateFilename(data) {
    const sections = new Set(data.map(entry => {
        if (entry.sectionInformation && entry.sectionInformation.sectionIdWithTerm) {
            return entry.sectionInformation.sectionIdWithTerm;
        }
        return entry["Registered Section"];
    }));
    const baseName = Array.from(sections).join("_");
    return baseName ? `penn_class_list_data_${baseName}.json` : "penn_class_list_data.json";
}


// **************************************************************************
// MESSAGE LISTENER
// **************************************************************************

function initializeMessageListener() {
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
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeMessageListener);
} else {
    initializeMessageListener();
}