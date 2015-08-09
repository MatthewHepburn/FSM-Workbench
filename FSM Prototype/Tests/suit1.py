# -*- coding: utf8 -*-

import unittest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait 
from selenium.webdriver.support import expected_conditions as EC



class checkTools(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Firefox()
        self.driver.implicitly_wait(10)

    def testTools(self):
        # NB - having the mouse over the browser window or moving the mouse 
        # while this test is running can cause it to fail as it
        # interferes with the drag/drop operation.

        driver = self.driver
        driver.get(os.path.join(testPath, "satisfy-list-2-vending-machine.html"))

        # Test 'nodetool':
        nodetool = driver.find_element_by_css_selector("#nodetool")
        assert "selected" not in nodetool.get_attribute("class")
        nodetool.click()
        assert "selected" in nodetool.get_attribute("class")
        nNodes = driver.execute_script("return model.nodes.length")
        driver.find_element_by_css_selector("#main-svg").click()
        assert nNodes + 1 == driver.execute_script("return model.nodes.length")
        driver.find_element_by_css_selector("#main-svg").click()
        assert nNodes + 2 == driver.execute_script("return model.nodes.length")

        # Test 'linetool'
        linetool = driver.find_element_by_css_selector("#linetool")
        assert "selected" not in linetool.get_attribute("class")
        linetool.click()
        assert "selected" in linetool.get_attribute("class")
        assert "selected" not in nodetool.get_attribute("class")
        nLinks = driver.execute_script("return model.links.length")
        node1id = driver.execute_script("return model.nodes[model.nodes.length - 1].id")
        node1 = driver.find_element_by_id(str(node1id))
        node1.click()
        assert nLinks + 1 == driver.execute_script("return model.links.length"), "Reflexive link not created"
        node2id = driver.execute_script("return model.nodes[model.nodes.length - 2].id")
        node2 = driver.find_element_by_id(str(node2id))
        webdriver.ActionChains(driver).drag_and_drop(node1, node2).perform()
        newID = "link" + str(driver.execute_script("return model.lastLinkID"))
        # Wait for the new link to be created:
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, newID)))
        node1.click()
        assert nLinks + 2 == driver.execute_script("return model.links.length"), "Link not created"
        webdriver.ActionChains(driver).drag_and_drop(node2, node1).perform()
        newID = "link" + str(driver.execute_script("return model.lastLinkID"))
        # Wait for the new link to be created:
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, newID)))
        assert nLinks + 3 == driver.execute_script("return model.links.length"), "Link not created"
        webdriver.ActionChains(driver).drag_and_drop(node2, node1).perform()
        assert nLinks + 3 == driver.execute_script("return model.links.length"), "Link should not have been created"

        # Test 'texttool'
        # First - test on nodes
        texttool = driver.find_element_by_css_selector("#texttool")
        assert "selected" not in texttool.get_attribute("class"), "Text tool should be selected"
        texttool.click()
        assert "selected" in texttool.get_attribute("class"), "Text tool should be selected"
        assert "selected" not in linetool.get_attribute("class"), "Line tool should have been deselected"
        node1.click()
        form = driver.find_element_by_css_selector(".renameinput")
        form.send_keys("тест") # This will probably take additional work to run in python 2.x but works in python 3.4
        form.send_keys(Keys.RETURN)
        assert "тест" == driver.execute_script("return query.getNodeData(" + str(node1id) + ").name"), "Rename did not modify model correctly"
        assert "тест" in driver.page_source, "Rename display unsuccessful for string 'тест'" 
        node1.click()
        form = driver.find_element_by_css_selector(".renameinput")
        form.clear()
        form.send_keys("اختبار") # This will probably take additional work to run in python 2.x but works in python 3.4
        form.send_keys(Keys.RETURN)
        assert "اختبا" == driver.execute_script("return query.getNodeData(" + str(node1id) + ").name"), "Rename did not modify model correctly - got " + driver.execute_script("return query.getNodeData(" + str(node1id) + ").name")
        assert "اختبا" in driver.page_source, "Rename display unsuccessful for string 'اختبا'"
        
        # Second - test on links:
        linkid = driver.execute_script("return model.links[model.links.length - 1].id")
        link = driver.find_element_by_id("link" + str(linkid))
        link.click()
        form = driver.find_element_by_css_selector(".renameinput")
        form.send_keys("ajgl, vzx, EPSILON")
        form.send_keys(Keys.RETURN)
        assert "ajgl, vzx, ε" in driver.page_source, "Link rename not displayed successfully"
        input = driver.execute_script("return query.getLinkData(" + str(linkid) +").input")
        assert "ajgl" == input[0], "Rename did not update model correctly"
        assert "vzx" == input[1], "Rename did not update model correctly"
        assert "ε" == input[2], "Rename did not update model correctly"

        # Test 'acceptingtool'
        acceptingtool = driver.find_element_by_css_selector("#acceptingtool")
        assert "selected" in texttool.get_attribute("class"), "Text tool should be selected"
        assert "selected" not in acceptingtool.get_attribute("class"), "Accepting tool should not be selected"
        acceptingtool.click()
        assert "selected" in acceptingtool.get_attribute("class"), "Accepting tool should be selected"
        assert "selected" not in texttool.get_attribute("class"), "Text tool should have been deselected"
        assert False == driver.execute_script("return query.getNodeData("+str(node1id)+").accepting")
        node1.click()
        assert True == driver.execute_script("return query.getNodeData("+str(node1id)+").accepting")
        node1.click()
        assert False == driver.execute_script("return query.getNodeData("+str(node1id)+").accepting")
        nNodes = driver.execute_script("return model.nodes.length")
        driver.find_element_by_css_selector("#main-svg").click()
        assert nNodes + 1 == driver.execute_script("return model.nodes.length")
        assert driver.execute_script("return model.nodes[model.nodes.length-1].accepting")

        # Test 'deletetool'
        deletetool = driver.find_element_by_css_selector("#deletetool")
        assert "selected" in acceptingtool.get_attribute("class"), "Accepting tool should be selected"
        assert "selected" not in deletetool.get_attribute("class"), "Delete tool should not be selected"
        deletetool.click()
        assert "selected" in deletetool.get_attribute("class"), "Delete tool should be selected"
        assert "selected" not in acceptingtool.get_attribute("class"), "Accepting tool should have been deselected"
        nNodes = driver.execute_script("return model.nodes.length")
        node2.click()
        assert nNodes - 1 == driver.execute_script("return model.nodes.length"), "Node count not changed by delete"
        nLinks = driver.execute_script("return model.links.length")
        node1.click()
        assert nLinks - 1 == driver.execute_script("return model.links.length"), "Link count not changed by delete"
        assert nNodes - 2 == driver.execute_script("return model.nodes.length"), "Node count not changed by delete"


    def tearDown(self):
        self.driver.quit()


class checkTitleProgression(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Firefox()

    def testTitleProgression(self):
        driver = self.driver
        driver.get(os.path.join(testPath, "index.html"))
        assert "Finite State Machines" in driver.title
        for i in range(1,10):
            next_link = driver.find_element_by_link_text('Next')
            next_link.click()
            assert str(i) in driver.title


    def tearDown(self):
        self.driver.quit()

class checkContextMenus(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Firefox()

    def testContextMenus(self):
        driver = self.driver
        driver.get(os.path.join(testPath, "satisfy-list-1.html"))
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
        self.driver.quit()


if __name__ == "__main__":
    testPath = "file://" + os.path.join(os.path.split(os.getcwd())[0], "Deploy")
    unittest.main()
