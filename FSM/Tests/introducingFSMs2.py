# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import NoAlertPresentException
import unittest, time, re

class IntroducingFSMs2(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Firefox()
        self.driver.implicitly_wait(5)
        self.base_url = " "
        self.verificationErrors = []
        self.accept_next_alert = True

    def test_introducing_f_s_ms2(self):
        driver = self.driver
        driver.get(self.base_url + "file:///home/matthew/Documents/Y4/CAL/FSM/Deploy/inf1/select-states-1.html")
        driver.find_element_by_id("0").click()
        driver.find_element_by_id("23").click()
        driver.find_element_by_id("check-button").click()
        driver.find_element_by_id("0").click()
        driver.find_element_by_id("21").click()
        driver.find_element_by_id("23").click()
        driver.find_element_by_id("check-button").click()
        self.assertTrue(self.is_element_present(By.CSS_SELECTOR, "img.cross.x-check-button"))
        driver.find_element_by_id("21").click()
        driver.find_element_by_id("23").click()
        driver.find_element_by_id("check-button").click()
        self.assertTrue(self.is_element_present(By.CSS_SELECTOR, "img.tick.x-check-button"))
        self.assertFalse(self.is_element_present(By.CSS_SELECTOR, "img.cross.x-check-button"))

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
