// Listen for omnibox input
chrome.omnibox.onInputEntered.addListener(async (text) => {
  chrome.storage.local.get("myQuickLinks", (result) => {
    try {
      const myQuickLinks = result.myQuickLinks || {};

      if (myQuickLinks[text]) {
        // Redirect to mapped URL
        chrome.tabs.update({ url: myQuickLinks[text] });
      } else {
        // Redirect to manage page to add new shortcut
        chrome.tabs.update({ url: chrome.runtime.getURL(`manage.html?key=${text}`) });
      }
    } catch(error){
      console.error("myQuickLinks Extension Error: ", error)
    }
  });
});
// Change omnibox suggestion text based on matching keywords from storage
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  chrome.storage.local.get("myQuickLinks", (result) => {
    const myQuickLinks = result.myQuickLinks || {};
    const input = text.trim().toLowerCase();

    // Find matching keys
    const suggestions = Object.keys(myQuickLinks)
      .filter(key => key.toLowerCase().includes(input))
      .map(key => ({
        content: key,
        description: `myQuicklink for: ${key} → ${myQuickLinks[key]}`
      }));

    // If no matches, show the raw input as a suggestion
    if (suggestions.length === 0 && input) {
      suggestions.push({
        content: input,
        description: `Create new myQuickLink for: ${input}`
      });
    }

    suggest(suggestions);
  });
});
