// ==========================================
// ELEMENT
// ==========================================

const rotateWheel = document.querySelector(".rotateWheel");
const startBtn = document.querySelector(".start");
const stopBtn = document.querySelector(".stop");
const questionElement = document.querySelector("#question");
const statusElement = document.querySelector("#status");
const answerElement = document.querySelector("#answer");
const correctAnswerElement = document.querySelector("#correct-answer");
const audioBenar = new Audio("assets/benar.mp3");
const audioSalah = new Audio("assets/salah.mp3");
const audioText = new Audio("assets/narasi_3.mp3");
const narationBtn = document.querySelector(".narationBtn");
const materiPembelajaranBtn = document.querySelector(".materiPembelajaranBtn");
const tujuanPembelajaranBtn = document.querySelector(".tujuanPembelajaranBtn");
const tujuanPembelajaran = document.querySelector(".tujuan-pembelajaran");
const caraPermainanBtn = document.querySelector(".caraPermainanBtn");
const caraPermainan = document.querySelector(".cara-permainan");
const tentangGimBtn = document.querySelector(".tentangGimBtn");
const tentangGim = document.querySelector(".tentang-gim");
const game = document.querySelector(".game");
const halamanMuka = document.querySelector(".halaman-muka");
const materiPembelajaran = document.querySelector(".materi-pembelajaran");
const backBtns = document.querySelectorAll(".backBtn");
const mulaiBtn = document.querySelector(".mulaiBtn");
const questionText = document.querySelector(".question-box h3");

// ==========================================
// Aktifkan audio naration
// ==========================================
let narrationPlaying = false;
narationBtn.addEventListener("click", () => {
  // Jika audio masih berjalan, jangan lakukan apa-apa
  if (narrationPlaying) {
    return;
  }

  if (recognitionActive) {
    return;
  }

  if (gameRunning) {
    return;
  }

  narrationPlaying = true;

  // Nonaktifkan tombol
  startBtn.disabled = true;
  stopBtn.disabled = true;

  // Optional: ubah cursor
  startBtn.style.cursor = "not-allowed";
  stopBtn.style.cursor = "not-allowed";

  audioText.currentTime = 0;
  audioText.volume = 1;

  audioText.play();

  statusElement.textContent = "🎧 Listen to the narration...";
  correctAnswerElement.textContent = "";
  answerElement.textContent = "";
  questionElement.textContent = "";
  questionText.style.display = "none";

  // ==========================================
  // AUDIO SELESAI
  // ==========================================

  audioText.onended = () => {
    narrationPlaying = false;

    // Aktifkan kembali tombol
    startBtn.disabled = false;
    stopBtn.disabled = false;

    startBtn.style.cursor = "pointer";
    stopBtn.style.cursor = "pointer";

    statusElement.textContent = "";
    questionElement.textContent = "Click START to play";
  };
});

// ==========================================
// ROTATION VARIABLES
// ==========================================

let angle = 0;
let speed = 0;
const maxSpeed = 20;
let animationFrame;
let accelerating = false;
let decelerating = false;
let gameRunning = false;

// ==========================================
// SPEECH RECOGNITION
// ==========================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let recognitionActive = false;
let answerFinished = false;
let thinkingTimer;
const thinkingTime = 20000; // 20 detik

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;
} else {
  alert("Your browser does not support Voice Recognition. Please use Google Chrome.");
}

// ==========================================
// ROTATE FUNCTION
// ==========================================

function rotate() {
  // ACCELERATING

  if (accelerating && speed < maxSpeed) {
    speed += 0.05;
  }

  // DECELERATING

  if (decelerating && speed > 0) {
    speed -= 0.05;

    if (speed <= 0) {
      speed = 0;
      decelerating = false;

      cancelAnimationFrame(animationFrame);

      // roda sudah berhenti

      wheelStopped();

      return;
    }
  }

  angle += speed;
  rotateWheel.style.transform = `rotate(${angle}deg)`;
  animationFrame = requestAnimationFrame(rotate);
}

// ==========================================
// START BUTTON
// ==========================================

const start = startBtn.addEventListener("click", () => {
  // Jangan izinkan START saat narasi berjalan
  if (narrationPlaying) {
    return;
  }

  // Jangan mulai jika masih berputar
  if (gameRunning) {
    return;
  }

  gameRunning = true;
  accelerating = true;
  decelerating = false;
  speed = 0;

  questionElement.textContent = "The wheel is spinning...";
  statusElement.textContent = "Click STOP and Answer the Question!";
  answerElement.textContent = "";
  correctAnswerElement.textContent = "";
  questionText.style.display = "none";

  rotate();
});

// // ==========================================
// // STOP BUTTON
// // ==========================================

stopBtn.addEventListener("click", () => {
  // Jangan izinkan STOP saat narasi berjalan
  if (narrationPlaying) {
    return;
  }

  if (!gameRunning) {
    return;
  }

  accelerating = false;
  decelerating = true;
});

// ==========================================
// WHEN WHEEL STOPS
// ==========================================

function wheelStopped() {
  gameRunning = false;

  // Ambil posisi sektor yang berada
  // di depan arrow
  const selectedIndex = getSelectedSector();
  const sectors = document.querySelectorAll(".sector");
  const selectedSector = sectors[selectedIndex];

  // Ambil pertanyaan
  const question = selectedSector.querySelector("span").textContent;

  // Ambil jawaban yang benar
  const correctAnswer = selectedSector.dataset.question;

  // Tampilkan pertanyaan
  questionElement.textContent = question;
  statusElement.textContent = "🎤 Listen... Speak your answer!";
  answerElement.textContent = "";
  questionText.style.display = "block";

  // Mulai Voice Recognition

  startVoiceRecognition(correctAnswer);
}

// ==========================================
// MENENTUKAN SEKTOR
// ==========================================

function getSelectedSector() {
  // Normalisasi sudut

  let normalizedAngle = angle % 360;
  if (normalizedAngle < 0) {
    normalizedAngle += 360;
  }

  /*
          Karena arrow berada di sebelah kanan
          wheel, posisi pointer = 0 derajat.

          Setiap sektor mempunyai lebar 30 derajat.

          Kita gunakan posisi tengah sektor
          agar pemilihan lebih stabil.
        */

  let index = Math.floor(((360 - normalizedAngle + 15) % 360) / 30);
  return index;
}

// ==========================================
// VOICE RECOGNITION
// ==========================================

function startVoiceRecognition(correctAnswer) {
  if (!recognition) {
    return;
  }

  recognitionActive = true;
  answerFinished = false;

  // Bersihkan timer sebelumnya
  clearTimeout(thinkingTimer);

  statusElement.textContent = "🎤 Listening... Take your time and speak your answer.";

  // ==========================================
  // BATAS WAKTU BERPIKIR
  // ==========================================

  thinkingTimer = setTimeout(() => {
    if (!answerFinished) {
      recognitionActive = false;
      answerFinished = true;

      try {
        recognition.stop();
      } catch (error) {
        console.log("Recognition already stopped.");
      }

      statusElement.textContent = "⏰ Time is up. You think too long!";

      console.log("Waktu menjawab habis.");
    }
  }, thinkingTime);

  // ==========================================
  // ON START
  // ==========================================

  recognition.onstart = () => {
    console.log("🎤 Recognition started.");

    statusElement.textContent = "🎤 Listening... Speak your answer.";
  };

  // ==========================================
  // ON RESULT
  // ==========================================

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1];

    if (!result.isFinal) {
      return;
    }

    const spokenText = result[0].transcript.trim();

    console.log("User said:", spokenText);

    if (!spokenText) {
      return;
    }

    // ==========================================
    // SISWA SUDAH MENJAWAB
    // ==========================================

    answerFinished = true;
    recognitionActive = false;

    // Hentikan timer
    clearTimeout(thinkingTimer);

    // Tampilkan jawaban
    answerElement.textContent = `You said: "${spokenText}"`;

    // Hentikan recognition
    try {
      recognition.stop();
    } catch (error) {
      console.log("Recognition already stopped.");
    }

    // Periksa jawaban
    checkAnswer(spokenText, correctAnswer);
  };

  // ==========================================
  // ERROR
  // ==========================================

  recognition.onerror = (event) => {
    console.log("Speech recognition error:", event.error);

    // Jangan anggap no-speech sebagai kegagalan
    if (event.error === "no-speech") {
      statusElement.textContent = "🎤 Still listening... Please speak.";

      return;
    }

    if (event.error === "not-allowed") {
      recognitionActive = false;

      clearTimeout(thinkingTimer);

      statusElement.textContent = "❌ Microphone permission denied.";

      alert("Microphone permission is denied. Please allow microphone access.");

      return;
    }

    statusElement.textContent = "❌ Voice recognition error.";
  };

  // ==========================================
  // ON END
  // ==========================================

  recognition.onend = () => {
    console.log("🎤 Recognition ended.");

    /*
      Chrome dapat menghentikan recognition
      ketika user terlalu lama diam.

      Jika waktu menjawab masih berjalan,
      kita mulai kembali recognition.
    */

    if (recognitionActive && !answerFinished) {
      console.log("🔄 Restarting recognition...");

      setTimeout(() => {
        if (recognitionActive && !answerFinished) {
          try {
            recognition.start();
          } catch (error) {
            console.log("Restart error:", error);
          }
        }
      }, 500);
    }
  };

  // ==========================================
  // MULAI RECOGNITION
  // ==========================================

  try {
    recognition.start();
  } catch (error) {
    console.log("Recognition start error:", error);
  }
}

function stopVoiceRecognition() {
  recognitionActive = false;
  answerFinished = true;

  clearTimeout(thinkingTimer);

  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {
      console.log("Recognition already stopped.");
    }
  }
}

// ==========================================
// CHECK ANSWER
// ==========================================

function checkAnswer(userAnswer, correctAnswer) {
  // Normalisasi

  const user = normalizeText(userAnswer);
  const correct = normalizeText(correctAnswer);

  console.log("User:", user);
  console.log("Correct:", correct);

  // ======================================
  // JAWABAN BENAR
  // ======================================

  if (user === correct || isSimilarAnswer(user, correct)) {
    statusElement.textContent = "🎉 CORRECT!";
    audioBenar.play();
    audioSalah.volume = 1;
  }

  // ======================================
  // JAWABAN SALAH
  // ======================================
  else {
    statusElement.textContent = "❌ WRONG!";
    correctAnswerElement.textContent = "Correct answer is : " + correct;
    audioSalah.play();
    audioSalah.volume = 1;
  }
}

// ==========================================
// NORMALIZE TEXT
// ==========================================

function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ");
}

// ==========================================
// SIMPLE SIMILARITY CHECK
// ==========================================

function isSimilarAnswer(user, correct) {
  /*
          Voice Recognition kadang-kadang
          menghasilkan sedikit perbedaan.

          Contoh:

          Correct:
          "my name is hamri"

          Recognition:
          "my name's hamri"
        */

  const userWords = user.split(" ");
  const correctWords = correct.split(" ");

  let match = 0;

  correctWords.forEach((word) => {
    if (userWords.includes(word)) {
      match++;
    }
  });

  const similarity = match / correctWords.length;

  /*
          Jika minimal 70% kata cocok,
          dianggap benar.
        */

  return similarity >= 0.7;
}

//kode single page aplication

materiPembelajaranBtn.addEventListener("click", function () {
  halamanMuka.style.display = "none";
  materiPembelajaran.style.display = "block";
  narationBtn.style.display = "none";
});
tujuanPembelajaranBtn.addEventListener("click", function () {
  halamanMuka.style.display = "none";
  tujuanPembelajaran.style.display = "block";
  narationBtn.style.display = "none";
});
caraPermainanBtn.addEventListener("click", function () {
  halamanMuka.style.display = "none";
  caraPermainan.style.display = "block";
  narationBtn.style.display = "none";
});

tentangGimBtn.addEventListener("click", function () {
  window.location.href = "assets/tentang_gim.pdf";
});

backBtns.forEach((backBtns) => {
  backBtns.addEventListener("click", function () {
    halamanMuka.style.display = "flex";
    materiPembelajaran.style.display = "none";
    tujuanPembelajaran.style.display = "none";
    caraPermainan.style.display = "none";
    tentangGim.style.display = "none";
    game.style.display = "none";
  });
});

mulaiBtn.addEventListener("click", function () {
  halamanMuka.style.display = "none";
  game.style.display = "flex";
  narationBtn.style.display = "block";
});
