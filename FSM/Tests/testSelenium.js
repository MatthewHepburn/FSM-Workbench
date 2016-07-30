/*global require */
/*global describe*/
/*global it*/
/*global before*/

var expect = require("chai").expect;
var webdriver = require('selenium-webdriver')
var test = require('selenium-webdriver/testing')
var by = webdriver.By;
var until = webdriver.until;

var deployPath = "file:" + __dirname.slice(0, __dirname.lastIndexOf("Tests")) + "Deploy/"

function expectToBeTrue(promise){
	promise.then(function(value){
		expect(value).to.be.true;
	})
}

function expectToBeFalse(promise){
	promise.then(function(value){
		expect(value).to.be.false;
	})
}


test.describe("Test selenium-webdriver", function(){
	var driver
	test.it("should load the index", function(){
		driver = new webdriver.Builder()
								  .withCapabilities(webdriver.Capabilities.chrome())
								  .build();
		driver.get(deployPath + 'index.html');
		driver.quit()

	})

})

test.describe("Test inf1 questions", function(){
	var driver
	var n = 1;
	test.describe(`Q${n} should accept correct input`, function(){
		var driver;
		test.it("should take input AAB and display a tick", function(){
			driver = new webdriver.Builder()
								  .withCapabilities(webdriver.Capabilities.chrome())
								  .build();
			driver.get(deployPath + 'inf1/give-input-intro-to-fsm.html');
			var aButton = driver.findElement(by.xpath("/html/body/div[1]/div[2]/div[2]/button[1]"));
			var bButton = driver.findElement(by.xpath("/html/body/div[1]/div[2]/div[2]/button[2]"));
			aButton.click();
			aButton.click();
			expectToBeFalse(driver.isElementPresent(by.css(".give-input-tick")))
			bButton.click();
			expectToBeTrue(driver.isElementPresent(by.css(".give-input-tick")))
			driver.quit()

		});
	})
	test.describe(`Q${n} should not accept incorrect input`, function(){
		var driver;
		test.it("should take input AAB and display a tick", function(){
			driver = new webdriver.Builder()
								  .withCapabilities(webdriver.Capabilities.chrome())
								  .build();
			driver.get(deployPath + 'inf1/give-input-intro-to-fsm.html');
			var aButton = driver.findElement(by.xpath("/html/body/div[1]/div[2]/div[2]/button[1]"));
			var bButton = driver.findElement(by.xpath("/html/body/div[1]/div[2]/div[2]/button[2]"));
			aButton.click();
			aButton.click();
			driver.isElementPresent(by.css(".give-input-tick")).then(function(isPresent){
				expect(isPresent).to.be.false;
			})
			bButton.click();
			driver.isElementPresent(by.css(".give-input-tick")).then(function(isPresent){
				expect(isPresent).to.be.true;
			})


		});
	})
	n = n + 1;
})