"use strict";
/*global require */
//*global before*/
/*global __dirname*/
/*global process*/

var expect = require("chai").expect;
var webdriver = require("selenium-webdriver");
var test = require("selenium-webdriver/testing");
var FirefoxProfile = require("firefox-profile");
var fs = require("fs");
var by = webdriver.By;
var until = webdriver.until;
var ActionSequence = webdriver.ActionSequence;
var Key = webdriver.Key




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

// Can't use mouse move functionality in Firefox yet. See https://github.com/SeleniumHQ/selenium/issues/2285
var mouseMoveInFirefox = false; // :(


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
    if(browser === "phantomjs"){
        var driver =  new webdriver.Builder()
                                   .withCapabilities(webdriver.Capabilities.phantomjs())
                                   .build();
        driver.manage().window().setSize(1920, 1080);
        return driver;
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
    //Introducing FSMs I
    test.describe(`Q${n} should accept correct input`, function(){
        browserList.forEach(function(browser){
            test.it(`should take input AAB and display a tick in ${browser}`, function(){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/give-input-intro-to-fsm.html");

                expectToBeTrue(driver.isElementPresent(by.xpath("/html/body/div[1]/div[2]/div[2]/button[1]")));
                expectToBeTrue(driver.isElementPresent(by.xpath("/html/body/div[1]/div[2]/div[2]/button[2]")));

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
            test.it(`should take input AAAA and not display a tick in ${browser}`, function(){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/give-input-intro-to-fsm.html");

                expectToBeTrue(driver.isElementPresent(by.xpath("/html/body/div[1]/div[2]/div[2]/button[1]")));
                expectToBeTrue(driver.isElementPresent(by.xpath("/html/body/div[1]/div[2]/div[2]/button[2]")));

                var aButton = driver.findElement(by.xpath("/html/body/div[1]/div[2]/div[2]/button[1]"));

                expectToBeFalse(driver.isElementPresent(by.css(".give-input-tick")));
                aButton.click();
                expectToBeFalse(driver.isElementPresent(by.css(".give-input-tick")));
                aButton.click();
                expectToBeFalse(driver.isElementPresent(by.css(".give-input-tick")));
                aButton.click();
                expectToBeFalse(driver.isElementPresent(by.css(".give-input-tick")));
                aButton.click();
                expectToBeFalse(driver.isElementPresent(by.css(".give-input-tick")));

                driver.quit();
            });
        });
    });

    n = n + 1;
    // Introducing FSMs II
    test.describe(`Q${n} should accept correct input`, function(){
        browserList.forEach(function(browser){
            test.it(`shows a tick when correct state is selected in ${browser}`, function(){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/select-states-1.html");

                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-tick")));

                expectToBeTrue(driver.isElementPresent(by.id("m1-N3-label")));
                var correctNode = driver.findElement(by.id("m1-N3-label"));
                correctNode.click();

                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-tick")));

                expectToBeTrue(driver.isElementPresent(by.id("check-button")));
                var checkButton = driver.findElement(by.id("check-button"));
                checkButton.click();
                expectToBeTrue(driver.isElementPresent(by.css(".adjacent-tick")));
                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-cross")));

                driver.quit();
            });
        });
    });

    test.describe(`Q${n} should reject incorrect input`, function(){
        browserList.forEach(function(browser){
            test.it(`shows a cross when incorrect state is selected in ${browser}`, function(){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/select-states-1.html");

                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-cross")));

                expectToBeTrue(driver.isElementPresent(by.id("m1-N2-label")));
                var incorrectNode = driver.findElement(by.id("m1-N2-label"));
                incorrectNode.click();

                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-cross")));

                expectToBeTrue(driver.isElementPresent(by.id("check-button")));
                var checkButton = driver.findElement(by.id("check-button"));
                checkButton.click();

                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-tick")));
                expectToBeTrue(driver.isElementPresent(by.css(".adjacent-cross")));
                driver.quit();
            });
        });
    });

    n = n + 1;
    //Accepting states I
    test.describe(`Q${n} should accept correct input`, function(){
        browserList.forEach(function(browser){
            test.it(`shows a tick when correct state is selected in ${browser}`, function(){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/select-states-2-accepting-states.html");

                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-tick")));

                expectToBeTrue(driver.isElementPresent(by.id("m1-N2-label")));
                var correctNode = driver.findElement(by.id("m1-N2-label"));
                correctNode.click();

                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-tick")));

                expectToBeTrue(driver.isElementPresent(by.id("check-button")));
                var checkButton = driver.findElement(by.id("check-button"));
                checkButton.click();
                expectToBeTrue(driver.isElementPresent(by.css(".adjacent-tick")));
                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-cross")));

                driver.quit();

            });
        });
    });

    test.describe(`Q${n} should reject incorrect input`, function(){
        browserList.forEach(function(browser){
            test.it(`shows a cross when incorrect states are selected in ${browser}`, function(){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/select-states-1.html");

                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-cross")));

                expectToBeTrue(driver.isElementPresent(by.id("m1-N1-label")));
                var correctNode = driver.findElement(by.id("m1-N2-label"));
                var incorrectNode = driver.findElement(by.id("m1-N1-label"));
                incorrectNode.click();
                correctNode.click();

                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-cross")));

                expectToBeTrue(driver.isElementPresent(by.id("check-button")));
                var checkButton = driver.findElement(by.id("check-button"));
                checkButton.click();

                expectToBeFalse(driver.isElementPresent(by.css(".adjacent-tick")));
                expectToBeTrue(driver.isElementPresent(by.css(".adjacent-cross")));
                driver.quit();

            });
        });
    });

    n = n + 1;
    //Accepting states II
    test.describe(`Q${n} should accept correct input`, function(){
        browserList.forEach(function(browser){
            test.it(`sets class correct on "ab" in ${browser}`, function(){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/give-list-1.html");

                expectToBeTrue(driver.isElementPresent(by.id("qf1")));
                var textField = driver.findElement(by.id("qf1"));
                textField.sendKeys("ab").then(function(){
                    expectToBeTrue(driver.isElementPresent(by.id("check-button")));
                    var checkButton = driver.findElement(by.id("check-button"));
                    checkButton.click();

                    expectToBeTrue(driver.isElementPresent(by.css("#qf0.correct")));
                    expectToBeFalse(driver.isElementPresent(by.css("#qf0.incorrect")));

                    expectToBeTrue(driver.isElementPresent(by.css("#qf1.correct")));
                    expectToBeFalse(driver.isElementPresent(by.css("#qf1.incorrect")));

                    driver.quit();
                });

            });
        });
    });

    test.describe(`Q${n} should reject incorrect input`, function(){
        browserList.forEach(function(browser){
            test.it(`sets class incorrect on "bb" in ${browser}`, function(){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/give-list-1.html");

                expectToBeTrue(driver.isElementPresent(by.id("qf1")));
                var textField = driver.findElement(by.id("qf1"));
                textField.sendKeys("bb").then(function(){
                    expectToBeTrue(driver.isElementPresent(by.id("check-button")));
                    var checkButton = driver.findElement(by.id("check-button"));
                    checkButton.click();

                    expectToBeTrue(driver.isElementPresent(by.css("#qf0.correct")));
                    expectToBeFalse(driver.isElementPresent(by.css("#qf0.incorrect")));

                    expectToBeFalse(driver.isElementPresent(by.css("#qf1.correct")));
                    expectToBeTrue(driver.isElementPresent(by.css("#qf1.incorrect")));

                    driver.quit();
                });

            });
        });
        browserList.forEach(function(browser){
            test.it(`sets class incorrect on duplicate input in ${browser}`, function(){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/give-list-1.html");

                expectToBeTrue(driver.isElementPresent(by.id("qf1")));
                var textField = driver.findElement(by.id("qf1"));
                textField.sendKeys("aa").then(function(){
                    expectToBeTrue(driver.isElementPresent(by.id("check-button")));
                    var checkButton = driver.findElement(by.id("check-button"));
                    checkButton.click();

                    expectToBeTrue(driver.isElementPresent(by.css("#qf0.correct")));
                    expectToBeFalse(driver.isElementPresent(by.css("#qf0.incorrect")));

                    expectToBeFalse(driver.isElementPresent(by.css("#qf1.correct")));
                    expectToBeTrue(driver.isElementPresent(by.css("#qf1.incorrect")));

                    driver.quit();
                });

            });
        });
    });

    n = n + 1;
    //Introducing cycles
    test.describe(`Q${n} should accept correct input`, function(){
        browserList.forEach(function(browser){
            test.it(`sets class correct on correct answer in ${browser}`, function(done){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/give-list-cyles.html");

                expectToBeTrue(driver.isElementPresent(by.id("qf1")));
                var textField1 = driver.findElement(by.id("qf1"));

                expectToBeTrue(driver.isElementPresent(by.id("qf2")));
                var textField2 = driver.findElement(by.id("qf2"));

                textField1.sendKeys("aaabb").then(function(){
                    textField2.sendKeys("aaaaaabb").then(function(){
                        expectToBeTrue(driver.isElementPresent(by.id("check-button")));
                        var checkButton = driver.findElement(by.id("check-button"));
                        checkButton.click();

                        expectToBeTrue(driver.isElementPresent(by.css("#qf0.correct")));
                        expectToBeFalse(driver.isElementPresent(by.css("#qf0.incorrect")));

                        expectToBeTrue(driver.isElementPresent(by.css("#qf1.correct")));
                        expectToBeFalse(driver.isElementPresent(by.css("#qf1.incorrect")));

                        expectToBeTrue(driver.isElementPresent(by.css("#qf2.correct")));
                        expectToBeFalse(driver.isElementPresent(by.css("#qf2.incorrect")));

                        driver.quit();
                        done();
                    });
                });

            });
        });
    });

    test.describe(`Q${n} should reject incorrect input`, function(){
        browserList.forEach(function(browser){
            test.it(`sets class incorrect on incorrect answer in ${browser}`, function(done){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/give-list-cyles.html");

                expectToBeTrue(driver.isElementPresent(by.id("qf1")));
                var textField1 = driver.findElement(by.id("qf1"));

                expectToBeTrue(driver.isElementPresent(by.id("qf2")));
                var textField2 = driver.findElement(by.id("qf2"));

                textField1.sendKeys("aabbb").then(function(){
                    textField2.sendKeys("baaaabb").then(function(){
                        expectToBeTrue(driver.isElementPresent(by.id("check-button")));
                        var checkButton = driver.findElement(by.id("check-button"));
                        checkButton.click();

                        expectToBeTrue(driver.isElementPresent(by.css("#qf0.correct")));
                        expectToBeFalse(driver.isElementPresent(by.css("#qf0.incorrect")));

                        expectToBeFalse(driver.isElementPresent(by.css("#qf1.correct")));
                        expectToBeTrue(driver.isElementPresent(by.css("#qf1.incorrect")));

                        expectToBeFalse(driver.isElementPresent(by.css("#qf2.correct")));
                        expectToBeTrue(driver.isElementPresent(by.css("#qf2.incorrect")));

                        driver.quit();
                        done();
                    });
                });

            });
        });
    });

    n = n + 1;
    // Machine construction I;
    test.describe(`Q${n} should accept a correctly constructed machine`, function(){
        browserList.forEach(function(browser){
            test.it(`gives correct feedback in ${browser}`, function(done){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/machine-construction-1.html");

                var linkTool = driver.findElement(by.id("m1-linetool"));
                var n1 = driver.findElement(by.id("m1-N0"));
                var n2 = driver.findElement(by.id("m1-N1"));
                var n3 = driver.findElement(by.id("m1-N2"));
                var n4 = driver.findElement(by.id("m1-N3"));

                //link (0,1,"a")
                linkTool.click();
                var buildLink1 = function(){
                    return n1.click().then(function(){
                        return n2.click().then(function(){
                            return driver.findElement(by.id("m1-rename-option0-rect")).then(function(value){
                                value.click();
                                return driver.findElement(by.id("m1-rename-submit-text")).then(function(value){
                                    return value.click();
                                });
                            });
                        });
                    });
                };

                //link (1,0, "a")
                var buildLink2 = function(){
                    return n2.click().then(function(){
                        return n1.click().then(function(){
                            return driver.findElement(by.id("m1-rename-option0-rect")).then(function(value){
                                value.click();
                                return driver.findElement(by.id("m1-rename-submit-text")).then(function(value){
                                    return value.click();
                                });
                            });
                        });
                    });
                };

                //link (2,3, "b")
                var buildLink3 = function(){
                    return n2.click().then(function(){
                        return n3.click().then(function(){
                            return driver.findElement(by.id("m1-rename-option1-rect")).then(function(value){
                                value.click();
                                return driver.findElement(by.id("m1-rename-submit-text")).then(function(value){
                                    return value.click();
                                });
                            });
                        });
                    });
                };

                //link (3,4, "c")
                var buildLink4 = function(){
                    return n3.click().then(function(){
                        return n4.click().then(function(){
                            return driver.findElement(by.id("m1-rename-option2-rect")).then(function(value){
                                value.click();
                                return driver.findElement(by.id("m1-rename-submit-text")).then(function(value){
                                    return value.click();
                                });
                            });
                        });
                    });
                };

                buildLink1().then(function(){
                    buildLink2().then(function(){
                        buildLink3().then(function(){
                            buildLink4().then(function(){
                                expectToBeFalse(driver.isElementPresent(by.css(".table-tick-small")));
                                expectToBeFalse(driver.isElementPresent(by.css(".table-cross-small")));

                                var checkButton = driver.findElement(by.id("check-button"));
                                checkButton.click().then(function(){
                                    expectToBeTrue(driver.isElementPresent(by.css(".table-tick-small")));
                                    expectToBeFalse(driver.isElementPresent(by.css(".table-cross-small")));

                                    driver.quit();
                                    done();
                                });
                            });
                        });
                    });
                });



            });
        });
    });

    test.describe(`Q${n} should reject an incorrectly constructed machine`, function(){
        browserList.forEach(function(browser){
            test.it(`gives correct feedback in ${browser}`, function(done){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/machine-construction-1.html");

                var linkTool = driver.findElement(by.id("m1-linetool"));
                var n1 = driver.findElement(by.id("m1-N0"));
                var n2 = driver.findElement(by.id("m1-N1"));
                var n3 = driver.findElement(by.id("m1-N2"));
                var n4 = driver.findElement(by.id("m1-N3"));

                //link (0,1,"a")
                linkTool.click();
                var buildLink1 = function(){
                    return n1.click().then(function(){
                        return n2.click().then(function(){
                            return driver.findElement(by.id("m1-rename-option1-rect")).then(function(value){
                                value.click();
                                return driver.findElement(by.id("m1-rename-submit-text")).then(function(value){
                                    return value.click();
                                });
                            });
                        });
                    });
                };

                //link (1,0, "a")
                var buildLink2 = function(){
                    return n2.click().then(function(){
                        return n1.click().then(function(){
                            return driver.findElement(by.id("m1-rename-option0-rect")).then(function(value){
                                value.click();
                                return driver.findElement(by.id("m1-rename-submit-text")).then(function(value){
                                    return value.click();
                                });
                            });
                        });
                    });
                };

                //link (2,3, "b")
                var buildLink3 = function(){
                    return n2.click().then(function(){
                        return n3.click().then(function(){
                            return driver.findElement(by.id("m1-rename-option1-rect")).then(function(value){
                                value.click();
                                return driver.findElement(by.id("m1-rename-submit-text")).then(function(value){
                                    return value.click();
                                });
                            });
                        });
                    });
                };

                //link (3,4, "c")
                var buildLink4 = function(){
                    return n3.click().then(function(){
                        return n4.click().then(function(){
                            return driver.findElement(by.id("m1-rename-option2-rect")).then(function(value){
                                value.click();
                                return driver.findElement(by.id("m1-rename-submit-text")).then(function(value){
                                    return value.click();
                                });
                            });
                        });
                    });
                };

                buildLink1().then(function(){
                    buildLink2().then(function(){
                        buildLink3().then(function(){
                            buildLink4().then(function(){
                                expectToBeFalse(driver.isElementPresent(by.css(".table-tick-small")));
                                expectToBeFalse(driver.isElementPresent(by.css(".table-cross-small")));

                                var checkButton = driver.findElement(by.id("check-button"));
                                checkButton.click().then(function(){
                                    expectToBeTrue(driver.isElementPresent(by.css(".table-tick-small")));
                                    expectToBeTrue(driver.isElementPresent(by.css(".table-cross-small")));

                                    driver.quit();
                                    done();
                                });
                            });
                        });
                    });
                });



            });
        });
    });

    n = n + 1;
    //Machine construction II
    test.describe(`Q${n} should accept a correctly constructed machine`, function(){
        browserList.forEach(function(browser){
            test.it(`gives correct feedback in ${browser}`, function(done){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/machine-construction-2.html");

                var nodeTool = driver.findElement(by.id("m1-nodetool"));
                var linkTool = driver.findElement(by.id("m1-linetool"));
                var acceptingTool = driver.findElement(by.id("m1-acceptingtool"));
                var n2 = driver.findElement(by.id("m1-N1-label"));

                var addNode = function(){
                    return nodeTool.click().then(function(){
                        return driver.findElement(by.id("m1")).click();
                    });
                };

                var addLink1 = function(){
                    return linkTool.click().then(function(){
                        return n2.click().then(function(){
                            return driver.findElement(by.id("m1-N2")).click().then(function(){
                                return driver.findElement(by.id("m1-rename-option0-rect")).then(function(value){
                                    value.click();
                                    return driver.findElement(by.id("m1-rename-submit-text")).then(function(value){
                                        return value.click();
                                    });
                                });
                            });
                        });
                    });
                };

                var addLink2 = function(){
                    return driver.findElement(by.id("m1-N2")).click().then(function(){
                        return driver.findElement(by.id("m1-N2")).click().then(function(){
                            return driver.findElement(by.id("m1-rename-option0-rect")).then(function(value){
                                value.click();
                                return driver.findElement(by.id("m1-rename-submit-text")).then(function(value){
                                    return value.click();
                                });
                            });
                        });
                    });
                };

                var makeNodeAccepting = function(){
                    return acceptingTool.click().then(function(){
                        return driver.findElement(by.id("m1-N2")).click();
                    });
                };

                addNode().then(function(){
                    addLink1().then(function(){
                        addLink2().then(function(){
                            makeNodeAccepting().then(function(){
                                expectToBeFalse(driver.isElementPresent(by.css(".table-tick-small")));
                                expectToBeFalse(driver.isElementPresent(by.css(".table-cross-small")));

                                var checkButton = driver.findElement(by.id("check-button"));
                                checkButton.click().then(function(){
                                    expectToBeTrue(driver.isElementPresent(by.css(".table-tick-small")));
                                    expectToBeFalse(driver.isElementPresent(by.css(".table-cross-small")));

                                    driver.quit();
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    n = n + 1;
    //Using longer tokens
    test.describe(`Q${n} should accept correct input`, function(){
        browserList.forEach(function(browser){
            test.it(`gives correct feedback in ${browser}`, function(done){
                var driver = getDriver(browser);
                driver.get(deployPath + "inf1/select-states-self-service.html");

                var targetNode = driver.findElement(by.id("m1-N3"));
                var checkButton = driver.findElement(by.id("check-button"));

                targetNode.click().then(function(){
                    expectToBeFalse(driver.isElementPresent(by.css(".adjacent-tick")));
                    checkButton.click().then(function(){
                        expectToBeTrue(driver.isElementPresent(by.css(".adjacent-tick")));
                        driver.quit();
                        done();
                    });
                });
            });
        });
    });

    n = n + 1;
    //Vending machine acceptor
    test.describe(`Q${n} should accept a correctly constructed machine`, function(){
        //Filter out firefox until Marionette implementation improves.
        browserList.filter(browser => browser !== "firefox" || mouseMoveInFirefox).forEach(function(browser){
            test.it(`gives correct feedback in ${browser}`, function(done){
                var driver = getDriver(browser);

                var pageElements = {};

                // Function to add variable assignment to the queue
                // (queued to ensure target elements exist)
                var defineVar = function(propName, byFunction){
                    var fn = function(){
                        pageElements[propName] = driver.findElement(byFunction);
                        return pageElements[propName];
                    };
                    queue.push(fn);
                };

                var click = function(propName){
                    queue.push(() => pageElements[propName].click());

                };

                var clickAt = function(propName, x, y){
                    //click at coordinates (x,y) on the element pageElements[propName]
                    queue.push(() => new ActionSequence(driver).mouseMove(pageElements[propName], {x, y}).click().perform());
                };

                var sendKeys = function(keys){
                    queue.push(() => new ActionSequence(driver).sendKeys(keys).perform());
                };

                var queue = [];
                //Populate queue
                queue.push(() => driver.get(deployPath + "inf1/vending-machine-1.html"));

                defineVar("linkTool", by.id("m1-linetool"));
                defineVar("nodeTool", by.id("m1-nodetool"));
                defineVar("textTool", by.id("m1-texttool"));
                defineVar("acceptingTool", by.id("m1-acceptingtool"));
                defineVar("checkButton", by.id("check-button"));
                defineVar("bg", by.id("m1"));
                defineVar("p0", by.id("m1-N0"));
                defineVar("p10", by.id("m1-N2"));
                defineVar("p20", by.id("m1-N1"));

                //create nodes
                click("nodeTool");
                clickAt("bg",300, 100);
                defineVar("p30", by.id("m1-N3"));
                clickAt("bg", 300, 200);
                defineVar("p40", by.id("m1-N4"));
                clickAt("bg", 350, 100);
                defineVar("p50", by.id("m1-N5"));
                clickAt("bg", 450, 100);
                defineVar("irnBru", by.id("m1-N6"));
                clickAt("bg", 450, 300);
                defineVar("water", by.id("m1-N7"));

                //label nodes
                click("textTool");
                click("p30");
                sendKeys("30p");
                sendKeys(Key.ENTER);
                click("p40");
                sendKeys("40p");
                sendKeys(Key.ENTER);
                click("p50");
                sendKeys("50p+");
                sendKeys(Key.ENTER);

                //create links
                //link from 10p to 30p for input 20p
                click("linkTool");
                clickAt("p10", 15, 5); //use clickAt to avoid clicking on the nodename (as Selenium doesn't like that)
                clickAt("p30", 15, 5);
                defineVar("linkOption20p", by.id("m1-rename-option1-rect"));
                click("linkOption20p");
                defineVar("submitButton", by.id("m1-rename-submit-text"));
                click("submitButton");

                //link from 20p to 30p for input 10p
                clickAt("p20", 15, 5);
                clickAt("p30", 15, 5);
                defineVar("linkOption10p", by.id("m1-rename-option0-rect"));
                click("linkOption10p");
                defineVar("submitButton", by.id("m1-rename-submit-text"));
                click("submitButton");

                //link from 20p to 40p for input 20p
                clickAt("p20", 15, 5);
                clickAt("p40", 15, 5);
                defineVar("linkOption20p", by.id("m1-rename-option1-rect"));
                click("linkOption20p");
                defineVar("submitButton", by.id("m1-rename-submit-text"));
                click("submitButton");

                //link from 30p to 40p for input 10p
                clickAt("p30", 15, 5);
                clickAt("p40", 15, 5);
                defineVar("linkOption10p", by.id("m1-rename-option0-rect"));
                click("linkOption10p");
                defineVar("submitButton", by.id("m1-rename-submit-text"));
                click("submitButton");

                //link from 30p to 50p for input 20p
                clickAt("p30", 15, 5);
                clickAt("p50", 15, 5);
                defineVar("linkOption20p", by.id("m1-rename-option1-rect"));
                click("linkOption20p");
                defineVar("submitButton", by.id("m1-rename-submit-text"));
                click("submitButton");

                //link from 40p to 50p for input 10p or 20p
                clickAt("p40", 15, 5);
                clickAt("p50", 15, 5);
                defineVar("linkOption10p", by.id("m1-rename-option0-rect"));
                click("linkOption10p");
                defineVar("linkOption20p", by.id("m1-rename-option1-rect"));
                click("linkOption20p");
                defineVar("submitButton", by.id("m1-rename-submit-text"));
                click("submitButton");

                //link from 50p to 50p for input 10p or 20p
                clickAt("p50", 15, 5);
                clickAt("p50", 15, 5);
                defineVar("linkOption10p", by.id("m1-rename-option0-rect"));
                click("linkOption10p");
                defineVar("linkOption20p", by.id("m1-rename-option1-rect"));
                click("linkOption20p");
                defineVar("submitButton", by.id("m1-rename-submit-text"));
                click("submitButton");

                //link from 50p to irnBru for input Irn-Bru
                clickAt("p50", 15, 5);
                clickAt("irnBru", 15, 5);
                defineVar("linkOptionIrnBru", by.id("m1-rename-option3-rect"));
                click("linkOptionIrnBru");
                defineVar("submitButton", by.id("m1-rename-submit-text"));
                click("submitButton");

                //link from 50p to water for input Water
                clickAt("p50", 15, 5);
                clickAt("water", 15, 5);
                defineVar("linkOptionWater", by.id("m1-rename-option2-rect"));
                click("linkOptionWater");
                defineVar("submitButton", by.id("m1-rename-submit-text"));
                click("submitButton");

                //link from 40p to water for input Water
                clickAt("p40", 15, 5);
                clickAt("irnBru", 15, 5);
                defineVar("linkOptionWater", by.id("m1-rename-option2-rect"));
                click("linkOptionWater");
                defineVar("submitButton", by.id("m1-rename-submit-text"));
                click("submitButton");

                //Set accepting states
                click("acceptingTool");
                click("irnBru");
                click("water");

                //Submit answer
                click("checkButton");

                //Add correctness test to the queue
                queue.push(function(){
                    expectToBeTrue(driver.isElementPresent(by.css(".table-tick-small")));
                    expectToBeFalse(driver.isElementPresent(by.css(".table-cross-small")));
                    driver.quit();
                    done();
                });


                var last = queue.shift()();
                while(queue.length > 0){

                    var next = queue.shift();
                    last = last.then(next());
                }
            });
        });
    });







});