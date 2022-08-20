// cookie clear
const form = document.getElementById("formData");
const go = document.getElementById("clearCookies");
const input = document.getElementById("url");
const message = document.getElementById("msg");

// color picker
const btn = document.querySelector('.pickColor');
const colorGrid = document.querySelector('.colorGrid');
const colorValue = document.querySelector('.colorValue');

(async function initPopupWindow() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url) {
    try {
      let url = new URL(tab.url);
      input.value = url.hostname;
    } catch {}
  }

  input.focus();
})();

form.addEventListener("submit", handleFormSubmit);

async function handleFormSubmit(event) {
  event.preventDefault();

  clearMessage();

  let url = stringToUrl(input.value);
  if (!url) {
    setMessage("Invalid URL");
    return;
  }

  let message = await deleteDomainCookies(url.hostname);
  setMessage(message);
}

function stringToUrl(input) {
  
  try {
    return new URL(input);
  } catch {}
  
  try {
    return new URL("http://" + input);
  } catch {}
  
  return null;
}

async function deleteDomainCookies(domain) {
  let cookiesDeleted = 0;

  try {
    const cookies = await chrome.cookies.getAll({ domain });

    if (cookies.length === 0) {
      return "No cookies found !!";
    }

    let pending = cookies.map(deleteCookie);
    await Promise.all(pending);

    cookiesDeleted = pending.length;
  } catch (error) {
    return `Unexpected cookie error: ${error.message}`;
  }

  return `Cookies Deleted ${cookiesDeleted} cookie(s).` ;
}

function deleteCookie(cookie) {

  const protocol = cookie.secure ? "https:" : "http:";

  const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;

  return chrome.cookies.remove({
    url: cookieUrl,
    name: cookie.name,
    storeId: cookie.storeId,
  });
}

function setMessage(str) {
  message.textContent = str;
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = "";
}

btn.addEventListener('click', async () => {
    
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
      {
          target: { tabId: tab.id },
          function: pickColor,
      },
      async (injectionResults) => {
          const [data] = injectionResults;
          if (data.result) {
              const color = data.result.sRGBHex;
              colorGrid.style.backgroundColor = color;
              colorValue.innerText = color;
              try {
                  await navigator.clipboard.writeText(color);
              } catch (err) {
                  console.error(err);
              }
          }
      }
  );
});

async function pickColor() {
  try {
      // Picker
      const eyeDropper = new EyeDropper();
      return await eyeDropper.open();
  } catch (err) {
      console.error(err);
  }
}