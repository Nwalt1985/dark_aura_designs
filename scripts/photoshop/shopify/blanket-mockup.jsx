"use strict";
#target photoshop;

// Paths
var templatePaths = [
	Folder.decode('~/Desktop/dark_aura_designs/templates/blankets_templates/blanket_mockup_1.psd'),
	Folder.decode('~/Desktop/dark_aura_designs/templates/blankets_templates/blanket_portrait_mockup_2.psd'),
	Folder.decode('~/Desktop/dark_aura_designs/templates/blankets_templates/blanket_landscape_mockup_3.psd'),
	Folder.decode('~/Desktop/dark_aura_designs/templates/blankets_templates/person_holding_blanket_mockup_4.psd'),
];

var designFolderBasePath = Folder.decode('/volumes/Shop Assets/Shopify/dark_aura_designs/blanket/');
// var designFolderBasePath = Folder.decode('/volumes/Shop Assets/Shopify/dark_aura_designs/test/');
var exportFolderBasePath = Folder.decode('/volumes/Shop Assets/Shopify/dark_aura_designs/blanket/mock_ups/');
// var exportFolderBasePath = Folder.decode('/volumes/Shop Assets/Shopify/dark_aura_designs/test/mock_ups/');

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

// Function to replace the contents of all matching smart objects
function replaceSmartObject(newDesignPath) {
    try {
        var doc = app.activeDocument;
        var smartObjects = [];

        // Recursive function to search through layer groups
        function findSmartObjectsInGroup(group) {
            for (var i = 0; i < group.layers.length; i++) {
                var layer = group.layers[i];

                // If this is a layer group/folder, search inside it
                if (layer.typename === "LayerSet") {
                    findSmartObjectsInGroup(layer);
                }
                // If this is a smart object, check if it matches our criteria
                else if (layer.typename === "ArtLayer" && layer.kind === LayerKind.SMARTOBJECT) {
                    var lowerName = layer.name.toLowerCase();

                    if (lowerName.indexOf("rectangle 1") !== -1) {
						smartObjects.push(layer)
					}
                }
            }
        }

        // Start the search from the root
        findSmartObjectsInGroup(doc);

        // Show number of smart objects found
        // alert("Found " + smartObjects.length + " smart object(s)");

        // If no smart objects found, show error
        if (smartObjects.length === 0) {
            alert("No matching smart objects found in template.");
            return false;
        }

        // Replace contents for each found smart object
        for (var j = 0; j < smartObjects.length; j++) {
            doc.activeLayer = smartObjects[j];
            var idplacedLayerReplaceContents = stringIDToTypeID("placedLayerReplaceContents");
            var desc = new ActionDescriptor();
            var idnull = charIDToTypeID("null");
            desc.putPath(idnull, new File(newDesignPath));
            executeAction(idplacedLayerReplaceContents, desc, DialogModes.NO);
        }

        return true;
    } catch (e) {
        alert("Error replacing smart object with file: " + newDesignPath + "\nError: " + e);
        return false;
    }
}

// Function to check if the mockup already exists
function mockupExists(exportFolder, fileName) {
    var saveFile = new File(exportFolder + "/" + fileName + ".jpg");
    return saveFile.exists;
}

// Function to check if the design file matches template requirements
function isValidDesignForTemplate(designFile, templatePath) {
    var templateName = templatePath.split('/').pop(); // Get the template filename
	var isPortrait = designFile.name.indexOf('_portrait') !== -1;

	switch (templateName) {
		case "blanket_template_1.psd":
			if (isPortrait) {
				return designFile.name.indexOf('-mockup-rotated-1063x826') !== -1;
			} else {
				return designFile.name.indexOf('-mockup-1063x826') !== -1;
			}
		case "blanket_portrait.psd":
			if (isPortrait) {
				return designFile.name.indexOf('-mockup-826x1063') !== -1;
			} else {
				return designFile.name.indexOf('-mockup-rotated-826x1063') !== -1;
			}
		case "blanket_landscape.psd":
			if (isPortrait) {
				return designFile.name.indexOf('-mockup-826x1063') !== -1;
			} else {
				return designFile.name.indexOf('-mockup-1063x826.jpg') !== -1;
			}
		case "person_holding_blanket.psd":
			if (isPortrait) {
				return designFile.name.indexOf('-mockup-826x1063') !== -1;
			} else {
				return designFile.name.indexOf('-mockup-rotated-826x1063') !== -1;
			}
	}

    // For all other templates, accept any mockup file
    return designFile.name.indexOf('-mockup-') !== -1;
}

// Function to reset the template
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

// Function to process each design folder
function processDesignFolder(designFolder, exportFolder, templatePath) {
	var templateNumber = templatePath.match(/mockup_(\d+)\.psd$/i)[1];
    var designFiles = designFolder.getFiles(/\d{3,4}x\d{3,4}/);


    for (var i = 0; i < designFiles.length; i++) {
        var designFile = designFiles[i];

        // Skip files that start with '._'
        if (designFile.name.indexOf('._') === 0) continue;

        if (isValidDesignForTemplate(designFile, templatePath)) {
            var fileName = designFile.name.split('.')[0] + '_' + templateNumber;

            if (mockupExists(exportFolder, fileName)) {
                continue;
            }

            if (replaceSmartObject(designFile.fsName)) {
                saveMockupAsJPEG(exportFolder, fileName);
                // Reset template after successful save
                if (!resetTemplate(templatePath)) {
                    return; // Stop processing if reset fails
                }
            }
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
    jpegOptions.quality = 6; // Set maximum quality (1 to 12, where 12 is the highest)

    activeDocument.saveAs(saveFile, jpegOptions, true, Extension.LOWERCASE);
}

// Main function

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