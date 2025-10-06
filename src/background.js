// Utility functions for storage model
async function getLinks() {
  try {
    // Try sync storage first
    const syncData = await chrome.storage.sync.get("myQuickLinks");
    if (syncData.myQuickLinks) {
      // Also update local storage to maintain backup
      await chrome.storage.local.set({ myQuickLinks: syncData.myQuickLinks });
      return syncData.myQuickLinks;
    }

    // If sync is empty, check local storage
    const localData = await chrome.storage.local.get("myQuickLinks");
    if (localData.myQuickLinks) {
      // If local has data but sync doesn't, restore to sync
      try {
        await chrome.storage.sync.set({ myQuickLinks: localData.myQuickLinks });
      } catch (error) {
        console.warn("Failed to restore sync from local:", error);
      }
    }
    return localData.myQuickLinks || {};
  } catch (error) {
    // If sync fails, use local
    console.warn("Sync storage failed, using local:", error);
    const localData = await chrome.storage.local.get("myQuickLinks");
    return localData.myQuickLinks || {};
  }
}

async function saveLinks(links) {
  // Always save to both storages for redundancy
  const savePromises = [
    chrome.storage.local.set({ myQuickLinks: links }),
    chrome.storage.sync.set({ myQuickLinks: links }).catch(error => {
      console.warn("Failed to save to sync storage:", error);
    })
  ];
  
  // Wait for both operations to complete
  await Promise.all(savePromises);
}

// Listen for omnibox input
chrome.omnibox.onInputEntered.addListener(async (text) => {
  try {
    const myQuickLinks = await getLinks();
    if (myQuickLinks[text]) {
      // Redirect to mapped URL
      chrome.tabs.update({ url: myQuickLinks[text] });
    } else {
      // Redirect to manage page to add new shortcut
      chrome.tabs.update({ url: chrome.runtime.getURL(`manage.html?key=${text}`) });
    }
  } catch(error) {
    console.error("myQuickLinks Extension Error: ", error);
  }
});

// Change omnibox suggestion text based on matching keywords from storage
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  try {
    const myQuickLinks = await getLinks();
    const input = text.trim().toLowerCase();

    // Find matching keys
    const suggestions = Object.keys(myQuickLinks)
      .filter(key => key.toLowerCase().includes(input))
      .map(key => ({
        content: key,
        description: `myQuickLink for: ${key} → ${myQuickLinks[key]}`
      }));

    // If no matches, show the raw input as a suggestion
    if (suggestions.length === 0 && input) {
      suggestions.push({
        content: input,
        description: `Create new myQuickLink for: ${input}`
      });
    }

    suggest(suggestions);
  } catch (error) {
    console.error("myQuickLinks Extension Error: ", error);
    suggest([]);
  }
});
