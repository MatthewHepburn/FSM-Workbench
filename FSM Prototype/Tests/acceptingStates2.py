# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import NoAlertPresentException
import unittest, time, re

class AcceptingStates2(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Firefox()
        self.driver.implicitly_wait(30)
        self.base_url = " "
        self.verificationErrors = []
        self.accept_next_alert = True
    
    def test_accepting_states2(self):
        driver = self.driver
        driver.get(self.base_url + "file:///home/matthew/Documents/Y4/CAL/FSM%20Prototype/Deploy/inf1/give-list-1.html")
        driver.find_element_by_id("qf0").clear()
        driver.find_element_by_id("qf0").send_keys("ab")
        driver.find_element_by_id("qf1").clear()
        driver.find_element_by_id("qf1").send_keys("aa")
        # ERROR: Caught exception [Error: locator strategy either id or name must be specified explicitly.]
        driver.find_element_by_id("check-button").click()
        # ERROR: Caught exception [Error: locator strategy either id or name must be specified explicitly.]
    
    def is_element_present(self, how, what):
        try: self.driver.find_element(by=how, value=what)
        except NoSuchElementException as e: return False
        return True
    
    def is_alert_present(self):
        try: self.driver.switch_to_alert()
        except NoAlertPresentException as e: return False
        return True
    
    def close_alert_and_get_its_text(self):
        try:
            alert = self.driver.switch_to_alert()
            alert_text = alert.text
            if self.accept_next_alert:
                alert.accept()
            else:
                alert.dismiss()
            return alert_text
        finally: self.accept_next_alert = True
    
    def tearDown(self):
        self.driver.quit()
        self.assertEqual([], self.verificationErrors)

if __name__ == "__main__":
    unittest.main()
