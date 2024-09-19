#target photoshop

// Paths
var templatePath = '~/Desktop/ai_etsy/etsy_assets/mock_ups/template/desk_mat_branding_mockup.psd';
var designFolderBasePath = '~/Desktop/ai_etsy/etsy_assets/original/';
var exportFolderBasePath = '~/Desktop/ai_etsy/etsy_assets/mock_ups/';

// Get today's date in the format 'dd-mm-yyyy'
var today = new Date();
var dd = today.getDate();
dd = (dd < 10 ? '0' : '') + dd;

var mm = today.getMonth() + 1; // January is 0!
mm = (mm < 10 ? '0' : '') + mm;

var yyyy = today.getFullYear();
var dateString = dd + '-' + mm + '-' + yyyy;

// Function to open the PSD template
function openTemplate(templatePath) {
    var fileRef = new File(templatePath);
    if (fileRef.exists) {
        app.open(fileRef);
    } else {
        alert("Template file does not exist at the specified path.");
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

// Function to save the image as a PNG
function saveMockupAsPNG(exportPath, fileName) {
    var exportFolder = new Folder(exportPath);
    if (!exportFolder.exists) {
        exportFolder.create();
    }
    
    var saveFile = new File(exportPath + "/" + fileName);
    
    var pngOptions = new PNGSaveOptions();
    pngOptions.compression = 9; // Maximum compression
    activeDocument.saveAs(saveFile, pngOptions, true, Extension.LOWERCASE);
}

// Function to process each design folder
function processDesignFolder(designFolder, exportFolder) {
    var designFiles = designFolder.getFiles(/\d{4,4}x\d{4,4}/); // Look for files with 'xxxx' resolution patterns in the name

    for (var i = 0; i < designFiles.length; i++) {
        var designFile = designFiles[i];
        if (designFile.name.indexOf('2543x1254') !== -1) { // Filter for specific resolution

            // Replace smart object content with the design
            replaceSmartObject(designFile.fsName);

            // Export the mockup
            var fileName = designFile.name;
            saveMockupAsPNG(exportFolder, fileName);
        }
    }
}

// Main function
function main() {
    // Open the template
    openTemplate(templatePath);

    // Loop through each index folder (e.g. 0, 1, 2)
    var baseDesignFolder = new Folder(designFolderBasePath + dateString);
    var indexFolders = baseDesignFolder.getFiles(function(f) { return f instanceof Folder; });

    for (var j = 0; j < indexFolders.length; j++) {
        var indexFolder = indexFolders[j];
        var exportFolder = new Folder(exportFolderBasePath + dateString + "/" + indexFolder.name);
        
        processDesignFolder(indexFolder, exportFolder);
    }

    // Close the document without saving changes
    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}

main();