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

// Global variables for performance tracking and memory management
var processedCount = 0;
var maxHistoryStates = 5;
var memoryPurgeFrequency = 3;
var batchSize = 10;
var skipExistingMockups = true;
var startTime = new Date().getTime();
var processedDesignsCache = {};

// Cache the design files to avoid repetitive file system operations
var designFilesCache = {};

// Function to open the PSD template
function openTemplate(templatePath) {
    var fileRef = new File(templatePath);

    // Check interpolation method availability
    try {
        app.preferences.interpolation = ResampleMethod.BILINEAR;
    } catch (e) {
        // Ignore if not available in this PS version
    }

    if (fileRef.exists) {
        try {
            app.open(fileRef);

            // Limit history states if possible
            try {
                if (app.activeDocument.historyStates && app.activeDocument.historyStates.length) {
                    app.activeDocument.historyStates.length = Math.min(app.activeDocument.historyStates.length, maxHistoryStates);
                }
            } catch (e) {
                // Ignore if not available
            }

            return true;
        } catch (e) {
            // If opening fails, try one more time
            try {
                app.purge(PurgeTarget.ALLCACHES);
                app.open(fileRef);
                return true;
            } catch (e2) {
                return false;
            }
        }
    } else {
        return false;
    }
}

// Add memory management function
function cleanupMemory(aggressive) {
    try {
        // Force garbage collection
        app.purge(PurgeTarget.HISTORYCACHES);
        app.purge(PurgeTarget.ALLCACHES);

        if (aggressive) {
            try {
                app.purge(PurgeTarget.CLIPBOARDCACHE);
                app.purge(PurgeTarget.UNDOCACHES);
            } catch (e) {
                // Ignore if not available
            }
        }

        try {
            $.gc();
        } catch (e) {
            // Ignore if not available
        }

        return true;
    } catch (e) {
        // Silently continue if cleanup fails
        return false;
    }
}

// Function to pre-cache design files for faster access
function cacheDesignFiles(designFolder) {
    if (designFilesCache[designFolder.name]) {
        return designFilesCache[designFolder.name];
    }

    var designFiles = designFolder.getFiles(/\d{3,4}x\d{3,4}/);
    var filesByBaseName = {};

    for (var i = 0; i < designFiles.length; i++) {
        if (designFiles[i].name.indexOf('._') === 0) continue; // Skip hidden files

        // Extract base name
        var baseName = designFiles[i].name
            .replace(/-\d{3,4}x\d{3,4}.*$/, '')
            .replace(/-mockup.*$/, '');

        if (!filesByBaseName[baseName]) {
            filesByBaseName[baseName] = [];
        }

        filesByBaseName[baseName].push(designFiles[i]);
    }

    designFilesCache[designFolder.name] = filesByBaseName;
    return filesByBaseName;
}

function findDesignFileForSmartObject(designFolder, smartObjectName, baseName) {
    try {
        // Use cached design files instead of querying filesystem each time
        var filesByBaseName = cacheDesignFiles(designFolder);
        if (!filesByBaseName[baseName] || filesByBaseName[baseName].length === 0) {
            return null;
        }

        var designFiles = filesByBaseName[baseName];
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

        // First try to find the specific size for this base name
        for (var i = 0; i < designFiles.length; i++) {
            var fileName = designFiles[i].name;
            if (fileName.indexOf(targetSize) !== -1) {
                return designFiles[i];
            }
        }

        // If specific size not found and this is not a default case, try the default size
        if (targetSize !== "2543x1254") {
            for (var i = 0; i < designFiles.length; i++) {
                var fileName = designFiles[i].name;
                if (fileName.indexOf("2543x1254") !== -1) {
                    return designFiles[i];
                }
            }
        }

        // If still not found, return the first file in the array
        return designFiles[0];
    } catch (e) {
        return null;
    }
}

function replaceSmartObject(designFolder, smartObject, baseName) {
    try {
        var doc = app.activeDocument;
        var designFile = findDesignFileForSmartObject(designFolder, smartObject.name, baseName);

        if (!designFile || !designFile.exists) {
            return false;
        }

        // Create a new file reference for the design file
        var newFile = new File(designFile.fsName);

        // Timeout mechanism to prevent hanging
        var startTime = new Date().getTime();
        var maxTimeout = 15000; // 15 seconds max per replacement

        // Select the smart object layer
        doc.activeLayer = smartObject;

        // Verify the layer is actually a smart object
        if (doc.activeLayer.kind !== LayerKind.SMARTOBJECT) {
            return false;
        }

        // Try to replace the smart object contents
        try {
            var idplacedLayerReplaceContents = stringIDToTypeID("placedLayerReplaceContents");
            var desc = new ActionDescriptor();
            var idnull = charIDToTypeID("null");
            desc.putPath(idnull, newFile);
            executeAction(idplacedLayerReplaceContents, desc, DialogModes.NO);

            // Check for timeout
            if (new Date().getTime() - startTime > maxTimeout) {
                throw new Error("Operation timed out");
            }
        } catch (e) {
            // If it times out or errors, reset and skip this one
            if (e.toString().indexOf("timed out") !== -1) {
                resetTemplate(doc.path);
            }
            return false;
        }

        return true;
    } catch (e) {
        return false;
    }
}

// Function to check if the mockup already exists
function mockupExists(exportFolder, fileName) {
    // Create cache key
    var cacheKey = exportFolder + "/" + fileName;

    // Check if we've already checked this file
    if (processedDesignsCache[cacheKey] !== undefined) {
        return processedDesignsCache[cacheKey];
    }

    // Otherwise, check the filesystem
    var saveFile = new File(exportFolder + "/" + fileName + ".jpg");
    var result = saveFile.exists;

    // Cache the result
    processedDesignsCache[cacheKey] = result;

    return result;
}

function resetTemplate(templatePath) {
    try {
        // Close the current document without saving
        app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);

        // Perform cleanup before reopening
        cleanupMemory();

        // Reopen the template
        return openTemplate(templatePath);
    } catch (e) {
        // Try one more time with more cleanup
        try {
            cleanupMemory(true);
            return openTemplate(templatePath);
        } catch (e2) {
            return false;
        }
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
        jpegOptions.quality = 7;
        jpegOptions.embedColorProfile = true;

        // Use standard format if optimized is not available
        try {
            jpegOptions.formatOptions = FormatOptions.OPTIMIZEDBASELINE;
        } catch (e) {
            jpegOptions.formatOptions = FormatOptions.STANDARDBASELINE;
        }

        jpegOptions.matte = MatteType.NONE;

        activeDocument.saveAs(jpegFile, jpegOptions, true, Extension.LOWERCASE);

        processedCount++;

        // Perform memory cleanup every N designs
        if (processedCount % memoryPurgeFrequency === 0) {
            cleanupMemory(processedCount % (memoryPurgeFrequency * 3) === 0);
        }

        return true;
    } catch (e) {
        return false;
    }
}

// New function to collect all design names for batch processing
function collectDesignNames(designFolder) {
    var filesByBaseName = cacheDesignFiles(designFolder);
    var baseNames = [];

    for (var baseName in filesByBaseName) {
        if (filesByBaseName.hasOwnProperty(baseName)) {
            baseNames.push(baseName);
        }
    }

    return baseNames;
}

// Function to process each design folder
function processDesignFolder(designFolder, exportFolder, templatePath) {
    var templateNumber;
    try {
        templateNumber = templatePath.match(/mockup_(\d+)\.psd$/i)[1];
    } catch (e) {
        templateNumber = "1"; // Default if pattern not found
    }

    // Get all unique base names first
    var baseNames = collectDesignNames(designFolder);

    // Process in batches to prevent memory issues
    for (var batchIndex = 0; batchIndex < baseNames.length; batchIndex += batchSize) {
        // Process a batch of designs
        var batchEnd = Math.min(batchIndex + batchSize, baseNames.length);

        for (var i = batchIndex; i < batchEnd; i++) {
            var baseName = baseNames[i];

            // Check if mockup already exists
            var mockupFileName = baseName + '-mockup_' + templateNumber;
            if (skipExistingMockups && mockupExists(exportFolder, mockupFileName)) {
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

            try {
                findSmartObjectsInGroup(doc);
            } catch (e) {
                // If finding smart objects fails, reset and continue
                resetTemplate(templatePath);
                continue;
            }

            if (smartObjects.length === 0) {
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

                // Reset template after successful save
                if (!resetTemplate(templatePath)) {
                    cleanupMemory(true); // Force cleanup before attempting to recover
                    if (!resetTemplate(templatePath)) {
                        // Rather than stopping, skip to the next batch
                        break;
                    }
                }
            }
        }

        // Force cleanup between batches
        cleanupMemory(true);

        // Reopen template for next batch
        resetTemplate(templatePath);
    }
}

function main() {
    // Set preferences to optimize performance
    app.preferences.rulerUnits = Units.PIXELS;
    app.preferences.typeUnits = TypeUnits.PIXELS;
    app.displayDialogs = DialogModes.NO;

    // Performance monitoring
    startTime = new Date().getTime();

    // Clear cache
    designFilesCache = {};
    processedDesignsCache = {};

    var testFolder = new Folder(designFolderBasePath);

    if (!testFolder.exists) {
        alert("Cannot access path: " + designFolderBasePath);
        return;
    }

    for (var i = 0; i < templatePaths.length; i++) {
        var templatePath = templatePaths[i];

        // Open the template
        if (!openTemplate(templatePath)) {
            continue; // Skip this template instead of exiting completely
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
            continue; // Skip rather than exit
        }

        // Loop through each main folder (e.g., 24-02-2025)
        for (var j = 0; j < allFolders.length; j++) {
            var mainFolder = allFolders[j];
            var exportMainFolder = new Folder(exportFolderBasePath + mainFolder.name);

            processDesignFolder(mainFolder, exportMainFolder, templatePath);

            // Full memory cleanup between folders
            cleanupMemory(true);
        }

        // Clear caches between templates
        designFilesCache = {};
        processedDesignsCache = {};
    }

    // Final cleanup
    cleanupMemory(true);

    // Calculate performance metrics
    var totalTime = (new Date().getTime() - startTime) / 1000;
    var timePerDesign = processedCount > 0 ? totalTime / processedCount : 0;

    alert("Processing complete.\n" + processedCount + " mockups created in " + totalTime.toFixed(1) + " seconds.\n" +
          "Average: " + timePerDesign.toFixed(1) + " seconds per design.");
}

// Run the script
main();