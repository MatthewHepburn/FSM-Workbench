import unittest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys


class checkTitleProgression(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Firefox()

    def test_search_in_python_org(self):
        driver = self.driver
        driver.get("http://homepages.inf.ed.ac.uk/s1020995")
        assert "Finite State Machines" in driver.title
        for i in range(1,10):
            next_link = driver.find_element_by_link_text('Next')
            next_link.click()
            assert str(i) in driver.title


    def tearDown(self):
        self.driver.close()

class checkContextMenus(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Firefox()

    def test_search_in_python_org(self):
        driver = self.driver
        driver.get("http://homepages.inf.ed.ac.uk/s1020995/satisfy-list-1.html")
        # Select a node and context-click it.
        node = driver.find_element_by_css_selector('.node')
        webdriver.ActionChains(driver).context_click(node).perform()

        # Test 'Toggle Accepting':
        toggleAccepting = driver.find_element_by_css_selector(".toggleaccepting")        
        toggleAccepting.click()
        assert "accepting" in node.get_attribute("class")
        webdriver.ActionChains(driver).context_click(node).perform()
        toggleAccepting = driver.find_element_by_css_selector(".toggleaccepting")
        toggleAccepting.click()
        assert "accepting" not in node.get_attribute("class")

        # Test 'Rename State'
        webdriver.ActionChains(driver).context_click(node).perform()
        renameState = driver.find_element_by_css_selector(".renamestate")
        renameState.click()
        form = driver.find_element_by_xpath('//*[@id="node0"]')
        form.clear()
        form.send_keys("aaa1")
        form.send_keys(Keys.RETURN)
        # Check that model has updated:
        assert "aaa1" in str(driver.execute_script("return model.nodes"))

        # Select a linklabel and context-click it:
        id = "linklabel" + str(driver.execute_script("return model.links[0].id"))
        link = driver.find_element_by_css_selector("#" + id)
        webdriver.ActionChains(driver).context_click(link).perform()

        # Test 'Change Conditions':
        changeConditions = driver.find_element_by_css_selector(".changeconditions")
        changeConditions.click()
        form = driver.find_element_by_css_selector(".renameinput")
        form.clear()
        form.send_keys("z,z,qwertyuip")
        form.send_keys(Keys.RETURN)
        # Check that model has updated:
        assert "qwertyuip" in str(driver.execute_script("return model.links"))
        # Check that label has updated
        assert "z, z, qwertyuip" in driver.page_source

        #Reopen context menu from linklabel
        id = str(driver.execute_script("return model.links[0].id"))
        link = driver.find_element_by_css_selector("#linklabel" + id)
        webdriver.ActionChains(driver).context_click(link).perform()
        assert "'id': " + id in str(driver.execute_script("return model.links"))

        # Test 'Delete Link':
        deleteLink = driver.find_element_by_css_selector(".deletelink")
        deleteLink.click()
        # Check that link has been deleted
        assert "qwertyuip" not in str(driver.execute_script("return model.links"))
        assert "'id': " + id not in str(driver.execute_script("return model.links"))

        # Check that label has updated
        assert "z, z, qwertyuip" not in driver.page_source

    def tearDown(self):
        self.driver.close()


if __name__ == "__main__":
    unittest.main()