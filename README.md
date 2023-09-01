# Penn Class List Scraper

The Penn Class List Scraper is a Chrome extension designed to download all class list data for University of Pennsylvania courses in JSON format. This data can be used for various purposes, such as creating flash cards to learn student names.

## Usage

1. Install the Chrome extension by dragging and dropping [the latest release ZIP](https://github.com/jlumbroso/penn-classlist-scraper/releases/latest) into the [Chrome Extensions](chrome://extensions/) page (to accept extensions not from the Chrome Store, [you must turn on "Developer mode"](https://developer.chrome.com/docs/extensions/mv3/faq/#faq-dev-01) by checking the checkbox in the top right of the Chrome extension tab).
2. Navigate to the [Penn Class List](https://courses.at.upenn.edu/) page, go to "Class Lists".
3. On the new app page, click "Query Options" > "Class List - Instructor".
4. If you would like photos, make sure to check "Show Pics" and to only request a single session (this is to avoid bulk exposure of student photos).
4. Once the right roster appears, click on the extension icon in the top right corner of the browser to start the extraction.
5. Once the extraction is complete, the data will be automatically downloaded in JSON format.

## Output Format

The JSON files produced by this extension have the following format:

```json
{
    "imageLink": "https://hosted.apps.upenn.edu/PennImageService/rest/Images/sample_image_link",
    "studentId": "12345678",
    "Name": "Doe,John",
    "Classification": "JR",
    "EmailAddress": "jdoe@seas.upenn.edu",
    "Primary Major": "CIS",
    "Primary Division": "SEAS",
    "Registered Section": "CIS5000001",
    "Advisor": [
        "Smith,Robert A",
        "Johnson,Emily L"
    ],
    "Learning Address": "123 Penn St, Philadelphia, PA",
    "Privacy": false,
    "CU": "1.00",
    "Last": "Doe",
    "First": "John",
    "Primary Major Title": "Computer and Information Science",
    "Primary Division Title": "School of Engineering and Applied Science",
    "sectionInformation": {
        "sectionId": "CIS5000001",
        "enrollment": "50",
        "maxEnrollment": "60",
        "mail": "CIS-5000-001-202330@lists.upenn.edu",
        "termCode": "202330",
        "year": "2023",
        "termType": "Fall",
        "instructors": [
            "Taylor,Michael J"
        ],
        "sectionIdWithTerm": "CIS-5000-001-202330"
    },
    "imageBlob": "data:image/jpeg;base64,/9j/4AAQSkZ...sample_base64_data..."
}
```

## Architecture Overview

The extension is built around the following main components:

1. Popup Interface: Provides a user interface to initiate the scraping process and view the progress.
2. Content Script: Injected into the target webpage to extract the required data.
3. Background Script: Manages the overall state, progress, and facilitates the download of the extracted data.
4. Manifest: Defines the extension's metadata, permissions, and other configurations.

## Files Overview

### `popup.html`

* The popup displays the extraction progress using a progress bar and text.
* The popup's UI is updated using the `popup.js` script.

### `popup.js`

This script handles the interactions within the popup UI. It:

* Initiates the data extraction process when the popup is clicked.
* Requests and displays progress updates from the background script.
* Injects the content script into the active tab to start the extraction.

### `background.js`

This script runs in the background and:

* Listens for messages from the content script and popup.
* Manages the progress details of the data extraction.
* Initiates the download of the extracted data in JSON format.

### `content.js`

This script is injected into the target webpage and is responsible for:

* Loading external resources like `programData.json`.
* Extracting data from the class list table, including student details and images.
* Sending the extracted data to the background script for download.

### `manifest.json`

This file provides metadata about the extension and specifies configurations like:

* The permissions required.
* The scripts to be run.
* The icons to be displayed.
* The content security policy.

### `popup.html`

This is the HTML file for the popup UI. It displays:

* A progress bar showing the extraction progress.
* The number of entries and images extracted.
* The current status of the extraction.

### `popup.js`

* When the popup is opened, it sends a message to the content script to start the extraction.
* It also requests a progress update from the background script.
* The `updateUI` function updates the popup UI based on the progress received.
* The content script is injected into the current tab using the `injectContentScript` function. This function first checks if the content script is already injected, and if not, it injects it.
* A message listener is added to listen for progress updates from the content script and update the UI accordingly.

### `background.js`

* The background script listens for messages from the content script.
* It maintains a `currentProgressDetails` object to keep track of the extraction progress.
* When it receives a progress update from the content script, it updates the `currentProgressDetails` object.
* When it receives a request for progress details, it sends the `currentProgressDetails` object as a response.
* It also handles the downloading of the JSON file when requested by the content script.

### `content.js`

* External resources (programData and departmentCodes) are loaded.
* Helper methods are defined to extract data from the table rows, fetch and encode images, and extract section information.
* The `fetchAllRecords` function fetches all records from the table and sends progress updates to the background script.
* The `generateFilename` function generates a filename based on unique sections.
* A message listener is initialized to listen for the "startExtraction" message from the popup and start the extraction process.

### `manifest.json`

* The manifest file defines the extension's metadata, permissions, content scripts, background scripts, and other configurations.
* The content script is set to run at "document\_end" on the specified URL.
* The background script is set as a service worker.
* The popup is defined, and the necessary resources are made web-accessible.

## Code Organization

This section provides a detailed overview of how the different components of the extension interact with each other.

### `popup.js`

* When the popup is opened, it sends a message to the content script to start the extraction.
* It also requests a progress update from the background script.
* The `updateUI` function updates the popup UI based on the progress received.
* The content script is injected into the current tab using the `injectContentScript` function. This function first checks if the content script is already injected, and if not, it injects it.
* A message listener is added to listen for progress updates from the content script and update the UI accordingly.

### `background.js`

* The background script listens for messages from the content script.
* It maintains a `currentProgressDetails` object to keep track of the extraction progress.
* When it receives a progress update from the content script, it updates the `currentProgressDetails` object.
* When it receives a request for progress details, it sends the `currentProgressDetails` object as a response.
* It also handles the downloading of the JSON file when requested by the content script.

### `content.js`

* External resources (programData and departmentCodes) are loaded.
* Helper methods are defined to extract data from the table rows, fetch and encode images, and extract section information.
* The `fetchAllRecords` function fetches all records from the table and sends progress updates to the background script.
* The `generateFilename` function generates a filename based on unique sections.
* A message listener is initialized to listen for the "startExtraction" message from the popup and start the extraction process.

### `manifest.json`

* The manifest file defines the extension's metadata, permissions, content scripts, background scripts, and other configurations.
* The content script is set to run at "document\_end" on the specified URL.
* The background script is set as a service worker.
* The popup is defined, and the necessary resources are made web-accessible.

## Browser Permissions

The extension requires the following permissions:

* `downloads`: To download the extracted data.
* `activeTab`: To access and modify the content of the active tab.
* `scripting`: To programmatically inject scripts into webpages.
* `host_permissions`: To access the target webpage for data extraction.

## License

This project is licensed under [The Unlicense](https://unlicense.org/).
It means you can do anything you want this, for whatever purposes, you don't
have to credit me, this project, or anything.
