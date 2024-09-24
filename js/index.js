// Right click to snip
// Or drag an image
// Or just save this link
// (https://some-link.com)

let auth;
let selectedChannels = new Set();
let block;

document.addEventListener('DOMContentLoaded', async function () {

    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    document.getElementById('page-link').innerText = tab.url.slice(0, 30)
    block = { type: 'link', source: tab.url };

    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
        if (req.message === 'crop') {
            block = { type: 'image-crop', source: req.img };
            document.getElementById('image-preview').src = req.img;
        } else if (req.message === 'add') {
            console.log(req.target)
            handleAddEvent(req.target);
        }
        return true;
    });

    chrome.runtime.onMessage.addListener((message) => {
        if (message.url) {
            document.getElementById('page-link').innerText = message.url.slice(0, 30)
        }
    });

    auth = await chrome.storage.local.get('token') || null;
    document.getElementById('auth-container').style.display = !auth.token ? 'flex' : 'none';
    document.getElementById('snip-container').style.display = !auth.token ? 'none' : 'flex';

    await getUserDetails()
        .then(async (user) => {
            await getRecentChannels(user.id)
                .then((channels) => {
                    if (channels) populateChannelsTable(channels)
                })
        })
        .catch((err) => {
            const toast = document.getElementById('toast');
            toast.classList.toggle('error')
            toast.innerText = err;
            toast.style.display = 'block';
        })


    document.getElementById('save-button').addEventListener('click', async () => {
        const selectedIds = Array.from(selectedChannels);
        try {
            document.getElementById('save-button').textContent = 'Saving...';
            await handleSelectedChannels(selectedIds);
        } catch (err) {
            document.getElementById('save-button').textContent = 'Error saving';
            setTimeout(() => {
                document.getElementById('save-button').textContent = 'Save to channels';
            }, 2000);
        } finally {
            document.getElementById('save-button').textContent = 'Saved!';
            setTimeout(() => {
                document.getElementById('save-button').textContent = 'Save to channels';
            }, 2000);
        }
    });

    document.getElementById('search-submit').addEventListener('click', async () => {
        const query = document.getElementById('search-input').value;
        selectedChannels.clear();
        updateSaveButton();
        const channels = await searchChannels(query);
        await populateChannelsTable(channels);
    });

    document.getElementById('search-input').addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const query = event.target.value;
            selectedChannels.clear();
            updateSaveButton();
            const channels = await searchChannels(query);
            await populateChannelsTable(channels);
        }
    });

    updateSaveButton();
});

function updateSaveButton() {
    const saveButton = document.getElementById('save-button');
    saveButton.disabled = selectedChannels.size === 0;
    saveButton.textContent = selectedChannels.size === 0 ? 'Select a channel above' : `Save to ${selectedChannels.size} channels`;
}

document.getElementById('image-null').ondragover = handleDragEvent;

document.getElementById('image-null').ondrop = handleDropEvent;

document.getElementById('image-preview').ondragover = handleDragEvent

document.getElementById('image-preview').ondrop = handleDropEvent;

document.getElementById('search-input').addEventListener('input', function () {
    document.getElementById('search-submit').disabled = !this.value;
});

async function getLocalToken(code) {
    const res = await fetch('https://arena-mv3-auth.ovdixon.workers.dev/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: code })
    });
    const data = await res.json();
    return data.access_token;

}

async function getUserDetails() {
    try {
        const response = await fetch("https://api.are.na/v2/me", {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.token}`
            },
        });

        const data = await response.json();
        return data;
    } catch (err) {
        throw new Error('Fetching Are.na user profile.')
    }

}

async function getRecentChannels(userId) {
    try {
        const response = await fetch(`https://api.are.na/v2/users/${userId}/channels?per=5`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.token}`
            },
        });
        console.log(response.body)
        const data = await response.json();
        return data.channels;
    } catch (err) {
        throw new Error('Fetching recent channels.')
    }
}

async function searchChannels(query) {
    const response = await fetch(`https://api.are.na/v2/search/channels/?q=${query}&per=5`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`
        },
    });
    const data = await response.json();
    return data.channels;

}

async function populateChannelsTable(channels) {
    const channelsTable = document.getElementById('channels-table');
    channelsTable.innerHTML = '';
    channels.forEach(channel => {
        console.log(channel)
        const tr = document.createElement('tr');
        if (selectedChannels.has(channel.id)) tr.classList.add('selected');
        tr.dataset.channelId = channel.id;
        tr.innerHTML = `
          <td class="channel-name">${channel.user.full_name} / ${channel.title}</td>
          <td class="channel-status ${channel.status}">${channel.status}</td>
        `;
        tr.addEventListener('click', () => {
            tr.classList.toggle('selected');
            if (tr.classList.contains('selected')) {
                selectedChannels.add(channel.id)
            } else {
                selectedChannels.delete(channel.id)
            }
            updateSaveButton();
        });
        channelsTable.append(tr);

    });
}

async function getUploadUrl() {
    const response = await fetch('https://arena-mv3-auth.ovdixon.workers.dev/upload-url', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`
        },
    })
    const data = await response.json()
    const url = data.url;
    const key = data.filename;
    console.log(url, key)
    return { url, key };
}

async function getFetchUrl(key) {
    const response = await fetch(`https://arena-mv3-auth.ovdixon.workers.dev/fetch-url?file=${key}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`
        },
    })
    const data = await response.json()
    return data.url


}
async function handleDragEvent(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
};

async function handleAddEvent(target) {
    if (target.mediaType === 'image') {
        block = { type: 'image', source: target.srcUrl };
        document.getElementById('image-preview').src = target.srcUrl;
    } else if (target.linkUrl) {
        block = { type: 'link', source: target.linkUrl };
        document.getElementById('image-null').textContent = target.linkUrl;
    } else if (target.selectionText) {
        block = { type: 'text', source: target.selectionText };
        document.getElementById('image-null').textContent = target.selectionText;
    } else {
        block = { type: 'link', source: target.pageUrl };
        document.getElementById('image-null').textContent = target.pageUrl;
    }

}

async function handleDropEvent(ev) {
    ev.preventDefault();

    const data = ev.dataTransfer.items;
    for (let i = 0; i < data.length; i++) {
        if (data[i].kind === "file" && data[i].type.match("^image/")) {
            const f = data[i].getAsFile();
            const imgURL = URL.createObjectURL(f);
            document.getElementById("image-preview").src = imgURL;
            block = { type: 'image', source: imgURL };
            return;
        }
    }

    for (let i = 0; i < data.length; i++) {
        if (data[i].kind === "string" && data[i].type.match("^text/uri-list")) {
            data[i].getAsString((uriString) => {
                document.getElementById("image-null").textContent = uriString;
                block = { type: 'link', source: uriString };
            });
            return;
        }
    }

    for (let i = 0; i < data.length; i++) {
        if (data[i].kind === "string" && data[i].type.match("^text/plain")) {
            data[i].getAsString((textString) => {
                block = { type: 'text', source: textString };
                document.getElementById("image-null").textContent = textString;
            });
            return;
        }
    }


    console.log("Drop: Unknown");
}

document.getElementById('logout').addEventListener('click', async () => {
    chrome.storage.local.remove('token')
        .then(() => {
            document.getElementById('auth-container').style.display = 'flex';
            document.getElementById('snip-container').style.display = 'none';
        });
    return false;
})

// Utility function to strip HTML tags from a string
function stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

async function uploadFile(file, presignedUrl) {
    const blobResponse = await fetch(file);
    const blob = await blobResponse.blob();
    const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'image/png',
            'Content-Encoding': 'base64',
        },
        body: blob
    })
    return response;
}

async function handleSelectedChannels(channels) {
    let source = null
    let content = null
    try {
        if (block.type === 'image-crop') {
            const { url, key } = await getUploadUrl();
            await uploadFile(block.source, url);
            source = await getFetchUrl(key);
        } else if (block.type === 'link') {
            source = block.source
        } else {
            content = block.source
        }

        channels.forEach(async (channelId) => {
            const response = await fetch(`https://api.are.na/v2/channels/${channelId}/blocks`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`
                },
                body: JSON.stringify({
                    "source": source,
                    "content": content,
                    "title": document.getElementById('title-input').value,
                    "description": document.getElementById('description-input').value,

                })
            });
            console.log(response)
        }
        )

    } catch (err) {
        console.log(err)
        throw new Error('Saving to selected channels.')
    }
}


document.getElementById('login').addEventListener('click', async () => {
    const clientId = 'xGd8YeYsshg6UtisCIpJr3JT_ieOAADuJbACtluzhMw'
    const redirectUri = encodeURIComponent(chrome.identity.getRedirectURL());
    const authUrl = `https://dev.are.na/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
    }, async function (redirectUrl) {
        if (chrome.runtime.lastError || !redirectUrl) {
            console.error(chrome.runtime.lastError ? chrome.runtime.lastError.message : 'No redirect URL');
            return;
        }
        const url = new URL(redirectUrl);
        const code = url.searchParams.get('code');
        const token = await getLocalToken(code);
        if (token) chrome.storage.local.set({ token: token })
            .then(() => {
                document.getElementById('auth-container').style.display = 'none';
                document.getElementById('snip-container').style.display = 'flex';
            });
        return false;

    });
})


