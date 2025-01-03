// Check if userId exists in localStorage, otherwise generate a new one
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = uuid.v4(); // Generate a random, unique UUID for each user
  localStorage.setItem('userId', userId); // Save to localStorage
}

const jsonEditor = document.getElementById('jsonEditor');
const audioFilesInput = document.getElementById('audioFiles');
const createArchiveButton = document.getElementById('createArchiveButton');
const updateVersionInput = document.getElementById('rpVersion');

// Placeholder JSON to display if no sound definitions are found
const defaultJson = {
  "format_version": "1.14.0",
  "sound_definitions": {
    "record.example": {
      "__use_legacy_max_distance": true,
      "category": "record",
      "max_distance": 10.0,
      "min_distance": null,
      "sounds": [
        {
          "name": "sounds/example",
          "stream": true,
          "volume": 0.5
        }
      ]
    }
  }
};

// Fetch existing JSON file for this user or load default JSON if not found
fetch(`http://portal.oshosting.co.uk:3000/sound_definitions/${userId}`)
  .then(response => response.json())
  .then(data => {
    jsonEditor.value = JSON.stringify(data, null, 2); // Populate JSON editor with existing data
  })
  .catch(error => {
    console.warn('Error fetching sound definitions, loading default:', error);
    jsonEditor.value = JSON.stringify(defaultJson, null, 2); // Load default JSON as fallback
  });

// Create and download archive with this user's data
createArchiveButton.addEventListener('click', async () => {
  try {
    console.log('Download button clicked');

    // Get updated data and validate version
    const updatedJson = document.getElementById('jsonEditor').value;
    const versionInput = updateVersionInput.value;
    if (!/^\d+\.\d+\.\d+$/.test(versionInput)) {
      alert("Invalid version format. Use 'x.y.z' (e.g., 1.0.0)");
      return;
    }

    // Step 1: Save version to backend
    const versionResponse = await fetch(`http://portal.oshosting.co.uk:3000/update_version/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: versionInput }),
    });
    if (!versionResponse.ok) throw new Error('Version save failed');

    // Step 2: Save JSON to backend
    const jsonResponse = await fetch(`http://portal.oshosting.co.uk:3000/update_json/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: updatedJson,
    });
    if (!jsonResponse.ok) throw new Error('JSON save failed');

    // Step 3: Upload audio files
    const formData = new FormData();
    Array.from(audioFilesInput.files).forEach(file => formData.append('audioFiles', file));

    const audioResponse = await fetch(`http://portal.oshosting.co.uk:3000/upload_audio/${userId}`, {
      method: 'POST',
      body: formData,
    });
    if (!audioResponse.ok) throw new Error('Audio upload failed');

    // Step 4: Create and download archive
    const archiveResponse = await fetch(`http://portal.oshosting.co.uk:3000/create_archive/${userId}`, {
      method: 'GET',
    });
    if (!archiveResponse.ok) throw new Error('Archive creation failed');

    const blob = await archiveResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'BlockBeats_RP.zip');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    // Step 5: Cleanup user data
    const cleanupResponse = await fetch(`http://portal.oshosting.co.uk:3000/cleanup/${userId}`, {
      method: 'GET',
    });
    if (!cleanupResponse.ok) throw new Error('Cleanup failed');

    console.log('Process completed successfully!');
  } catch (error) {
    console.error('Error during the process:', error);
    alert(`Error: ${error.message}`);
  }
});
