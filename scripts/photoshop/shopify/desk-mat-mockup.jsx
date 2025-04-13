"use strict";
#target photoshop;

// Paths

var templatePaths = [
	Folder.decode('~/Desktop/dark_aura_designs/templates/desk_mat_templates/desk_mat_branding_mockup_1.psd'),
	Folder.decode('~/Desktop/dark_aura_designs/templates/desk_mat_templates/desk_mat_branding_mockup_2.psd'),
	Folder.decode('~/Desktop/dark_aura_designs/templates/desk_mat_templates/desk_mat_branding_mockup_3.psd'),
	Folder.decode('~/Desktop/dark_aura_designs/templates/desk_mat_templates/desk_mat_branding_mockup_4.psd'),
];

var designFolderBasePath = Folder.decode('/volumes/Shop Assets/Shopify/dark_aura_designs/desk_mats/');
var exportFolderBasePath = Folder.decode('/volumes/Shop Assets/Shopify/dark_aura_designs/desk_mats/mock_ups/');

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

function findDesignFileForSmartObject(designFolder, smartObjectName, baseName) {
    try {
        var designFiles = designFolder.getFiles(/\d{3,4}x\d{3,4}/);
        var targetSize = "";

        // Determine which size we're looking for based on the smart object name
        switch(smartObjectName.toLowerCase()) {
            case "small":
                targetSize = "2160x1815";
                break;
            case "medium":
                targetSize = "3540x2070";
                break;
            case "large":
                targetSize = "4725x2325";
                break;
            default:
                targetSize = "2543x1254"; // Default size
        }

        // First try to find the specific size for this base name, excluding hidden files
        for (var i = 0; i < designFiles.length; i++) {
            var fileName = designFiles[i].name;
            if (fileName.indexOf('._') !== 0 &&
                fileName.indexOf(baseName) !== -1 &&
                fileName.indexOf(targetSize) !== -1) {
                return designFiles[i];
            }
        }

        // If specific size not found and this is not a default case, try the default size
        if (targetSize !== "2543x1254") {
            for (var i = 0; i < designFiles.length; i++) {
                var fileName = designFiles[i].name;
                if (fileName.indexOf('._') !== 0 &&
                    fileName.indexOf(baseName) !== -1 &&
                    fileName.indexOf("2543x1254") !== -1) {
                    return designFiles[i];
                }
            }
        }

        return null;
    } catch (e) {
        alert("Error in findDesignFileForSmartObject: " + e);
        return null;
    }
}

function replaceSmartObject(designFolder, smartObject, baseName) {
    try {
        var doc = app.activeDocument;
        var designFile = findDesignFileForSmartObject(designFolder, smartObject.name, baseName);

        if (!designFile) {
            // alert("No suitable design file found for smart object: " + smartObject.name);
            return false;
        }

        // Make sure the design file exists and is readable
        if (!designFile.exists) {
            alert("Design file does not exist: " + designFile.fsName);
            return false;
        }

        // Select the smart object layer
        doc.activeLayer = smartObject;

        // Verify the layer is actually a smart object
        if (doc.activeLayer.kind !== LayerKind.SMARTOBJECT) {
            alert("Selected layer is not a smart object: " + smartObject.name);
            return false;
        }

        // Create a new file reference for the design file
        var newFile = new File(designFile.fsName);

        // Try to replace the smart object contents
        try {
            var idplacedLayerReplaceContents = stringIDToTypeID("placedLayerReplaceContents");
            var desc = new ActionDescriptor();
            var idnull = charIDToTypeID("null");
            desc.putPath(idnull, newFile);
            executeAction(idplacedLayerReplaceContents, desc, DialogModes.NO);
        } catch (e) {
            alert("Error replacing smart object contents: " + e + "\nFile: " + designFile.name);
            return false;
        }

        // Verify the replacement was successful
        if (doc.activeLayer.kind !== LayerKind.SMARTOBJECT) {
            alert("Smart object replacement failed for: " + smartObject.name);
            return false;
        }

        return true;
    } catch (e) {
        alert("Error in replaceSmartObject: " + e + "\nSmart Object: " + smartObject.name);
        return false;
    }
}

// Function to check if the mockup already exists
function mockupExists(exportFolder, fileName) {
    var saveFile = new File(exportFolder + "/" + fileName + ".jpg");
    return saveFile.exists;
}

function isValidDesignForTemplate(designFile, templatePath) {
	var templateName = templatePath.split('/').pop();
    // For all other templates, accept any mockup file
	switch (templateName) {
		case "desk_mat_branding_mockup_5.psd":
			return designFile.name.indexOf('-4320x3630') !== -1;
		default:
			return designFile.name.indexOf('-mockup-') !== -1;
	}
}

function resetTemplate(templatePath) {
    try {
        // Close the current document without saving
        app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);

        // Reopen the template
        return openTemplate(templatePath);
    } catch (e) {
        alert("Error resetting template: " + e);
        return false;
    }
}

function saveMockupAsJPEG(exportPath, fileName) {
    try {
        var exportFolder = new Folder(exportPath);
        if (!exportFolder.exists) {
            exportFolder.create();
        }

        // Flatten the image before saving
        activeDocument.flatten();

        // Save directly as JPEG
        var jpegFile = new File(exportPath + "/" + fileName + ".jpg");
        var jpegOptions = new JPEGSaveOptions();
        jpegOptions.quality = 10;
        jpegOptions.embedColorProfile = true;
        jpegOptions.formatOptions = FormatOptions.STANDARDBASELINE;
        jpegOptions.matte = MatteType.NONE;

        activeDocument.saveAs(jpegFile, jpegOptions, true, Extension.LOWERCASE);

        // Verify the JPEG file was created
        if (!jpegFile.exists) {
            throw new Error("JPEG file was not created successfully");
        }

        return true;
    } catch (e) {
        alert("Error saving JPEG: " + e + "\nFile: " + fileName);
        return false;
    }
}

// Function to process each design folder
function processDesignFolder(designFolder, exportFolder, templatePath) {
    var templateNumber = templatePath.match(/mockup_(\d+)\.psd$/i)[1];

    // Get unique design names (without size and extension)
    var allFiles = designFolder.getFiles(/\d{3,4}x\d{3,4}/);
    var processedDesigns = {};

    // Group files by base design name
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i].name.indexOf('._') === 0) continue; // Skip hidden files

        // Extract base name (remove size pattern and any existing mockup patterns)
        var baseName = allFiles[i].name
            .replace(/-\d{3,4}x\d{3,4}.*$/, '')
            .replace(/-mockup.*$/, '');

        if (!processedDesigns[baseName]) {
            // Check if mockup already exists
            var mockupFileName = baseName + '-mockup_' + templateNumber;
            if (mockupExists(exportFolder, mockupFileName)) {
                continue;
            }

            // Find all smart objects in the template
            var doc = app.activeDocument;
            var smartObjects = [];

            function findSmartObjectsInGroup(group) {
                for (var i = 0; i < group.layers.length; i++) {
                    var layer = group.layers[i];
                    if (layer.typename === "LayerSet") {
                        findSmartObjectsInGroup(layer);
                    } else if (layer.typename === "ArtLayer" && layer.kind === LayerKind.SMARTOBJECT) {
                        var lowerName = layer.name.toLowerCase();
                        if (lowerName.indexOf("small") !== -1 ||
                            lowerName.indexOf("medium") !== -1 ||
                            lowerName.indexOf("large") !== -1 ||
							lowerName.indexOf("default") !== -1) {
                            smartObjects.push(layer);
                        }
                    }
                }
            }

            findSmartObjectsInGroup(doc);

            if (smartObjects.length === 0) {
                alert("No matching smart objects found in template.");
                continue;
            }

            // Replace each smart object with its corresponding design file
            var success = true;
            for (var j = 0; j < smartObjects.length; j++) {
                if (!replaceSmartObject(designFolder, smartObjects[j], baseName)) {
                    success = false;
                    break;
                }
            }

            if (success) {
                saveMockupAsJPEG(exportFolder, mockupFileName);
                processedDesigns[baseName] = true;

                // Reset template after successful save
                if (!resetTemplate(templatePath)) {
                    return; // Stop processing if reset fails
                }
            }
        }
    }
}

function main() {
    var testFolder = new Folder(designFolderBasePath);

    if (!testFolder.exists) {
        alert("Cannot access path: " + designFolderBasePath);
        return;
    }

    for (var i = 0; i < templatePaths.length; i++) {
        var templatePath = templatePaths[i];

        // Open the template
        if (!openTemplate(templatePath)) {
            return;
        }

        var baseDesignFolder = new Folder(designFolderBasePath);
        var allFolders = baseDesignFolder.getFiles(function (f) {
            // Check if it's a folder and matches dd-mm-yyyy format
            if (!(f instanceof Folder)) return false;
            var datePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
            return datePattern.test(f.name);
        });

        if (allFolders.length === 0) {
            alert("No valid date-formatted folders found in: " + baseDesignFolder.fsName);
            return;
        }

        // Loop through each main folder (e.g., 24-02-2025)
        for (var j = 0; j < allFolders.length; j++) {
            var mainFolder = allFolders[j];
            var exportMainFolder = new Folder(exportFolderBasePath + mainFolder.name);

            processDesignFolder(mainFolder, exportMainFolder, templatePath);
        }
    }
}

// Run the script
main();