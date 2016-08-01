"use strict"
/*global require */
//*global before*/
/*global __dirname*/

var expect = require("chai").expect;
var webdriver = require("selenium-webdriver");
var test = require("selenium-webdriver/testing");
var FirefoxProfile = require("firefox-profile");
var by = webdriver.By;
//var until = webdriver.until;



// Tell the Node.js bindings to use Marionette (geckodriver)
// NB: the geckodriver executable must be in the PATH *AND* may need to be renamed to "wires"
// if using older components.
var firefoxCapabilities = webdriver.Capabilities.firefox();
firefoxCapabilities.set("marionette", true);

// we must prevent firefox from always opening the welcome page, as this breaks all tests
// More info: http://stackoverflow.com/questions/33937067/firefox-webdriver-opens-first-run-page-all-the-time
// NB: The Marionette driver is EXPLICITLY NOT COMPATIBLE with firefox 47.
// These tests were written for Firefox Developer Edition.
var ffProfile = new FirefoxProfile();
ffProfile.setPreference("startup.homepage_override.mstone", "ignore") ;
ffProfile.setPreference("startup.homepage_welcome_url.additional", "about:blank");
ffProfile.setPreference("startup.homepage", "about:blank");
ffProfile.setPreference("startup.homepage_welcome_url", "about:blank");
ffProfile.setPreference("xpinstall.signatures.required", false);
ffProfile.setPreference("toolkit.telemetry.reportingpolicy.firstRun", false);
ffProfile.encoded(function(encoded){
    firefoxCapabilities.set("firefox_profile", encoded);
});


var deployPath = "file:" + __dirname.slice(0, __dirname.lastIndexOf("Tests")) + "Deploy/";

function expectToBeTrue(promise){
    promise.then(function(value){
        expect(value).to.be.true;
    });
}

function expectToBeFalse(promise){
    promise.then(function(value){
        expect(value).to.be.false;
    });
}

function getDriver(browser){
    if(browser === "chrome"){
        return new webdriver.Builder()
                            .withCapabilities(webdriver.Capabilities.chrome())
                            .build();
    }
    if(browser === "firefox"){
        return new webdriver.Builder()
                            .withCapabilities(firefoxCapabilities)
                            .build();
    }
}

var browserList = ["chrome", "firefox"];


test.describe("Test selenium-webdriver", function(){
    browserList.forEach(function(browser){
        test.it(`should load the index in ${browser}`, function(){
            var driver = getDriver(browser);
            driver.get(deployPath + "index.html");
            driver.quit();
        });
    });


});

test.describe("Test inf1 questions", function(){
    var n = 1;
    test.describe(`Q${n} should accept correct input`, function(){
        browserList.forEach(function(browser){
            test.it(`should take input AAB and display a tick in ${browser}`, function(){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/give-input-intro-to-fsm.html");
                var aButton = driver.findElement(by.xpath("/html/body/div[1]/div[2]/div[2]/button[1]"));
                var bButton = driver.findElement(by.xpath("/html/body/div[1]/div[2]/div[2]/button[2]"));
                aButton.click();
                aButton.click();
                expectToBeFalse(driver.isElementPresent(by.css(".give-input-tick")));
                bButton.click();
                expectToBeTrue(driver.isElementPresent(by.css(".give-input-tick")));
                driver.quit();
            });
        });

    });
    test.describe(`Q${n} should not accept incorrect input`, function(){
        browserList.forEach(function(browser){
            test.it(`should take input AAB and display a tick in ${browser}`, function(){
                var driver = getDriver("chrome");
                driver.get(deployPath + "inf1/give-input-intro-to-fsm.html");
                var aButton = driver.findElement(by.xpath("/html/body/div[1]/div[2]/div[2]/button[1]"));
                var bButton = driver.findElement(by.xpath("/html/body/div[1]/div[2]/div[2]/button[2]"));
                aButton.click();
                aButton.click();
                driver.isElementPresent(by.css(".give-input-tick")).then(function(isPresent){
                    expect(isPresent).to.be.false;
                });
                bButton.click();
                driver.isElementPresent(by.css(".give-input-tick")).then(function(isPresent){
                    expect(isPresent).to.be.true;
                });
                driver.quit();
            });
        })
    });

    n = n + 1;

    test.describe(`Q${n} should accept correct input`, function(){

    });
});