let currentMood = null;
let stream = null;
let modelsLoaded = false;

const manualModeBtn = document.getElementById("manualModeBtn");
const cameraModeBtn = document.getElementById("cameraModeBtn");

const manualMode = document.getElementById("manualMode");
const cameraMode = document.getElementById("cameraMode");

const startCameraBtn = document.getElementById("startCameraBtn");
const detectBtn = document.getElementById("detectBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");

const video = document.getElementById("video");
const cameraStatus = document.getElementById("cameraStatus");

const detectedEmotion = document.getElementById("detectedEmotion");
const emotionEmoji = document.getElementById("emotionEmoji");
const emotionText = document.getElementById("emotionText");

const songGrid = document.getElementById("songGrid");
const favoritesGrid = document.getElementById("favoritesGrid");

const recommendationTitle =
    document.getElementById("recommendationTitle");

const recommendationSubtitle =
    document.getElementById("recommendationSubtitle");


/* =========================
   MANUAL MODE
========================= */

manualModeBtn.addEventListener("click", () => {

    manualModeBtn.classList.add("active");
    cameraModeBtn.classList.remove("active");

    manualMode.classList.remove("hidden");
    cameraMode.classList.add("hidden");

    stopCamera();
});


/* =========================
   CAMERA MODE
========================= */

cameraModeBtn.addEventListener("click", () => {

    cameraModeBtn.classList.add("active");
    manualModeBtn.classList.remove("active");

    cameraMode.classList.remove("hidden");
    manualMode.classList.add("hidden");
});


/* =========================
   MANUAL MOOD SELECTION
========================= */

document.querySelectorAll(".mood-card").forEach(card => {

    card.addEventListener("click", () => {

        document.querySelectorAll(".mood-card")
            .forEach(item => item.classList.remove("selected"));

        card.classList.add("selected");

        const mood = card.dataset.mood;

        setMood(mood);
    });
});


/* =========================
   SET MOOD
========================= */

function setMood(mood) {

    currentMood = mood;

    showRecommendations(mood);

    document.getElementById("recommendations")
        .scrollIntoView({
            behavior: "smooth"
        });
}


/* =========================
   RECOMMENDATIONS
========================= */

function showRecommendations(mood) {

    const moodSongs = songs[mood] || [];

    const moodName =
        mood.charAt(0).toUpperCase() + mood.slice(1);

    recommendationTitle.textContent =
        `${moodName} Music`;

    recommendationSubtitle.textContent =
        `Music recommendations for your ${moodName.toLowerCase()} mood.`;

    songGrid.innerHTML = "";

    if (moodSongs.length === 0) {

        songGrid.innerHTML = `
            <div class="empty-state">
                <span>🎵</span>
                <h3>No songs found</h3>
                <p>Try another mood.</p>
            </div>
        `;

        return;
    }

    moodSongs.forEach(song => {

        const card = createSongCard(song);

        songGrid.appendChild(card);
    });
}


/* =========================
   SONG CARD
========================= */

function createSongCard(song) {

    const card = document.createElement("div");

    card.className = "song-card";

    const isFavorite =
        getFavorites().some(
            item => item.title === song.title
        );

    card.innerHTML = `

        <div class="song-art">
            ${song.emoji}
        </div>

        <div class="song-info">

            <div>
                <div class="song-title">
                    ${song.title}
                </div>

                <div class="song-artist">
                    ${song.artist}
                </div>

                <div class="song-meta">
                    ${song.genre} • ${song.duration}
                </div>
            </div>

        </div>

        <div class="song-actions">

            <button
                class="play-btn">
                ▶ Play
            </button>

            <button
                class="favorite-btn ${isFavorite ? "active" : ""}">
                ${isFavorite ? "❤️" : "♡"}
            </button>

        </div>
    `;


    /* PLAY */

    const playBtn =
        card.querySelector(".play-btn");

    playBtn.addEventListener("click", () => {

        window.open(
            song.url,
            "_blank"
        );

    });


    /* FAVORITE */

    const favoriteBtn =
        card.querySelector(".favorite-btn");

    favoriteBtn.addEventListener("click", () => {

        toggleFavorite(song);

        favoriteBtn.classList.toggle("active");

        favoriteBtn.textContent =
            favoriteBtn.classList.contains("active")
                ? "❤️"
                : "♡";

        renderFavorites();
    });


    return card;
}


/* =========================
   FAVORITES
========================= */

function getFavorites() {

    return JSON.parse(
        localStorage.getItem("moodsyncFavorites")
    ) || [];
}


function toggleFavorite(song) {

    let favorites = getFavorites();

    const existingIndex =
        favorites.findIndex(
            item => item.title === song.title
        );

    if (existingIndex >= 0) {

        favorites.splice(existingIndex, 1);

    } else {

        favorites.push(song);
    }

    localStorage.setItem(
        "moodsyncFavorites",
        JSON.stringify(favorites)
    );
}


function renderFavorites() {

    const favorites = getFavorites();

    favoritesGrid.innerHTML = "";

    if (favorites.length === 0) {

        favoritesGrid.innerHTML = `
            <div class="empty-state">
                <span>❤️</span>
                <h3>No favorites yet</h3>
                <p>
                    Click the heart on a song to add it here.
                </p>
            </div>
        `;

        return;
    }

    favorites.forEach(song => {

        favoritesGrid.appendChild(
            createSongCard(song)
        );

    });
}


/* =========================
   LOAD FACE API MODELS
========================= */

async function loadModels() {

    if (modelsLoaded) {
        return;
    }

    cameraStatus.textContent =
        "Loading emotion detection model...";

    try {

        await Promise.all([

            faceapi.nets.tinyFaceDetector.loadFromUri(
                "./models"
            ),

            faceapi.nets.faceExpressionNet.loadFromUri(
                "./models"
            )

        ]);

        modelsLoaded = true;

        cameraStatus.textContent =
            "Emotion detection model loaded.";

    } catch (error) {

        console.error(error);

        cameraStatus.textContent =
            "Unable to load emotion detection model.";

    }
}


/* =========================
   START CAMERA
========================= */

startCameraBtn.addEventListener(
    "click",
    async () => {

        try {

            await loadModels();

            if (!modelsLoaded) {
                return;
            }

            stream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });

            video.srcObject = stream;

            startCameraBtn.disabled = true;
            detectBtn.disabled = false;
            stopCameraBtn.disabled = false;

            cameraStatus.textContent =
                "Camera started. Position your face inside the frame.";

        } catch (error) {

            console.error(error);

            cameraStatus.textContent =
                "Camera permission was denied or camera is unavailable.";

        }
    }
);


/* =========================
   DETECT EMOTION
========================= */

detectBtn.addEventListener(
    "click",
    async () => {

        if (!stream) {
            return;
        }

        cameraStatus.textContent =
            "Detecting emotion...";

        try {

            const detection =
                await faceapi
                    .detectSingleFace(
                        video,
                        new faceapi.TinyFaceDetectorOptions()
                    )
                    .withFaceExpressions();

            if (!detection) {

                cameraStatus.textContent =
                    "No face detected. Please look at the camera.";

                return;
            }

            const expressions =
                detection.expressions;

            const emotion =
                getHighestExpression(expressions);

            const mood =
                mapEmotionToMood(emotion);

            showDetectedEmotion(
                emotion,
                mood
            );

            setMood(mood);

            cameraStatus.textContent =
                "Emotion detected successfully.";

        } catch (error) {

            console.error(error);

            cameraStatus.textContent =
                "Unable to detect emotion.";

        }
    }
);


/* =========================
   GET HIGHEST EMOTION
========================= */

function getHighestExpression(expressions) {

    let highestEmotion = "neutral";
    let highestValue = 0;

    Object.entries(expressions).forEach(
        ([emotion, value]) => {

            if (value > highestValue) {

                highestValue = value;
                highestEmotion = emotion;

            }

        }
    );

    return highestEmotion;
}


/* =========================
   MAP FACE EMOTION TO MOOD
========================= */

function mapEmotionToMood(emotion) {

    const mapping = {

        happy: "happy",

        sad: "sad",

        angry: "angry",

        fearful: "calm",

        disgusted: "angry",

        surprised: "energetic",

        neutral: "calm"

    };

    return mapping[emotion] || "calm";
}


/* =========================
   SHOW DETECTED EMOTION
========================= */

function showDetectedEmotion(
    emotion,
    mood
) {

    const emojiMap = {

        happy: "😊",

        sad: "😢",

        angry: "😡",

        fearful: "😨",

        disgusted: "🤢",

        surprised: "😲",

        neutral: "😌"

    };

    emotionEmoji.textContent =
        emojiMap[emotion] || "😌";

    emotionText.textContent =
        mood.charAt(0).toUpperCase() +
        mood.slice(1);

    detectedEmotion.classList.remove(
        "hidden"
    );
}


/* =========================
   STOP CAMERA
========================= */

stopCameraBtn.addEventListener(
    "click",
    stopCamera
);


function stopCamera() {

    if (stream) {

        stream.getTracks().forEach(
            track => track.stop()
        );

        stream = null;
    }

    video.srcObject = null;

    startCameraBtn.disabled = false;
    detectBtn.disabled = true;
    stopCameraBtn.disabled = true;

    cameraStatus.textContent =
        "Camera is not started.";

    detectedEmotion.classList.add(
        "hidden"
    );
}


/* =========================
   INITIALIZE
========================= */

renderFavorites();