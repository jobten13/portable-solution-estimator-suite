// Version Control System
// Loads version from version.json and updates the element with id="version-info"

const VERSION_FILE = 'version.json';
let currentVersion = '1.0.0';

async function loadVersion() {
    try {
        const response = await fetch(VERSION_FILE);
        if (response.ok) {
            const data = await response.json();
            currentVersion = data.version;
            updateVersionDisplay();
            return data;
        }
    } catch (e) {
        console.log('Version file not found, using default');
    }
    return null;
}

function updateVersionDisplay() {
    const el = document.getElementById('version-info');
    if (el) el.textContent = 'Version ' + currentVersion;
}

document.addEventListener('DOMContentLoaded', loadVersion);
