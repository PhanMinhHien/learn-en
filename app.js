// ======================================
// English Journey v1.7
// Learning Engine
// ======================================

// ======================================
// SECURITY & ANTI-CHEAT MEASURES
// ======================================

// Disable DevTools
function disableDevTools() {
  // Disable F12
  document.addEventListener("keydown", (e) => {
    if (e.key === "F12") {
      e.preventDefault();
      return false;
    }
  });

  // Disable Ctrl+Shift+I (Inspector)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "I") {
      e.preventDefault();
      return false;
    }
  });

  // Disable Ctrl+Shift+C (Element picker)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
      e.preventDefault();
      return false;
    }
  });

  // Disable Ctrl+Shift+J (Console)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "J") {
      e.preventDefault();
      return false;
    }
  });

  // Disable Right-click
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });

  // Detect DevTools opening (rough detection)
  let devtools = { open: false, orientation: null };
  
  const threshold = 160;
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        console.clear();
        console.log("🔒 DevTools không được phép sử dụng");
      }
    } else {
      devtools.open = false;
    }
  }, 500);
}

// Override console methods to prevent logging sensitive data
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = function(...args) {
  // Prevent logging
  return;
};

console.warn = function(...args) {
  return;
};

console.error = function(...args) {
  return;
};

// ======================================
// AUTHENTICATION
// ======================================

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION = 5 * 60 * 1000;

// let loginAttempts =
//   Number(localStorage.getItem("loginAttempts")) || 0;

// let lockUntil =
//   Number(localStorage.getItem("lockUntil")) || 0;

// const DEMO_CREDENTIALS = {
//   username: "student",
//   passwordHash:
//     "$2a$10$CkyNtcnBF2dtJfNe5KcNgu1rwv3TEgK0/D/E3OppPF8OfrB0mn5iu"
// };

let currentUser = null;

function findUser(username) {

    return usersDatabase.find(user =>
        user.username.toLowerCase() === username.toLowerCase()
    );

}
function checkUserLock(user){


    if(user.status !== "locked"){

        return false;

    }


    // Nếu có thời gian lock và đã hết hạn

    if(
        user.lockedUntil &&
        Date.now() > user.lockedUntil
    ){


        user.status = "active";

        user.failedAttempts = 0;

        user.lockedUntil = 0;


        saveUsers();


        return false;

    }


    return true;


}

function getProgressKey() {

    if (!currentUser) {
        return "englishProgress_guest";
    }

    return `englishProgress_${currentUser.id}`;

}
async function handleLogin(event) {
  if(usersDatabase.length===0){

    await loadUsers();

}
  event.preventDefault();

  // ==========================
  // Check account lock
  // ==========================
  // if (Date.now() < lockUntil) {
  //   const remainingSeconds = Math.ceil(
  //     (lockUntil - Date.now()) / 1000
  //   );

  //   const minutes = Math.floor(remainingSeconds / 60);
  //   const seconds = remainingSeconds % 60;

  //   alert(
  //     `🔒 Too many failed attempts.\n\nPlease try again in ${minutes}m ${seconds}s.`
  //   );

  //   return;
  // }

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  // ==========================
  // Check password
  // ==========================
 const user = findUser(username);


if (!user) {

    await showAlert("User not found.");

    return;

}



if(checkUserLock(user)){


    let message =
        "🔒 This account is locked.";


    if(user.lockedUntil){

        const remaining =
            Math.ceil(
                (user.lockedUntil - Date.now())
                /
                60000
            );


        message +=
        `\nTry again in ${remaining} minute(s).`;

    }


await showAlert(message);

    return;

}

const passwordOK =
dcodeIO.bcrypt.compareSync(
password,
user.passwordHash
);

if(passwordOK) {


    user.lastLogin =
        new Date().toISOString();


    user.failedAttempts = 0;

    user.lockedUntil = 0;

    user.status = "active";


    saveUsers();

    // ==========================
    // Reset login attempts
    // ==========================
    loginAttempts = 0;
    lockUntil = 0;

    localStorage.removeItem("loginAttempts");
    localStorage.removeItem("lockUntil");

    // ==========================
    // Create session
    // ==========================
    const sessionData = {

    uid:user.id,

    username:btoa(user.username),

    role:btoa(user.role),

    ts:Date.now()

};

    const encrypted = btoa(JSON.stringify(sessionData));

   currentUser = {

    id:user.id,

    username:user.username,

    role:user.role,

    loginTime:new Date().toISOString()

};
    localStorage.setItem("__session", encrypted);

    usernameInput.value = "";
    passwordInput.value = "";
    document.getElementById("loginForm").reset();

    showAppScreen();
    loadDatabase();

  } else {

    // ==========================
    // Failed login
    // ==========================


    user.failedAttempts =
        (user.failedAttempts || 0) + 1;



    if(
        user.failedAttempts >= MAX_LOGIN_ATTEMPTS
    ){

        user.status = "locked";


        user.lockedUntil =
            Date.now() + LOCK_DURATION;


    }


    saveUsers();

   const remaining =
    MAX_LOGIN_ATTEMPTS - user.failedAttempts;


if(user.status === "locked"){


   await showAlert(
"🔒 Too many failed attempts..."
);

}else{


    await showAlert(

        `❌ Invalid credentials!\n\nRemaining attempts: ${remaining}`
    );


}

    passwordInput.value = "";
  }
}

async function handleLogout() {
const ok =
await showConfirm(
"Are you sure you want to logout?"
);

if(!ok) return;  
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

function showLoginScreen() {
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("appScreen").style.display = "none";
}

function showAppScreen() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appScreen").style.display = "flex";
  document.getElementById("userGreeting").textContent = `Welcome, ${currentUser.username}! 👋`;

  const adminBtn = document.getElementById("adminBtn");

if (currentUser.role === "admin") {
    adminBtn.style.display = "flex";
} else {
    adminBtn.style.display = "none";
}
}

function checkAuth() {
  const savedSession = localStorage.getItem("__session");
  
  if (savedSession) {
    try {
      // Verify encrypted session
      const decrypted = JSON.parse(atob(savedSession));
      
      // Validate session (optional: check timestamp)
      const SESSION_EXPIRE = 24 * 60 * 60 * 1000;

if (
    decrypted.uid &&
    Date.now() - decrypted.ts < SESSION_EXPIRE
) {
        currentUser = {

    id:decrypted.uid,

    username:atob(decrypted.username),

    role:atob(decrypted.role)

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

// ======================================
// USERS DATABASE
// ======================================

let usersDatabase = [];

async function loadUsers() {


    const savedUsers =
        localStorage.getItem("usersDatabase");


    if(savedUsers){

        usersDatabase =
            JSON.parse(savedUsers);


        console.log(
            "✅ Loaded users from localStorage",
            usersDatabase
        );


        return;

    }



    usersDatabase =
        await loadJSON("./data/users.json");



    saveUsers();



    console.log(
        "✅ Loaded users from users.json",
        usersDatabase
    );


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
const [
grammar,
vocabulary,
collocation,
phrasal
] =
await Promise.all([

loadJSON("./data/grammar_a1_a2.json"),
loadJSON("./data/vocabulary_a1_a2.json"),
loadJSON("./data/collocations_a1_a2.json"),
loadJSON("./data/phrasal_verbs_a1_a2.json")

]);
// usersDatabase = users;

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

function saveUsers(){

    localStorage.setItem(
        "usersDatabase",
        JSON.stringify(usersDatabase)
    );

}



function loadUsersFromStorage(){

    const savedUsers =
        localStorage.getItem("usersDatabase");


    if(savedUsers){

        usersDatabase =
            JSON.parse(savedUsers);

        console.log(
            "Loaded users from localStorage",
            usersDatabase
        );

    }

}

let editingUserId = null;
let modalResolver = null;

let modalMode = "alert";

function showModal({

    title="Notification",

    message="",

    mode="alert",

    placeholder="",

    value=""

}){

    modalMode = mode;

    return new Promise(resolve=>{

        modalResolver = resolve;

        document
        .getElementById("modalTitle")
        .textContent = title;

        document
        .getElementById("modalMessage")
        .textContent = message;

        const input =
        document.getElementById("modalInput");

        const cancel =
        document.getElementById("modalCancel");

        if(mode==="prompt"){

            input.style.display="block";

            input.placeholder=placeholder;

            input.value=value;

            setTimeout(()=>input.focus(),50);

        }else{

            input.style.display="none";

        }

        cancel.style.display =
        mode==="confirm" || mode==="prompt"
        ? "inline-flex"
        : "none";

        document
        .getElementById("globalModal")
        .classList.add("show");

    });

}

function closeModal(ok){

    document
    .getElementById("globalModal")
    .classList.remove("show");

    if(!modalResolver) return;

    if(modalMode==="alert"){

        modalResolver(true);

    }

    if(modalMode==="confirm"){

        modalResolver(ok);

    }

    if(modalMode==="prompt"){

        if(ok){

            modalResolver(

                document
                .getElementById("modalInput")
                .value

            );

        }else{

            modalResolver(null);

        }

    }

    modalResolver=null;

}

function showAlert(message){

    return showModal({

        title:"Notification",

        message,

        mode:"alert"

    });

}

function showConfirm(message){

    return showModal({

        title:"Confirmation",

        message,

        mode:"confirm"

    });

}

function showPrompt({

    title,

    message,

    placeholder="",

    value=""

}){

    return showModal({

        title,

        message,

        placeholder,

        value,

        mode:"prompt"

    });

}

document
.getElementById("modalOK")
.onclick=()=>closeModal(true);

document
.getElementById("modalCancel")
.onclick=()=>closeModal(false);

document
.getElementById("globalModal")
.onclick=function(e){

    if(e.target===this){

        if(modalMode!=="alert"){

            closeModal(false);

        }

    }

};

document
.addEventListener("keydown",function(e){

    const modal =
    document.getElementById("globalModal");

    if(!modal.classList.contains("show"))
        return;

    if(e.key==="Escape"){

        closeModal(false);

    }

    if(
        e.key==="Enter" &&
        modalMode==="prompt"
    ){

        closeModal(true);

    }

});

function getUserById(id) {

    return usersDatabase.find(user => user.id === id);

}

async function showAdminPanel() {

    if (!currentUser || currentUser.role !== "admin") {

await showAlert("⛔ Access denied.");
        return;

    }

    document.getElementById("content").innerHTML = `

<div class="lesson-card admin-panel">

    <div class="admin-header">

        <h2>

            👨‍💼 English Journey Admin

        </h2>

       <button
    id="createUserBtn"
    onclick="showCreateUserModal()"
>

    ➕ Create User

</button>

<button
onclick="exportUsersJSON()"
>
⬇️ Export users.json
</button>

<button
onclick="triggerImportUsers()"
>
⬆️ Import users.json
</button>


<input
type="file"
id="importUsersFile"
accept=".json"
style="display:none"
onchange="importUsersJSON(event)"
>
</div>


    </div>

    ${renderUsersTable()}

</div>

`;

    hideLessonNav();

}
function renderUsersTable() {

    if (!usersDatabase.length) {
        return "<p>No users found.</p>";
    }

    let rows = "";

    usersDatabase.forEach(user => {

        rows += `
            <tr>
                <td>${user.username}</td>
                <td>${capitalize(user.role)}</td>
                <td>${user.status}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td>${user.lastLogin ? formatDate(user.lastLogin) : "Never"}</td>
                <td>

<button
class="action-btn"
onclick="toggleUserMenu(${user.id})"
>

⚙️

</button>

<div
id="userMenu-${user.id}"
class="user-menu"
>

<button onclick="editUser(${user.id})">

✏️ Edit

</button>

<button onclick="toggleLockUser(${user.id})">

${user.status==="active"
? "🔒 Lock"
: "🔓 Unlock"}

</button>

<button onclick="resetPassword(${user.id})">

🔑 Reset Password

</button>

<button
class="danger"
onclick="deleteUser(${user.id})"
>

🗑 Delete

</button>

</div>

</td>
            </tr>
        `;

    });

    return `
        <table class="admin-table">

            <thead>
                <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last Login</th>
                    <th>Action</th>
                </tr>
            </thead>

            <tbody>

                ${rows}

            </tbody>

        </table>
    `;
}

function capitalize(text){

    if(!text) return "";

    return text.charAt(0).toUpperCase()+text.slice(1);

}
    function formatDate(date){

    if(!date) return "-";

    return new Date(date).toLocaleDateString();

}
async function exportUsersJSON(){

    if(!usersDatabase.length){

await showAlert("No users data.");
        return;

    }


    const data =
        JSON.stringify(
            usersDatabase,
            null,
            4
        );


    const blob =
        new Blob(
            [data],
            {
                type:"application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;


    link.download =
        "users.json";


    document.body.appendChild(link);


    link.click();


    document.body.removeChild(link);


    URL.revokeObjectURL(url);


await showAlert("✅ users.json exported successfully.");
}

function triggerImportUsers(){

    document
    .getElementById("importUsersFile")
    .click();

}
function importUsersJSON(event){


    const file =
        event.target.files[0];


    if(!file){

        return;

    }



    const reader =
        new FileReader();



reader.onload = async function(e){

        try{


            const importedUsers =
                JSON.parse(
                    e.target.result
                );



            if(
                !Array.isArray(importedUsers)
            ){

                throw new Error(
                    "Invalid format"
                );

            }



            const valid =
                importedUsers.every(
                    user =>
                    user.id &&
                    user.username &&
                    user.passwordHash &&
                    user.role &&
                    user.status
                );



            if(!valid){


                throw new Error(
                    "Missing user fields"
                );


            }



            const confirmImport =
                await showConfirm(
                `Import ${importedUsers.length} users?\n\nCurrent users will be replaced.`
                );



            if(!confirmImport){

                return;

            }



            usersDatabase =
                importedUsers;



            saveUsers();



            await showAlert(
                "✅ Users imported successfully."
            );



            showAdminPanel();



        }catch(error){


            await showAlert(
                "❌ Invalid users.json file."
            );


            console.error(error);


        }



    };



    reader.readAsText(file);



}
function toggleLockUser(id){

    const user =
        getUserById(id);


    if(!user) return;



    if(user.status==="active"){


        user.status="locked";


        user.lockedUntil =
            0;

    //         user.lockedUntil =
    // Date.now() + LOCK_DURATION;


    }else{


        user.status="active";


        user.failedAttempts=0;


        user.lockedUntil=0;


    }



    saveUsers();


    showAdminPanel();

}
async function deleteUser(id){


    const confirmDelete =
        await showConfirm(
            "Are you sure you want to delete this user?"
        );


    if(!confirmDelete)
        return;



    usersDatabase =
        usersDatabase.filter(
            user => user.id !== id
        );


    saveUsers();


    showAdminPanel();


}
async function resetPassword(id){


    const user =
        getUserById(id);


    if(!user){

        await showAlert("User not found.");

        return;

    }


  const newPassword =
await showPrompt({

    title:"Reset Password",

    message:`Enter new password for ${user.username}`,

    placeholder:"New password"

});

if(!newPassword)
    return;



    user.passwordHash =
        dcodeIO.bcrypt.hashSync(
            newPassword,
            10
        );



    // reset security status

    user.failedAttempts = 0;

    user.lockedUntil = 0;
user.status = "active";

    saveUsers();


    await showAlert(
        "✅ Password reset successfully."
    );


}
// function showCreateUserModal() {

//     const username = prompt("Username:");

//     if (!username) return;

//     const password = prompt("Password:");

//     if (!password) return;

//     const role = prompt("Role (student / teacher / admin):", "student");

//     if (!role) return;

//     const user = {

//         id: Date.now(),

//         username,

//         passwordHash: dcodeIO.bcrypt.hashSync(password, 10),

//         role,

//         status: "active",

//         createdAt: new Date().toISOString(),

//         lastLogin: null,

//         failedAttempts: 0,

//         lockedUntil: 0

//     };

//     usersDatabase.push(user);

//     showAdminPanel();

// }


function showCreateUserModal() {

    const modal = document.getElementById("adminModal");

    console.log("Modal:", modal);

    if (!modal) {
        showAlert("adminModal not found");
        return;
    }

    modal.classList.add("show");

}
function closeAdminModal() {

    editingUserId = null;

    document
        .getElementById("adminModal")
        .classList.remove("show");

    document.getElementById("newUsername").value = "";

    document.getElementById("newPassword").value = "";

    document.getElementById("newRole").value = "student";

    document.getElementById("newStatus").value = "active";

    document.querySelector("#adminModal h2").textContent =
        "Create User";

    document.querySelector(".btn-primary").textContent =
        "Create User";

}
async function createUser(){

    const username =
        document.getElementById("newUsername").value.trim();

    const password =
        document.getElementById("newPassword").value;

    const role =
        document.getElementById("newRole").value;

    const status =
        document.getElementById("newStatus").value;


        if (editingUserId !== null) {

    const user = getUserById(editingUserId);

    user.username =
        username;

    user.role =
        role;

    user.status =
        status;

    if (password.trim()) {

        user.passwordHash =
            dcodeIO.bcrypt.hashSync(password, 10);

    }
saveUsers();
    editingUserId = null;

    closeAdminModal();

    showAdminPanel();

    return;

}
    if(!username || !password){

        await showAlert("Please fill all fields.");

        return;

    }

    const existed =
        usersDatabase.some(user =>
            user.username.toLowerCase() === username.toLowerCase()
        );

    if(existed){

        await showAlert("Username already exists.");

        return;

    }

    usersDatabase.push({

        id:Date.now(),

        username,

        passwordHash:dcodeIO.bcrypt.hashSync(password,10),

        role,

        status,

        createdAt:new Date().toISOString(),

        lastLogin:null,

        failedAttempts:0,

        lockedUntil:0

    });
saveUsers();
    closeAdminModal();

    showAdminPanel();

}
function toggleUserMenu(id){


    const currentMenu =
        document.getElementById(
            `userMenu-${id}`
        );



    // Close all other menus

    document
    .querySelectorAll(".user-menu")
    .forEach(menu => {

        if(menu !== currentMenu){

            menu.classList.remove("show");

        }

    });



    // Toggle current menu

    currentMenu.classList.toggle("show");


}

function editUser(id) {

    const user = getUserById(id);

    if (!user) return;

    editingUserId = id;

    document.querySelector("#adminModal h2").textContent =
        "Edit User";

    document.getElementById("newUsername").value =
        user.username;

    document.getElementById("newPassword").value = "";

    document.getElementById("newRole").value =
        user.role;

    document.getElementById("newStatus").value =
        user.status;

    document.querySelector(".btn-primary").textContent =
        "Save Changes";

    document
        .getElementById("adminModal")
        .classList.add("show");

}

document.addEventListener(
    "click",
    function(event){


        const isMenuButton =
            event.target.closest(
                ".action-btn"
            );


        const isMenu =
            event.target.closest(
                ".user-menu"
            );



        if(
            !isMenu &&
            !isMenuButton
        ){

            document
            .querySelectorAll(".user-menu")
            .forEach(menu=>{

                menu.classList.remove(
                    "show"
                );

            });

        }


    }
);
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
  const saved = localStorage.getItem(getProgressKey());

  if (saved) {
    userProgress = JSON.parse(saved);
  }

  if (!userProgress.learnedItems) {
    userProgress.learnedItems = [];
  }
}

function saveProgress() {
  localStorage.setItem(
    getProgressKey(),
    JSON.stringify(userProgress)
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
    showAlert("Database loading...");

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
    showAlert("No lessons available. Please try again.");
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
document.getElementById("appScreen").appendChild(navBar);
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
    showAlert("📌 Added to your notes!");
  } else {
    showAlert("Already saved in your notes.");
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

    showAlert("❌ Not correct. Try again!");
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
    showAlert("Database loading...");
    return;
  }

  currentLessonType = 'quiz';
  localStorage.setItem(LESSON_STORAGE_KEY, 'quiz');
  updateLessonSelection();
  const list = grammarData.filter(
    (item) => item.practice && item.practice.length,
  );

  if (!list || list.length === 0) {
    showAlert("No quiz available");
    return;
  }

  const lesson = randomItem(list);

  if (!lesson) {
    showAlert("No quiz available");

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
    showAlert("Your browser does not support speech");

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


async function deleteNote(id){


const confirmDelete =
await showConfirm(
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
// DARK MODE
// ======================================

const DARK_MODE_KEY = 'darkMode';

function initDarkMode() {
  const isDarkMode = localStorage.getItem(DARK_MODE_KEY) === 'true';
  if (isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem(DARK_MODE_KEY, 'false');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem(DARK_MODE_KEY, 'true');
  }
}

// ======================================
// START APP
// ======================================

// Initialize dark mode
initDarkMode();

// Enable security measures
disableDevTools();

// Check authentication first
(async function(){

    await loadUsers();

    if(checkAuth()){
        await loadDatabase();
    }

})();

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
