# Collaborative reading

Open a book, choose **Read together** (☷), and create a room. Copy the
32-character invite code to another reader. They import the same book, open
**Read together**, enter the code and choose **Join room**. HTTPS or localhost
is required. Each participant can connect to eight other readers.

The room lists each reader's current chapter and progress. Choose a reader to
jump to their position; incoming updates otherwise leave your own reading
position alone. Select **Select text and comment** to open the floating editor,
select text in the book, and add a comment. Remote selections and commented text
are highlighted in browsers supporting CSS Custom Highlights. Comment badges
and the room's comment list also work without that API.

Comments are plain text (up to 2,000 characters), anchored to a chapter and up to
4,000 selected UTF-16 characters. They survive chapter changes and are stored in
this browser per room and book, up to 500 comments. Rejoining the same room loads
them and shares them with connected readers. Book fingerprints prevent applying
updates from a different edition or book. Different chapter splitting or text
requires importing the same version. Books and image files are never sent.

**Leave room** or return to the library to stop sharing. After a reload, open the
book and rejoin with the same code. Clearing site data removes local comments.
There is no central archive, account, moderation service, or room owner. Everyone
with the invite code can participate; share it privately and use a new room code
when the membership changes.

## Network and privacy

The implementation uses browser WebRTC data channels and no application backend,
framework, build-time dependency, or remotely loaded JavaScript. It uses the
public EMQX MQTT-over-WebSocket broker (`wss://broker.emqx.io:8084/mqtt`) for
signaling and Google's public STUN service to discover a direct route. Service
availability is outside this project's control. Collaboration needs internet;
the reader and locally saved comments remain available offline.

The broker topic is the SHA-256 hash of a cryptographically random 128-bit invite
code. Signaling is encrypted with AES-GCM using that code and a fresh 96-bit IV
for each message, so the topic does not disclose the encryption key. SDP and ICE
travel through signaling; reading positions, selections and comments travel only
over WebRTC's encrypted data channels. Peers learn each other's network addresses;
the broker and STUN service see connecting IP addresses. Possession of the invite
code grants membership, rather than a verified personal identity.

The signaling connection retries with exponential backoff (1–30 seconds) and a
heartbeat timeout. Peers announce presence every five seconds and recreate
failed or stalled RTC connections. A healthy RTC connection survives a signaling
outage. Reconnecting peers exchange current positions and retained comments;
duplicate comment IDs are ignored. Comment sends queue during channel
backpressure; positions and selections are transient updates.

There is no TURN relay or promised connection through restrictive NAT/firewalls.
Networks or browser policies blocking WebRTC UDP may prevent a connection even
when signaling works. In that case the UI continues retrying; readers can leave
the room and use the reader independently.

## Validation

`npm test` runs the existing tests plus collaboration protocol, encryption,
validation, peer lifecycle, relay retry and backpressure tests.

`npm run test:e2e` includes a UI test using a mocked transport, and a two-device
test using isolated browser contexts and real WebRTC data channels. Only public
signaling and STUN are replaced in the latter test: an in-process signaling bus
and local ICE candidates keep it independent of third-party uptime. That test
requires a browser environment permitting local WebRTC UDP. The managed task
environment's Chromium policy disables non-proxied UDP, so real RTC negotiation
cannot complete there. The UI test and existing reader/offline regressions can
run with that policy in place.
