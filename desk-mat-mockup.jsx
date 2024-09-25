"use strict";
#target photoshop;

// Paths
var templatePath = '~/Desktop/ai_etsy/etsy_assets/mock_ups/template/desk_mat_branding_mockup_2.psd';
var designFolderBasePath = '~/Desktop/ai_etsy/etsy_assets/original/';
var exportFolderBasePath = '~/Desktop/ai_etsy/etsy_assets/mock_ups/';

// Function to open the PSD template
function openTemplate(templatePath) {
    var fileRef = new File(templatePath);
    if (fileRef.exists) {
        app.open(fileRef);
        return true;
    } else {
        alert("Template file does not exist at the specified path.");
        return false;
    }
}

// Function to replace the contents of the smart object
function replaceSmartObject(newDesignPath) {
    var idplacedLayerReplaceContents = stringIDToTypeID("placedLayerReplaceContents");
    var desc = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    desc.putPath(idnull, new File(newDesignPath));
    executeAction(idplacedLayerReplaceContents, desc, DialogModes.NO);
}

// Function to check if the mockup already exists
function mockupExists(exportFolder, fileName) {
    var saveFile = new File(exportFolder + "/" + fileName + ".jpg");
    return saveFile.exists;
}

// Function to process each subfolder (e.g., 0, 1, 2) inside a main folder (e.g., 19-09-2024)
function processSubfoldersInMainFolder(mainFolder, exportMainFolder) {
    var subfolders = mainFolder.getFiles(function(f) { return f instanceof Folder; });
    
    if (subfolders.length === 0) {
        alert("No subfolders found in: " + mainFolder.fsName);
        return; // Skip if no subfolders are found
    }

    for (var i = 0; i < subfolders.length; i++) {
        var subfolder = subfolders[i];
        var exportFolder = new Folder(exportMainFolder + "/" + subfolder.name);
        
        processDesignFolder(subfolder, exportFolder); // Process design files in each subfolder
    }
}

// Function to process each design folder
function processDesignFolder(designFolder, exportFolder) {
    var designFiles = designFolder.getFiles(/\d{4,4}x\d{4,4}/); // Look for files with 'xxxx' resolution patterns in the name
    if (designFiles.length === 0) {
        alert("No design files found in folder: " + designFolder.fsName);
        return; // Skip if no design files are found
    }

    for (var i = 0; i < designFiles.length; i++) {
        var designFile = designFiles[i];
        if (designFile.name.indexOf('2543x1254') !== -1) { // Filter for specific resolution
            var fileName = designFile.name.split('.')[0]; // Exclude file extension for the mockup file name
            // Check if the mockup file already exists before processing
            if (mockupExists(exportFolder, fileName)) {
                continue; // Skip this file if the mockup already exists
            }
            // Replace smart object content with the design
            replaceSmartObject(designFile.fsName);
            // Export the mockup as PNG
            saveMockupAsJPEG(exportFolder, fileName);
        }
    }
}

// Function to save the image as a PNG
function saveMockupAsJPEG(exportPath, fileName) {
    var exportFolder = new Folder(exportPath);
    if (!exportFolder.exists) {
        exportFolder.create();
    }
    var saveFile = new File(exportPath + "/" + fileName + ".jpg"); // Change extension to .jpg

    var jpegOptions = new JPEGSaveOptions();
    jpegOptions.quality = 12; // Set maximum quality (1 to 12, where 12 is the highest)

    activeDocument.saveAs(saveFile, jpegOptions, true, Extension.LOWERCASE);
}

// Main function
function main() {
    // Open the template
    if (!openTemplate(templatePath)) {
        return; // Stop if the template doesn't open
    }

    // Get all main folders (e.g., 19-09-2024, 20-09-2024) inside the 'original' folder
    var baseDesignFolder = new Folder(designFolderBasePath);
    var mainFolders = baseDesignFolder.getFiles(function (f) { return f instanceof Folder; });

    if (mainFolders.length === 0) {
        alert("No main folders found in: " + baseDesignFolder.fsName);
        return; // Stop if no main folders are found
    }

    // Loop through each main folder (e.g., 19-09-2024, 20-09-2024)
    for (var j = 0; j < mainFolders.length; j++) {
        var mainFolder = mainFolders[j];
        var exportMainFolder = new Folder(exportFolderBasePath + mainFolder.name);
        processSubfoldersInMainFolder(mainFolder, exportMainFolder); // Process subfolders in each main folder
    }

    // Close the document without saving changes
    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}

// Run the script
main();