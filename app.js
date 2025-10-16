// ========== Firebase Import ==========
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
const cloudName = "dhjhpu2mh"; // Replace with your cloud name
const uploadPreset = "demo_preset"; // Replace with your unsigned preset
const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

// ========= Helper: Save to Firebase =========
async function saveToFirebase(url, type) {
  try {
    await addDoc(collection(db, "uploads"), {
      url,
      type,
      timestamp: new Date()
    });
    console.log("✅ Saved to Firebase:", url);
  } catch (e) {
    console.error("❌ Error saving to Firebase:", e);
  }
}

// ========= File Upload =========
window.uploadFile = async function () {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return alert("Please choose a file!");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  document.getElementById("statusUpload").textContent = "Uploading...";

  try {
    const res = await fetch(uploadUrl, { method: "POST", body: formData });
    const data = await res.json();

    if (data.secure_url) {
      document.getElementById("statusUpload").textContent = "Upload complete!";
      const previewDiv = document.getElementById("previewUpload");

      if (file.type.startsWith("image/")) {
        previewDiv.innerHTML = `<img src="${data.secure_url}" width="400">`;
      } else if (file.type.startsWith("video/")) {
        previewDiv.innerHTML = `<video controls width="400">
          <source src="${data.secure_url}" type="${file.type}">
        </video>`;
      }
      previewDiv.innerHTML += `<p><a href="${data.secure_url}" target="_blank">${data.secure_url}</a></p>`;

      // 🔥 Save link to Firebase
      saveToFirebase(data.secure_url, file.type.startsWith("image/") ? "image" : "video");
    } else {
      document.getElementById("statusUpload").textContent = "Error: " + JSON.stringify(data);
    }
  } catch (err) {
    document.getElementById("statusUpload").textContent = "Upload failed!";
    console.error(err);
  }
};

// ========= Camera Recording =========
let mediaStream;
let mediaRecorder;
let recordedChunks = [];
let recordedBlob;

const camera = document.getElementById("camera");
const startCameraBtn = document.getElementById("startCamera");
const startRecordBtn = document.getElementById("startRecord");
const stopRecordBtn = document.getElementById("stopRecord");
const uploadBtn = document.getElementById("uploadBtn");

// Start Camera (selfie if available)
startCameraBtn.onclick = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: true
    });
    camera.srcObject = mediaStream;
    startRecordBtn.disabled = false;
  } catch (err) {
    alert("Camera access denied: " + err.message);
  }
};

// Start Recording
startRecordBtn.onclick = () => {
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(mediaStream, { mimeType: "video/webm" });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
    const videoURL = URL.createObjectURL(recordedBlob);

    document.getElementById("previewRecord").innerHTML = `
      <h4>Recorded Video:</h4>
      <video controls width="400" playsinline>
        <source src="${videoURL}" type="video/webm">
      </video>`;
    uploadBtn.disabled = false;
  };

  mediaRecorder.start();
  startRecordBtn.disabled = true;
  stopRecordBtn.disabled = false;
};

// Stop Recording
stopRecordBtn.onclick = () => {
  mediaRecorder.stop();
  stopRecordBtn.disabled = true;
  startRecordBtn.disabled = false;
};

// Upload Recording
window.uploadRecording = async function () {
  if (!recordedBlob) return alert("No video recorded!");

  const formData = new FormData();
  formData.append("file", recordedBlob, "recordedVideo.webm");
  formData.append("upload_preset", uploadPreset);

  document.getElementById("statusRecord").textContent = "Uploading...";

  try {
    const res = await fetch(uploadUrl, { method: "POST", body: formData });
    const data = await res.json();
    console.log("Upload response:", data);

    if (data.secure_url) {
      document.getElementById("statusRecord").textContent = "Upload complete!";
      document.getElementById("previewRecord").innerHTML += `
        <h4>Uploaded to Cloudinary:</h4>
        <video controls width="400" playsinline>
          <source src="${data.secure_url}" type="video/webm">
        </video>
        <p><a href="${data.secure_url}" target="_blank">${data.secure_url}</a></p>`;

      // 🔥 Save to Firebase
      saveToFirebase(data.secure_url, "video");
    } else {
      document.getElementById("statusRecord").textContent = "Error: " + JSON.stringify(data);
    }
  } catch (err) {
    document.getElementById("statusRecord").textContent = "Upload failed!";
    console.error(err);
  }
};
