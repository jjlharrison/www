const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

const peers = new Map();
let pendingConnection = null;
let isOfferer = false;

const localSignalEl = document.getElementById('localSignal');
const remoteSignalEl = document.getElementById('remoteSignal');
const connectionStatusEl = document.getElementById('connectionStatus');
const messagesEl = document.getElementById('messages');
const messageInputEl = document.getElementById('messageInput');

function updateConnectionStatus() {
    const connectedCount = Array.from(peers.values()).filter(p =>
        p.channel && p.channel.readyState === 'open'
    ).length;

    if (connectedCount > 0) {
        connectionStatusEl.textContent = `Connected to ${connectedCount} peer(s)`;
        connectionStatusEl.className = 'connected';
    } else {
        connectionStatusEl.textContent = 'Not connected';
        connectionStatusEl.className = '';
    }
}

function createPeerConnection() {
    const pc = new RTCPeerConnection(config);
    const peerId = crypto.randomUUID().slice(0, 8);

    const peerData = {
        id: peerId,
        pc: pc,
        channel: null,
        iceCandidates: []
    };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            peerData.iceCandidates.push(event.candidate);
        } else {
            // ICE gathering complete, update the signal
            const signal = {
                type: isOfferer ? 'offer' : 'answer',
                sdp: pc.localDescription,
                candidates: peerData.iceCandidates,
                peerId: peerId
            };
            localSignalEl.value = btoa(JSON.stringify(signal));
        }
    };

    pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        updateConnectionStatus();

        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            peers.delete(peerId);
            updateConnectionStatus();
        }
    };

    pc.ondatachannel = (event) => {
        peerData.channel = event.channel;
        setupChannel(peerData);
    };

    peers.set(peerId, peerData);
    return peerData;
}

function setupChannel(peerData) {
    const channel = peerData.channel;

    channel.onopen = () => {
        console.log('Channel open with peer:', peerData.id);
        updateConnectionStatus();
        pendingConnection = null;
        localSignalEl.value = '';
        remoteSignalEl.value = '';
    };

    channel.onclose = () => {
        console.log('Channel closed with peer:', peerData.id);
        updateConnectionStatus();
    };

    channel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        appendMessage(data.text, 'remote', data.from);
    };
}

function appendMessage(text, type, peerId = 'You') {
    const msgEl = document.createElement('div');
    msgEl.className = `message ${type}`;

    const peerIdEl = document.createElement('span');
    peerIdEl.className = 'peer-id';
    peerIdEl.textContent = peerId;

    const textEl = document.createElement('span');
    textEl.textContent = text;

    msgEl.appendChild(peerIdEl);
    msgEl.appendChild(textEl);
    messagesEl.appendChild(msgEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Create offer (initiator)
document.getElementById('createOffer').addEventListener('click', async () => {
    isOfferer = true;
    const peerData = createPeerConnection();
    pendingConnection = peerData;

    // Create data channel
    peerData.channel = peerData.pc.createDataChannel('chat');
    setupChannel(peerData);

    const offer = await peerData.pc.createOffer();
    await peerData.pc.setLocalDescription(offer);

    localSignalEl.value = 'Gathering ICE candidates...';
});

// Create answer (joiner)
document.getElementById('createAnswer').addEventListener('click', async () => {
    const signalStr = remoteSignalEl.value.trim();
    if (!signalStr) {
        alert('Please paste the offer signal first');
        return;
    }

    try {
        isOfferer = false;
        const signal = JSON.parse(atob(signalStr));

        if (signal.type !== 'offer') {
            alert('Please paste an offer signal, not an answer');
            return;
        }

        const peerData = createPeerConnection();
        pendingConnection = peerData;

        await peerData.pc.setRemoteDescription(signal.sdp);

        // Add ICE candidates from offer
        for (const candidate of signal.candidates) {
            await peerData.pc.addIceCandidate(candidate);
        }

        const answer = await peerData.pc.createAnswer();
        await peerData.pc.setLocalDescription(answer);

        localSignalEl.value = 'Gathering ICE candidates...';
    } catch (e) {
        console.error(e);
        alert('Invalid signal format');
    }
});

// Accept answer signal (for offerer)
document.getElementById('acceptSignal').addEventListener('click', async () => {
    const signalStr = remoteSignalEl.value.trim();
    if (!signalStr) {
        alert('Please paste the answer signal');
        return;
    }

    if (!pendingConnection) {
        alert('No pending connection. Create an offer first.');
        return;
    }

    try {
        const signal = JSON.parse(atob(signalStr));

        if (signal.type !== 'answer') {
            alert('Please paste an answer signal');
            return;
        }

        await pendingConnection.pc.setRemoteDescription(signal.sdp);

        // Add ICE candidates from answer
        for (const candidate of signal.candidates) {
            await pendingConnection.pc.addIceCandidate(candidate);
        }
    } catch (e) {
        console.error(e);
        alert('Invalid signal format');
    }
});

// Copy signal to clipboard
document.getElementById('copySignal').addEventListener('click', () => {
    localSignalEl.select();
    navigator.clipboard.writeText(localSignalEl.value);
});

// Send message
function sendMessage() {
    const text = messageInputEl.value.trim();
    if (!text) return;

    let sent = false;
    peers.forEach((peerData) => {
        if (peerData.channel && peerData.channel.readyState === 'open') {
            peerData.channel.send(JSON.stringify({
                text: text,
                from: 'Peer'
            }));
            sent = true;
        }
    });

    if (sent) {
        appendMessage(text, 'local');
        messageInputEl.value = '';
    } else {
        alert('Not connected to any peers');
    }
}

document.getElementById('sendMessage').addEventListener('click', sendMessage);
messageInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
