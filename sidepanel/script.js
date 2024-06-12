// Right click to snip
// Or drag an image
// Or just save this link
// (https://some-link.com)

let auth;
let selectedChannels = new Set();

document.getElementById('page-link').innerText = window.location.href.slice(0, 30)

document.addEventListener('DOMContentLoaded', async function () {
    chrome.runtime.sendMessage('requestScreenshot', (response) => {
        if (response) {
            console.log(response)
            document.getElementById('image-preview').src = response;
        } else {
            console.log('No screenshot available');
        }
    });

    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
        if (req.message === 'crop') {
            console.log(req)
            document.getElementById('image-preview').src = req.img;
        }
        return true;
    });
    auth = await chrome.storage.local.get('token') || null;
    console.log(auth)
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
        await handleSelectedChannels(selectedIds);
    });

    document.getElementById('search-submit').addEventListener('click', async () => {
        const query = document.getElementById('search-input').value;
        const channels = await searchChannels(query);
        await populateChannelsTable(channels);
    });

    document.getElementById('search-input').addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const query = event.target.value;
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

document.getElementById('image-null').ondragover = (ev) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
}

document.getElementById('image-null').ondrop = (ev) => {
    ev.preventDefault();
    const droppedImg = ev.dataTransfer.getData("text/plain");
    document.getElementById('image-preview').src = droppedImg;
}

document.getElementById('search-input').addEventListener('input', function () {
    document.getElementById('search-submit').disabled = !this.value;
});

async function getLocalToken(code) {
    const res = await fetch('http://localhost:3000/auth', {
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

async function handleSelectedChannels(channels) {
    try {
        channels.forEach(async (channelId) => {
            const response = await fetch(`https://api.are.na/v2/channels/${channelId}/blocks`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`
                },
                body: JSON.stringify({
                    "title": document.title,
                    "source": document.getElementById('image-preview').src
                })
            });
            console.log(response)
        }
        )

    } catch (err) {
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
    });
})


