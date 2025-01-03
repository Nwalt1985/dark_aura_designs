"use strict";
#target photoshop;

// Paths
var templatePaths = [
	// Folder.decode('/volumes/Shop Assets/Etsy/surface_aura_designs/assets/pillow_templates/mockup_1.psd'),
	Folder.decode('/volumes/Shop Assets/Etsy/surface_aura_designs/assets/pillow_templates/mockup_2.psd'),
	Folder.decode('/volumes/Shop Assets/Etsy/surface_aura_designs/assets/pillow_templates/mockup_3.psd'),
	Folder.decode('/volumes/Shop Assets/Etsy/surface_aura_designs/assets/pillow_templates/mockup_4.psd'),
	// Folder.decode('/volumes/Shop Assets/Etsy/surface_aura_designs/assets/pillow_templates/mockup_5.psd'),
];

var designFolderBasePath = Folder.decode('/volumes/Shop Assets/Etsy/surface_aura_designs/assets/pillows/');
var exportFolderBasePath = Folder.decode('/volumes/Shop Assets/Etsy/surface_aura_designs/assets/pillows/mock_ups/');

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
    try {
        var idplacedLayerReplaceContents = stringIDToTypeID("placedLayerReplaceContents");
        var desc = new ActionDescriptor();
        var idnull = charIDToTypeID("null");
        desc.putPath(idnull, new File(newDesignPath));
        executeAction(idplacedLayerReplaceContents, desc, DialogModes.NO);
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

// Function to process each design folder
function processDesignFolder(designFolder, exportFolder, index) {
    var designFiles = designFolder.getFiles(/\d{4,4}x\d{4,4}/);

    for (var i = 0; i < designFiles.length; i++) {
        var designFile = designFiles[i];

        if (designFile.name.indexOf('-mockup-') !== -1 && designFile.name.indexOf('._') !== 0) {
            var fileName = designFile.name.split('.')[0] + '_' + index;

            if (mockupExists(exportFolder, fileName)) {
                continue;
            }

            if (replaceSmartObject(designFile.fsName)) {
                saveMockupAsJPEG(exportFolder, fileName);
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
    jpegOptions.quality = 12; // Set maximum quality (1 to 12, where 12 is the highest)

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
		var mainFolders = baseDesignFolder.getFiles(function (f) { return f instanceof Folder; });

		if (mainFolders.length === 0) {
			alert("No main folders found in: " + baseDesignFolder.fsName);
			return; // Stop if no main folders are found
		}

		// Loop through each main folder (e.g., 19-09-2024, 20-09-2024)
		for (var j = 0; j < mainFolders.length; j++) {
			var mainFolder = mainFolders[j];
			var exportMainFolder = new Folder(exportFolderBasePath + mainFolder.name);

			processDesignFolder(mainFolder, exportMainFolder, i);
		}
    }

    // Close the document without saving changes
    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}

// Run the script
main();