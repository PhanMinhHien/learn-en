// ======================================
// AUTH CONFIG
// ======================================

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION = 5 * 60 * 1000;
const SESSION_EXPIRE = 24 * 60 * 60 * 1000;

let loginAttempts =
    Number(localStorage.getItem("loginAttempts")) || 0;

let lockUntil =
    Number(localStorage.getItem("lockUntil")) || 0;

let currentUser = null;

let users = [];

async function loadUsers() {

    try{

        const response =
            await fetch("./data/users.json");

        users =
            await response.json();

    }
    catch(e){

        console.error(e);

        alert("Cannot load users.json");

    }

}
function findUser(username){

    return users.find(
        u =>
            u.username.toLowerCase() ===
            username.toLowerCase()
    );

}
function createSession(user){

    const session={

        uid:crypto.randomUUID(),

        username:user.username,

        role:user.role,

        ts:Date.now()

    };

    localStorage.setItem(
        "__session",
        btoa(JSON.stringify(session))
    );

    currentUser=session;

}
function checkAuth(){

    const token=
        localStorage.getItem("__session");

    if(!token){

        showLoginScreen();

        return false;

    }

    try{

        const session=
            JSON.parse(atob(token));

        if(
            Date.now()-session.ts>
            SESSION_EXPIRE
        ){

            handleLogout();

            return false;

        }

        currentUser=session;

        showAppScreen();

        return true;

    }
    catch(e){

        handleLogout();

        return false;

    }

}
function handleLogout(){

    currentUser=null;

    localStorage.removeItem("__session");

    localStorage.removeItem("loginAttempts");

    localStorage.removeItem("lockUntil");

    showLoginScreen();

}
function showLoginScreen(){

    document.getElementById(
        "loginScreen"
    ).style.display="flex";

    document.getElementById(
        "appScreen"
    ).style.display="none";

}
function showAppScreen(){

    document.getElementById(
        "loginScreen"
    ).style.display="none";

    document.getElementById(
        "appScreen"
    ).style.display="flex";

    document.getElementById(
        "userGreeting"
    ).textContent=
    `Welcome, ${currentUser.username}! 👋`;

}