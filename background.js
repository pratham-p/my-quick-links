// Listen for omnibox input
chrome.omnibox.onInputEntered.addListener(async (text) => {
  chrome.storage.local.get("myLinks", (result) => {
    try {
      const myLinks = result.myLinks || {};

      if (myLinks[text]) {
        // Redirect to mapped URL
        chrome.tabs.update({ url: myLinks[text] });
      } else {
        // Redirect to manage page to add new shortcut
        chrome.tabs.update({ url: chrome.runtime.getURL(`manage.html?key=${text}`) });
      }
    } catch(error){
      console.error("myLinks Extension Error: ", error)
    }
  });
});
// Change omnibox suggestion text based on matching keywords from storage
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  chrome.storage.local.get("myLinks", (result) => {
    const myLinks = result.myLinks || {};
    const input = text.trim().toLowerCase();

    // Find matching keys
    const suggestions = Object.keys(myLinks)
      .filter(key => key.toLowerCase().includes(input))
      .map(key => ({
        content: key,
        description: `mylink for: ${key} → ${myLinks[key]}`
      }));

    // If no matches, show the raw input as a suggestion
    if (suggestions.length === 0 && input) {
      suggestions.push({
        content: input,
        description: `Create new mylink for: ${input}`
      });
    }

    suggest(suggestions);
  });
});
