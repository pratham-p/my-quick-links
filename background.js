// chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
//   try {
//     const url = new URL(details.url);

//     if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname === "my") {
//       const path = url.pathname.replace("/", ""); // e.g. "google"

//       // Load dictionary from storage
//       const data = await chrome.storage.local.get("myLinks");
//       const myLinks = data.myLinks || {};

//       if (myLinks[path]) {
//         // Redirect to mapped URL
//         chrome.tabs.update(details.tabId, { url: myLinks[path] });
//       } else {
//         // Redirect to manage page to add mapping
//         chrome.tabs.update(details.tabId, { 
//           url: chrome.runtime.getURL(`manage.html?key=${path}`) 
//         });
//       }
//     }
//   } catch (err) {
//     console.error("Navigation check failed:", err);
//   }
// });

// Listen for omnibox input
chrome.omnibox.onInputEntered.addListener((text) => {
  chrome.storage.local.get("myLinks", (result) => {
    const myLinks = result.myLinks || {};
    if (myLinks[text]) {
      // Redirect to mapped URL
      chrome.tabs.update({ url: myLinks[text] });
    } else {
      // Redirect to manage page to add new shortcut
      chrome.tabs.update({ url: chrome.runtime.getURL(`manage.html?key=${text}`) });
    }
  });
});

// Optional: change omnibox suggestion text
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  suggest([{ content: text, description: `My link for: ${text}` }]);
});
