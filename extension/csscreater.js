'use strict';

var app = require('express')();
var fs = require('fs');
var basePath = "bundles/nodecg-speedcontrol/graphics/css/editcss";

module.exports = function (nodecg) {
    // Make 'graphics/css/editcss' folder if it doesn't exist
    if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath);
        console.log("Created bundles/nodecg-speedcontrol/graphics/css/editcss for edit-mode css files");
    }

    nodecg.listenFor("deleteCustomCss", deleteCustomCss);
    nodecg.listenFor("createCustomCss", createCustomCss);
};

function createCustomCss(cssDataObject) {
    var pathToFile = basePath +"/"+cssDataObject.sceneID + ".css";
    try {
        fs.writeFile(pathToFile, cssDataObject.generatedCss, function (err) {
            if (err) return console.log(err);
        });
    }
    catch (e) {
        console.log("Error: Could not write custom css: "+e);
    }
}

var fs = require("fs");

function deleteCustomCss(cssDataObject) {
    var pathToFile = basePath +"/"+cssDataObject.sceneID + ".css";
    try {
        fs.unlink(pathToFile, function (err) {
            if (err) return console.log(err);
        });
    }
    catch (e) {
    }
}