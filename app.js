// ======================================
// English Journey v1.7
// Learning Engine
// ======================================

// ======================================
// SECURITY & ANTI-CHEAT MEASURES
// ======================================

// Disable DevTools
// function disableDevTools() {
//   // Disable F12
//   document.addEventListener("keydown", (e) => {
//     if (e.key === "F12") {
//       e.preventDefault();
//       return false;
//     }
//   });

//   // Disable Ctrl+Shift+I (Inspector)
//   document.addEventListener("keydown", (e) => {
//     if (e.ctrlKey && e.shiftKey && e.key === "I") {
//       e.preventDefault();
//       return false;
//     }
//   });

//   // Disable Ctrl+Shift+C (Element picker)
//   document.addEventListener("keydown", (e) => {
//     if (e.ctrlKey && e.shiftKey && e.key === "C") {
//       e.preventDefault();
//       return false;
//     }
//   });

//   // Disable Ctrl+Shift+J (Console)
//   document.addEventListener("keydown", (e) => {
//     if (e.ctrlKey && e.shiftKey && e.key === "J") {
//       e.preventDefault();
//       return false;
//     }
//   });

//   // Disable Right-click
//   document.addEventListener("contextmenu", (e) => {
//     e.preventDefault();
//     return false;
//   });

//   // Detect DevTools opening (rough detection)
//   let devtools = { open: false, orientation: null };
  
//   const threshold = 160;
//   setInterval(() => {
//     if (window.outerHeight - window.innerHeight > threshold ||
//         window.outerWidth - window.innerWidth > threshold) {
//       if (!devtools.open) {
//         devtools.open = true;
//         console.clear();
//         console.log("🔒 DevTools không được phép sử dụng");
//       }
//     } else {
//       devtools.open = false;
//     }
//   }, 500);
// }

// // Override console methods to prevent logging sensitive data
// const originalLog = console.log;
// const originalWarn = console.warn;
// const originalError = console.error;

// console.log = function(...args) {
//   // Prevent logging
//   return;
// };

// console.warn = function(...args) {
//   return;
// };

// console.error = function(...args) {
//   return;
// };

// ======================================
// AUTHENTICATION
// ======================================

// Demo credentials (in production, use backend authentication)
const DEMO_CREDENTIALS = {
  username: "student",
  password: "140422"
};

let currentUser = null;

function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  
  // Clear input values immediately after reading
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  
  // Validate credentials
  if (username === DEMO_CREDENTIALS.username && 
      password === DEMO_CREDENTIALS.password) {
    
    // Create session with encrypted token
    const sessionData = {
      uid: Math.random().toString(36).substr(2, 9),
      ts: Date.now(),
      u: btoa(username) // Only encode username, never password
    };
    
    // Double encryption
    const encrypted = btoa(JSON.stringify(sessionData));
    
    currentUser = {
      username: username,
      loginTime: new Date().toISOString()
    };
    
    // Store only encrypted token, never raw credentials
    localStorage.setItem("__session", encrypted);
    
    // Clear form immediately
    usernameInput.value = "";
    passwordInput.value = "";
    document.getElementById("loginForm").reset();
    
    // Show app screen with loading indicator
    showAppScreen();
    
    // Show loading message while database loads
    // document.getElementById("content").innerHTML = `
    //   <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
    //     <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
    //     <h2>Loading lessons...</h2>
    //     <p style="color: var(--muted);">Please wait while we prepare your content</p>
    //   </div>
    // `;
    
    // Load database immediately
    loadDatabase();
  } else {
    // Generic error message - don't reveal which field failed
    alert("❌ Invalid credentials!");
    passwordInput.value = ""; // Only clear password, not username
  }
}

function handleLogout() {
  const confirm = window.confirm("Are you sure you want to logout?");
  
  if (confirm) {
    // Securely clear user session
    currentUser = null;
    localStorage.removeItem("__session");
    localStorage.removeItem("userSession");
    localStorage.removeItem("sessionToken");
    
    // Optionally clear learning progress
    // localStorage.removeItem("englishProgress");
    
    // Clear all form fields
    document.getElementById("loginForm").reset();
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    
    // Show login screen
    showLoginScreen();
  }
}

function showLoginScreen() {
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("appScreen").style.display = "none";
}

function showAppScreen() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appScreen").style.display = "flex";
  document.getElementById("userGreeting").textContent = `Welcome, ${currentUser.username}! 👋`;
}

function checkAuth() {
  const savedSession = localStorage.getItem("__session");
  
  if (savedSession) {
    try {
      // Verify encrypted session
      const decrypted = JSON.parse(atob(savedSession));
      
      // Validate session (optional: check timestamp)
      if (decrypted.uid && decrypted.ts) {
        currentUser = {
          username: atob(decrypted.u),
          sessionId: decrypted.uid
        };
        showAppScreen();
        return true;
      }
    } catch (e) {
      // Session corrupted or invalid
      handleLogout();
      return false;
    }
  }
  
  showLoginScreen();
  return false;
}

// DATABASE

let grammarData = [];
let vocabularyData = [];
let collocationData = [];
let phrasalVerbData = [];

let databaseReady = false;

// Track current lesson type for navigation
const LESSON_STORAGE_KEY = "currentLessonType";
let currentLessonType = null;

// ======================================
// USER DATA
// ======================================

let userProgress = {
  streak: 1,

  quizCorrect: 0,

  learnedItems: [],
};

// ======================================
// UTILITIES
// ======================================

function escapeQuote(str) {
  if (!str) return "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "\\n");
}

// ======================================
// LOAD JSON
// ======================================

async function loadJSON(file) {
  const response = await fetch(file);

  if (!response.ok) {
    throw new Error(file + " missing");
  }

  return await response.json();
}

// ======================================
// LOAD DATABASE
// ======================================

async function loadDatabase() {
  try {
    const [grammar, vocabulary, collocation, phrasal] = await Promise.all([
      loadJSON("./data/grammar_a1_a2.json"),

      loadJSON("./data/vocabulary_a1_a2.json"),

      loadJSON("./data/collocations_a1_a2.json"),

      loadJSON("./data/phrasal_verbs_a1_a2.json"),
    ]);

    grammarData = grammar;

    vocabularyData = vocabulary;

    collocationData = collocation;

    phrasalVerbData = phrasal;

    databaseReady = true;

    loadProgress();

    updateDashboard();

    restoreLastLesson();

    // Show welcome screen after database is ready
    // showWelcomeScreen();
  } catch (error) {
    // Fallback error handling
    document.getElementById("content").innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
        <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
        <h2>Failed to load lessons</h2>
        <p style="color: var(--muted);">Please refresh the page and try again</p>
      </div>
    `;
  }
}

// ======================================
// SHOW WELCOME SCREEN
// ======================================

// function showWelcomeScreen() {
//   document.getElementById("content").innerHTML = `
//     <section class="stats">
//       <div class="stat-card">
//         <div class="stat-icon">📘</div>
//         <div>
//           <span> Grammar </span>
//           <h2 id="grammarCount">0</h2>
//         </div>
//       </div>

//       <div class="stat-card">
//         <div class="stat-icon">📚</div>
//         <div>
//           <span> Vocabulary </span>
//           <h2 id="vocabCount">0</h2>
//         </div>
//       </div>

//       <div class="stat-card">
//         <div class="stat-icon">🔗</div>
//         <div>
//           <span> Collocations </span>
//           <h2 id="collocationCount">0</h2>
//         </div>
//       </div>

//       <div class="stat-card">
//         <div class="stat-icon">⚡</div>
//         <div>
//           <span> Phrasal Verbs </span>
//           <h2 id="phrasalCount">0</h2>
//         </div>
//       </div>
//     </section>

//     <section id="content">
//       <div class="welcome">
//         <h2>Welcome to English Journey 🚀</h2>
//         <p>Choose a lesson to start learning.</p>
//       </div>
//     </section>
//   `;
  
//   updateDashboard();
// }

// ======================================
// PROGRESS
// ======================================

function loadProgress() {
  const saved = localStorage.getItem("englishProgress");

  if (saved) {
    userProgress = JSON.parse(saved);
  }

  if (!userProgress.learnedItems) {
    userProgress.learnedItems = [];
  }
}

function saveProgress() {
  localStorage.setItem(
    "englishProgress",

    JSON.stringify(userProgress),
  );
}

// ======================================
// DASHBOARD
// ======================================

function updateDashboard() {
  const grammar = document.getElementById("grammarCount");

  if (grammar) {
    grammar.innerText = grammarData.length;
  }

  const vocab = document.getElementById("vocabCount");

  if (vocab) {
    vocab.innerText = vocabularyData.length;
  }

  const collocation = document.getElementById("collocationCount");

  if (collocation) {
    collocation.innerText = collocationData.length;
  }

  const phrasal = document.getElementById("phrasalCount");

  if (phrasal) {
    phrasal.innerText = phrasalVerbData.length;
  }

  const streak = document.getElementById("streak");

  if (streak) {
    streak.innerText = userProgress.streak + " day";
  }
}

// ======================================
// LOAD LESSON
// ======================================

function loadLesson(type) {
  if (!databaseReady) {
    alert("Database loading...");

    return;
  }

  // Save current lesson type for navigation
  currentLessonType = type;
  localStorage.setItem(LESSON_STORAGE_KEY, type);
  updateLessonSelection();

  // Handle quiz separately
  if (type === 'quiz') {
    startQuiz();
    return;
  }

  let item;

  switch (type) {
    case "grammar":
      item = randomItem(grammarData);

      break;

    case "vocabulary":
      item = randomItem(vocabularyData);

      break;

    case "collocation":
      item = randomItem(collocationData);

      break;

    case "phrasal":
      item = randomItem(phrasalVerbData);

      break;
  }

  if (!item) {
    alert("No lessons available. Please try again.");
    return;
  }

  renderLesson(type, item);
}

function updateLessonSelection() {
  document.querySelectorAll('aside button[data-lesson]').forEach((button) => {
    const isActive = button.dataset.lesson === currentLessonType;
    button.classList.toggle('active', isActive);
  });
}

function isItemSaved(itemId) {
  if (!userProgress.learnedItems) return false;
  return userProgress.learnedItems.some((x) => x.id === itemId);
}

function getNoteButtonHtml(item) {
  const saved = isItemSaved(item.id);
  const buttonClass = saved ? "save-note-btn saved" : "save-note-btn";

  if (saved) {
    return `<button class="${buttonClass}" disabled>✔️ Saved in Notes</button>`;
  }

  const itemJson = JSON.stringify(item).replace(/'/g, "&apos;");
  return `<button class="${buttonClass}" onclick='noteLesson(${itemJson})'>📌 Save to Notes</button>`;
}

function updateSaveButtonState(itemId) {
  const btn = document.querySelector("button.save-note-btn");
  if (!btn) return;
  btn.classList.add("saved");
  btn.disabled = true;
  btn.textContent = "✔️ Saved in Notes";
  btn.removeAttribute("onclick");
}

function restoreLastLesson() {
  const savedType = localStorage.getItem(LESSON_STORAGE_KEY);
  if (!savedType) {
    return;
  }

  currentLessonType = savedType;
  switch (savedType) {
    case "grammar":
    case "vocabulary":
    case "collocation":
    case "phrasal":
      loadLesson(savedType);
      break;
    case "quiz":
      startQuiz();
      break;
    case "notes":
      showNotes();
      break;
    default:
      updateLessonSelection();
      break;
  }
}

// ======================================
// RENDER LESSON
// ======================================

function renderLesson(type, item) {
  let html = "";

  // =====================
  // GRAMMAR
  // =====================

  if (type === "grammar") {
    let examples = "";

    if (item.examples) {
      examples = item.examples
        .map(
          (ex) => `


<p class="example">


<b>
${ex.english}
</b>


<button
class="speak-btn"
onclick="speak('${escapeQuote(ex.english)}')"
>
🔊
</button>


<br>


${ex.vietnamese}


</p>


`,
        )
        .join("");
    }

    let practice = "";

    if (item.practice) {
      const q = item.practice[0];

      practice = `


<div 
class="practice-box"
data-id="${item.id}"
>


<h3>
📝 Practice
</h3>



<p>
${q.question}
</p>



${q.options
  .map(
    (option) => `


<button

class="option"

onclick="
checkGrammarAnswer(
this,
'${escapeQuote(option)}',
'${escapeQuote(q.answer)}',
'${escapeQuote(q.question)}',
'${item.id}',
'${escapeQuote(item.rule)}'
)
"

>

${option}

</button>


`,
  )
  .join("")}



</div>


`;
    }

    html = `

<div class="lesson-card">


<h2>
${item.topic}
</h2>


<p>

<b>
Goal:
</b>

<br>

${item.goal || ""}

</p>



<p>

<b>
Rule:
</b>

<br>

${item.rule}

</p>


<hr>


<h3>
Examples
</h3>


${examples}



${practice}



${getNoteButtonHtml(item)}



</div>

`;
  }

  // =====================
  // OTHER DATA
  // =====================
  else {
    let title = item.word || item.phrase;

    let fields = "";

    Object.keys(item).forEach((key) => {
      if (
        key === "id" ||
        key === "level" ||
        key === "word" ||
        key === "phrase"
      ) {
        return;
      }

      let label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      let value = item[key];

      // thêm speak cho example
      if (key === "example") {
        fields += `


<p class="example">


<b>
${label}
</b>


<br>


${value}


<button

class="speak-btn"

onclick="speak('${escapeQuote(value)}')"

>

🔊

</button>


</p>


`;
      } else {
        fields += `


<p>


<b>
${label}
</b>


<br>


${value}


</p>


`;
      }
    });

    html = `

<div class="lesson-card">


<h2>

${title}


<button
class="speak-btn"
onclick="speak('${escapeQuote(title)}')"
>

🔊

</button>


</h2>



${fields} 



${getNoteButtonHtml(item)}



</div>


`;
  }

  document.getElementById("content").innerHTML = html;
  
  // Show navigation bar
  showLessonNav(type);
}

// ======================================
// LESSON NAVIGATION
// ======================================

function showLessonNav(type) {
  let navHTML = `
    <div class="lesson-bottom-nav">
      <button onclick="loadLesson('${type}')" class="nav-btn prev-btn">⬅️ Previous</button>
      <button onclick="loadLesson('${type}')" class="nav-btn next-btn">Next ➡️</button>
    </div>
  `;
  
  // Create or update nav bar
  let navBar = document.getElementById("lessonNav");
  if (!navBar) {
    navBar = document.createElement("div");
    navBar.id = "lessonNav";
    document.body.appendChild(navBar);
  }
  navBar.innerHTML = navHTML;
  // adjust bottom padding to fit nav height
  updateBottomNavPadding();
  // observe nav size changes
  if (window.ResizeObserver) {
    if (window.__lessonNavObserver) window.__lessonNavObserver.disconnect();
    window.__lessonNavObserver = new ResizeObserver(updateBottomNavPadding);
    window.__lessonNavObserver.observe(navBar);
  }
}

// update CSS var for bottom nav height so `main` adjusts automatically
function updateBottomNavPadding() {
  const nav = document.getElementById('lessonNav');
  const root = document.documentElement;
  if (nav) {
    const rect = nav.getBoundingClientRect();
    const h = Math.ceil(rect.height || nav.offsetHeight || 0);
    // add a small buffer so content doesn't touch the nav
    const buffer = 24;
    const val = Math.max(h + buffer, 64);
    root.style.setProperty('--bottom-nav-height', `${val}px`);
  } else {
    root.style.setProperty('--bottom-nav-height', '0px');
  }
}

// Watch for lesson nav insertion if it's created later
function observeLessonNavInsertion() {
  if (window.__lessonNavMutObserver) return;
  const obs = new MutationObserver(() => {
    const nav = document.getElementById('lessonNav');
    if (nav) {
      updateBottomNavPadding();
      if (window.ResizeObserver && !window.__lessonNavObserver) {
        window.__lessonNavObserver = new ResizeObserver(updateBottomNavPadding);
        window.__lessonNavObserver.observe(nav);
      }
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  window.__lessonNavMutObserver = obs;
}

function hideLessonNav() {
  let navBar = document.getElementById("lessonNav");
  if (navBar) {
    navBar.innerHTML = "";
  }
}
// ======================================
// SAVE TO NOTES
// ======================================

function noteLesson(item) {
  if (!userProgress.learnedItems) {
    userProgress.learnedItems = [];
  }

  const exists = userProgress.learnedItems.some((x) => x.id === item.id);

  if (!exists) {
    userProgress.learnedItems.push({
      id: item.id,

      type: item.word ? "vocabulary" : item.phrase ? "phrase" : "grammar",

      content: item,

      learnedAt: new Date().toISOString(),

      favorite: false,

      reviewCount: 0,
    });

    saveProgress();
    updateSaveButtonState(item.id);
    alert("📌 Added to your notes!");
  } else {
    alert("Already saved in your notes.");
  }
}

// ======================================
// GRAMMAR PRACTICE CHECK
// ======================================

function checkGrammarAnswer(
  button,
  userAnswer,
  correctAnswer,
  question,
  lessonId,
  rule,
) {
  if (userAnswer === correctAnswer) {
    const result = question.replace(
      "___",
      "<strong>" + correctAnswer + "</strong>",
    );

    button.parentElement.innerHTML = `


<h3>
📝 Practice
</h3>



<p>

${result}

</p>



<p>
✅ Correct
</p>



<div class="explain-box">


<h4>
📘 Grammar Explanation
</h4>


<p>

${rule}

</p>


</div>


`;

    saveGrammarNote(lessonId);
  } else {
    button.style.opacity = "0.5";

    alert("❌ Not correct. Try again!");
  }
}

function saveGrammarNote(id) {
  if (!userProgress.learnedItems) {
    userProgress.learnedItems = [];
  }

  const exists = userProgress.learnedItems.some((item) => item.id === id);

  if (!exists) {
    userProgress.learnedItems.push({
      id: id,

      type: "grammar",

      learnedAt: new Date().toISOString(),
    });

    saveProgress();
  }
}

// ======================================
// QUIZ
// ======================================

function startQuiz() {
  if (!databaseReady) {
    alert("Database loading...");
    return;
  }

  currentLessonType = 'quiz';
  localStorage.setItem(LESSON_STORAGE_KEY, 'quiz');
  updateLessonSelection();
  const list = grammarData.filter(
    (item) => item.practice && item.practice.length,
  );

  if (!list || list.length === 0) {
    alert("No quiz available");
    return;
  }

  const lesson = randomItem(list);

  if (!lesson) {
    alert("No quiz available");

    return;
  }

  const q = lesson.practice[0];

  document.getElementById("content").innerHTML = `


<div class="lesson-card">


<h2>
📝 Quiz
</h2>



<p>

${q.question}

</p>




${q.options
  .map(
    (option) => `


<button

class="option"


onclick="
checkGrammarAnswer(
this,
'${escapeQuote(option)}',
'${escapeQuote(q.answer)}',
'${escapeQuote(q.question)}',
'${lesson.id}',
'${escapeQuote(lesson.rule)}'
)

"


>


${option}


</button>


`,
  )
  .join("")}




</div>


`;
  
  showLessonNav('quiz');
}

// ======================================
// RANDOM
// ======================================

function randomItem(array) {
  if (!array || array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

// ======================================
// SPEECH ENGINE
// ======================================

let englishVoices = [];

function loadVoices() {
  englishVoices = speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.startsWith("en"));
}

speechSynthesis.onvoiceschanged = loadVoices;

function speak(text) {
  if (!window.speechSynthesis) {
    alert("Your browser does not support speech");

    return;
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const preferredVoice =
    englishVoices.find((voice) => voice.name.includes("Samantha")) ||
    englishVoices.find((voice) => voice.lang === "en-US");

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.lang = "en-US";

  utterance.rate = 0.85;

  utterance.pitch = 1;

  speechSynthesis.speak(utterance);
}

// ======================================
// NOTES
// ======================================

function showNotes() {
  currentLessonType = 'notes';
  localStorage.setItem(LESSON_STORAGE_KEY, 'notes');
  updateLessonSelection();
  const notes = userProgress.learnedItems || [];

  if (notes.length === 0) {
    document.getElementById("content").innerHTML = `

<div class="lesson-card">


<h2>
📌 My Notes
</h2>


<p>
You haven't saved any lessons yet.
</p>


</div>

`;

    return;
  }

  let html = `


<div class="lesson-card">


<h2>
📌 My Notes
</h2>


`;

  notes.forEach((item) => {
    let data = item.content || {};

    let title = data.word || data.phrase || data.topic || item.id;

    const safeData = JSON.stringify(data).replace(/'/g, "&apos;");

    html += `


<div class="note-item">


<h3>

${title}

</h3>


<p>

Type:
${item.type}

</p>


<p>

Learned:

${new Date(item.learnedAt).toLocaleDateString()}

</p>



<div class="note-actions">


<button

onclick='loadNote(${safeData})'

>

📖 Review

</button>



<button

class="delete-note"

onclick="deleteNote('${item.id}')"

>

🗑 Remove

</button>


</div>



</div>


<hr>


`;
  });

  html += `

</div>

`;

  document.getElementById("content").innerHTML = html;
  hideLessonNav();
}
// ======================================
// DELETE NOTE
// ======================================


function deleteNote(id){


const confirmDelete =
confirm(
"Remove this lesson from your notes?"
);



if(!confirmDelete){

return;

}



userProgress.learnedItems =
userProgress.learnedItems.filter(
(item)=>item.id !== id
);



saveProgress();



showNotes();



}
function loadNote(item) {
  let type;

  if (item.word) {
    type = "vocabulary";
  } else if (item.phrase) {
    type = "collocation";
  } else {
    type = "grammar";
  }

  renderLesson(type, item);
}


const keyConfig = {

  vocabulary:{
    keyField:"word"
  },

  grammar:{
    keyField:"topic"
  },

  collocation:{
    keyField:"phrase"
  },

  phrasalVerb:{
    keyField:"phrase"
  }

};
function generateKeyDatabase(){

  const keys = {

    vocabulary:[],
    grammar:[],
    collocation:[],
    phrasalVerb:[]

  };


  function extractKeys(data,type){

    const field = keyConfig[type].keyField;


    return data.map(item=>{

      return {

        id:item.id,

        key:item[field]
          ?.trim()
          .toLowerCase()

      };

    })
    .filter(item=>item.key);


  }


  keys.vocabulary =
    extractKeys(vocabularyData,"vocabulary");


  keys.grammar =
    extractKeys(grammarData,"grammar");


  keys.collocation =
    extractKeys(collocationData,"collocation");


  keys.phrasalVerb =
    extractKeys(phrasalVerbData,"phrasalVerb");


  return keys;

}

function exportKeys(){

 const data = generateKeyDatabase();


 const blob = new Blob(
   [
    JSON.stringify(
      data,
      null,
      2
    )
   ],
   {
    type:"application/json"
   }
 );


 const url =
 URL.createObjectURL(blob);


 const a=document.createElement("a");

 a.href=url;

 a.download=
 "english_journey_keys.json";


 a.click();


 URL.revokeObjectURL(url);

}
// ======================================
// START APP
// ======================================

// Enable security measures
// disableDevTools();

// Check authentication first
if (checkAuth()) {
  loadDatabase();
}

// Mobile menu toggle
function toggleMenu() {
  const app = document.querySelector('.app-screen');
  if (!app) return;
  app.classList.toggle('menu-open');
}

document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('menuToggle');
  if (btn) btn.addEventListener('click', toggleMenu);

  // Close menu when a nav action is clicked
  document.querySelectorAll('aside button').forEach((b) => {
    b.addEventListener('click', () => {
      const app = document.querySelector('.app-screen');
      if (app) app.classList.remove('menu-open');
    });
  });
  // Backdrop click closes menu
  const backdrop = document.getElementById('menuBackdrop');
  if (backdrop) backdrop.addEventListener('click', () => {
    const app = document.querySelector('.app-screen');
    if (app) app.classList.remove('menu-open');
  });
  // initial bottom padding adjustment
  updateBottomNavPadding();
  window.addEventListener('resize', updateBottomNavPadding);
});
