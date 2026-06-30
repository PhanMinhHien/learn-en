// ======================================
// English Journey v1.7
// Learning Engine
// ======================================

// DATABASE

let grammarData = [];
let vocabularyData = [];
let collocationData = [];
let phrasalVerbData = [];

let databaseReady = false;

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

    console.log("DATABASE READY");
  } catch (error) {
    console.error(error);
  }
}

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

  renderLesson(type, item);
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



<button onclick='noteLesson(${JSON.stringify(item).replace(/'/g, "&apos;")})'>

📌 Save to Notes

</button>



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



<button onclick='noteLesson(${JSON.stringify(item)})'>

📌 Save to Notes

</button>



</div>


`;
  }

  document.getElementById("content").innerHTML = html;
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
  const list = grammarData.filter(
    (item) => item.practice && item.practice.length,
  );

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
}

// ======================================
// RANDOM
// ======================================

function randomItem(array) {
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

loadDatabase();
