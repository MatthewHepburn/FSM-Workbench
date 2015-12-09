# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import NoAlertPresentException
import unittest, time, re

class Demo1(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Firefox()
        self.driver.implicitly_wait(5)
        self.base_url = " "
        self.verificationErrors = []
        self.accept_next_alert = True

    def test_demo1(self):
        driver = self.driver
        driver.get(self.base_url + "file:///home/matthew/Documents/Y4/CAL/FSM%20Prototype/Deploy/inf1/demo1-intro-to-fsm.html")
        driver.find_element_by_id("demo-B").click()
        driver.find_element_by_id("demo-B").click()
        driver.find_element_by_id("demo-B").click()
        driver.find_element_by_id("demo-A").click()
        driver.find_element_by_id("demo-reset").click()
        driver.find_element_by_id("demo-A").click()
        driver.find_element_by_id("demo-A").click()
        driver.find_element_by_id("demo-B").click()
        self.assertTrue(self.is_element_present(By.CSS_SELECTOR, "img.x-check-button.inline-feedback"))

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
