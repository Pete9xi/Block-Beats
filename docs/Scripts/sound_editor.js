// Ensure elements are properly referenced
const audioFilesInput = document.getElementById('audioFiles');
const createArchiveButton = document.getElementById('createArchiveButton');
const generateJsonButton = document.getElementById('generateJsonButton');
const updateVersionInput = document.getElementById('rpVersion');
const loadingElement = document.getElementById('loading');

// Check if userId exists in localStorage, otherwise generate a new one
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = uuid.v4(); // Generate a random, unique UUID for each user
  localStorage.setItem('userId', userId);
}

// Load Monaco Editor
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });

require(['vs/editor/editor.main'], function () {
  window.jsonEditor = monaco.editor.create(document.getElementById('jsonEditor'), {
    value: "{\n\t\"format_version\": \"1.14.0\",\n\t\"sound_definitions\": {}\n}",
    language: 'json',
    theme: 'vs-dark',
    automaticLayout: true
  });
});

// Function to update the Monaco Editor content
function updateJsonEditor(content) {
  window.jsonEditor.setValue(JSON.stringify(content, null, 2));
}

// Function to generate JSON dynamically
function generateJson() {
  console.log('Generating JSON preview...');
  
  const newJson = {
    "format_version": "1.14.0",
    "sound_definitions": {}
  };

  Array.from(audioFilesInput.files).forEach(file => {
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    newJson.sound_definitions[`record.${fileNameWithoutExt}`] = {
      "__use_legacy_max_distance": true,
      "category": "record",
      "max_distance": 10.0,
      "min_distance": null,
      "sounds": [
        {
          "name": `sounds/${fileNameWithoutExt}`,
          "stream": true,
          "volume": 0.5
        }
      ]
    };
  });

  updateJsonEditor(newJson);
}

generateJsonButton.addEventListener('click', generateJson);

createArchiveButton.addEventListener('click', async () => {
  try {
    loadingElement.style.display = 'block'; // Show loading animation

    if (!updateVersionInput) {
      console.error("Error: Element with id 'rpVersion' not found.");
      return;
    }

    const versionInput = updateVersionInput.value;
    if (!/^\d+\.\d+\.\d+$/.test(versionInput)) {
      alert("Invalid version format. Use 'x.y.z' (e.g., 1.0.0)");
      return;
    }

    const updatedJson = window.jsonEditor.getValue();

    await fetch(`https://osh01.oshosting.co.uk:3000/update_version/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: versionInput }),
    });

    await fetch(`https://osh01.oshosting.co.uk:3000/update_json/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: updatedJson,
    });

    const formData = new FormData();
    Array.from(audioFilesInput.files).forEach(file => formData.append('audioFiles', file));

    await fetch(`https://osh01.oshosting.co.uk:3000/upload_audio/${userId}`, {
      method: 'POST',
      body: formData,
    });

    const archiveResponse = await fetch(`https://osh01.oshosting.co.uk:3000/create_archive/${userId}`);
    const blob = await archiveResponse.blob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'BlockBeats_RP.mcpack');
    document.body.appendChild(link);
    link.click();
    link.remove();

    await fetch(`https://osh01.oshosting.co.uk:3000/cleanup/${userId}`);
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    loadingElement.style.display = 'none'; // Hide loading animation
  }
});
