// ========== Firebase & Cloudinary Config ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ✅ Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyD8l_RlBvhTlBIqIajUxpqIoGOt2jg3ylY",
    authDomain: "usingfirebase-b4c6a.firebaseapp.com",
    projectId: "usingfirebase-b4c6a",
    storageBucket: "usingfirebase-b4c6a.firebasestorage.app",
    messagingSenderId: "678814978439",
    appId: "1:678814978439:web:be0ce0e40925c85fc7c322",
    measurementId: "G-MBNL06FWXS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========= Cloudinary Config =========
const cloudName = "dhjhpu2mh"; 
const uploadPreset = "demo_preset";
const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

// ========== DOM Elements ==========
const cameraContainer = document.getElementById('camera-container');
const previewContainer = document.getElementById('preview-container');
const cameraView = document.getElementById('camera-view');
const shutterButton = document.getElementById('shutter-button');
const flipCameraButton = document.getElementById('flip-camera');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const videoPreview = document.getElementById('video-preview');
const backToCameraButton = document.getElementById('back-to-camera');
const shareStoryButton = document.getElementById('share-story-btn');
// ... (other elements)
const flashCameraButton = document.getElementById('flash-camera');
const loadingOverlay = document.getElementById('loading-overlay'); // Make sure this is the last one in this block

// ... (DOM Elements declarations) ...

// ========== UI Functions ==========

/**
 * Displays a toast notification message.
 * @param {string} message The message to display.
 * @param {string} type The type of toast ('success' or 'error').
 */
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Add an icon for better UX
    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
    toast.innerHTML = `${icon} ${message}`;
    
    toastContainer.appendChild(toast);

    // Automatically remove the toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.5s forwards'; // Optional: add a slide-out animation
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

/**
 * Toggles the device's camera flash (torch).
 */
async function toggleFlash() {
    // Make sure we have a media stream to work with
    if (!mediaStream) return;

    const videoTrack = mediaStream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();

    // Check if the device and browser even support the torch feature
    if (!capabilities.torch) {
        showToast("Flash is not available on this device.", 'error');
        return;
    }

    try {
        isFlashOn = !isFlashOn; // Invert the current flash state
        await videoTrack.applyConstraints({
            advanced: [{ torch: isFlashOn }]
        });
        
        // Update the button's appearance
        flashCameraButton.classList.toggle('active', isFlashOn);

    } catch (err) {
        console.error("Error controlling flash:", err);
        showToast("Could not control the flash.", 'error');
    }
}


// ========== State Management - Camera Recording ==========
let mediaStream;
let mediaRecorder;
let recordedChunks = [];
let capturedMediaBlob = null;
let facingMode = "user"; // 'user' for front, 'environment' for back camera
// ... (other variables)
let isFlashOn = false; // Add this line

// ========== Core Functions ==========

/**
 * Initializes and starts the camera stream
 */
async function startCamera() {
    try {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: true,
        });
        cameraView.srcObject = mediaStream;
    } catch (err) {
        console.error("Camera access denied:", err);
        // alert("Could not access the camera. Please check permissions.");
        showToast("Camera access denied. Check permissions.", 'error');
    }
}

/**
 * Captures a single photo from the video stream
 */
function takePhoto() {
    console.log("Taking photo...");
    const canvas = document.createElement('canvas');
    canvas.width = cameraView.videoWidth;
    canvas.height = cameraView.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraView, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(blob => {
        capturedMediaBlob = blob;
        showPreview(blob, 'image');
    }, 'image/jpeg');
}

/**
 * Starts recording a video
 */
function startRecording() {
    console.log("Starting recording...");
    shutterButton.classList.add('recording');
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        capturedMediaBlob = videoBlob;
        showPreview(videoBlob, 'video');
    };

    mediaRecorder.start();
}

/**
 * Stops the current video recording
 */
function stopRecording() {
    console.log("Stopping recording...");
    shutterButton.classList.remove('recording');
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

/**
 * Switches between camera and preview screens
 */
function showPreview(blob, type) {
    const url = URL.createObjectURL(blob);
    if (type === 'image') {
        imagePreview.src = url;
        imagePreview.style.display = 'block';
        videoPreview.style.display = 'none';
    } else {
        videoPreview.src = url;
        videoPreview.style.display = 'block';
        imagePreview.style.display = 'none';
    }
    cameraContainer.classList.add('hidden');
    previewContainer.classList.remove('hidden');
}

/**
 * Returns to the camera view from the preview
 */
function returnToCamera() {
    previewContainer.classList.add('hidden');
    cameraContainer.classList.remove('hidden');
    // Clean up blob URL to prevent memory leaks
    if (imagePreview.src) URL.revokeObjectURL(imagePreview.src);
    if (videoPreview.src) URL.revokeObjectURL(videoPreview.src);
    capturedMediaBlob = null;
}

/**
 * Uploads the captured media to Cloudinary and saves URL to Firebase
 */
async function publishStory() {
    if (!capturedMediaBlob) {
        // alert("No media to publish!");
        showToast("Nothing to publish!", 'error');
        return;
    }

    loadingOverlay.classList.remove('hidden');

    const formData = new FormData();
    formData.append('file', capturedMediaBlob);
    formData.append('upload_preset', uploadPreset);

    try {
        const res = await fetch(uploadUrl, { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.secure_url) {
            await saveToFirebase(data.secure_url, capturedMediaBlob.type);
            console.log("✅ Successfully published:", data.secure_url);
            // alert("Story published successfully!");
            showToast("Story published successfully!", 'success');
        } else {
            throw new Error('Upload to Cloudinary failed.');
        }
    } catch (err) {
        console.error("❌ Publish failed:", err);
        // alert("Failed to publish story. Please try again.");
        showToast("Failed to publish. Please try again.", 'error');
    } finally {
        loadingOverlay.classList.add('hidden');
        returnToCamera();
    }
}

/**
 * Saves the media URL to Firebase
 */
async function saveToFirebase(url, type) {
    try {
        await addDoc(collection(db, "stories"), {
            url,
            type,
            timestamp: new Date()
        });
        console.log("✅ Saved to Firebase:", url);
    } catch (e) {
        console.error("❌ Error saving to Firebase:", e);
    }
}


// ========== Event Listeners ==========
let pressTimer = null;
let isRecording = false;

// Shutter button (tap for photo, hold for video)
shutterButton.addEventListener('mousedown', () => {
    pressTimer = setTimeout(() => {
        isRecording = true;
        startRecording();
    }, 250); // Hold for 250ms to start recording
});

shutterButton.addEventListener('mouseup', () => {
    clearTimeout(pressTimer);
    if (isRecording) {
        stopRecording();
        isRecording = false;
    } else {
        takePhoto();
    }
});

// Touch events for mobile
shutterButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    pressTimer = setTimeout(() => {
        isRecording = true;
        startRecording();
    }, 250);
});

shutterButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    clearTimeout(pressTimer);
    if (isRecording) {
        stopRecording();
        isRecording = false;
    } else {
        takePhoto();
    }
});

// Flash button
flashCameraButton.addEventListener('click', toggleFlash);

// Flip camera
flipCameraButton.addEventListener('click', () => {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera();
});

// Gallery file selection
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        capturedMediaBlob = file;
        showPreview(file, file.type.startsWith('image/') ? 'image' : 'video');
    }
});

// Preview screen buttons
backToCameraButton.addEventListener('click', returnToCamera);
shareStoryButton.addEventListener('click', publishStory);

// ========== Initialize ==========
window.addEventListener('load', startCamera);
