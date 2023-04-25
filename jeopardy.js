// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]
const counters = {
  counter: 0,
  catCounter: 0,
  answered: false,
  answer: "",
  lastClue: -1,
};
let categories = [];
let card = $(".card");
let titleDiv = $(`.card-header`);
let clueDiv = $(".question");
let answerDiv = $(".answer");
let sbutton = $(".start");
let restart = $(".restart");
let modal = $(".modal");
const spinner = $(".spinner");

// resets everything when restarting game
function resetCounters() {
  counters.counter = 0;
  counters.catCounter = 0;
  counters.answered = false;
  counters.answer = "";
  counters.lastClue = -1;
  categories = [];
}
/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  let categoryIds = [];
  let cats = await axios.get("http://jservice.io//api/random?count=6");
  let data = cats.data;
  let id;
  let catCount;
  for (let category of data) {
    id = category.category_id;
    catCount = parseInt(category.category.clues_count);
    console.log("clue count", catCount);
    if (!categoryIds.includes(id) && catCount >= 2) {
      categoryIds.push(id);
    } else {
      //makes sure categories are different and have at least 2 questions

      return await getCategoryIds();
    }
  }
  return categoryIds;
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  const cat = await axios.get(`http://jservice.io/api/category?id=${catId}`);
  let { title, clues } = cat.data;
  return { title, clues };
}

// create card with category as title
function createCard() {
  let category = categories[counters.counter];
  if (category !== undefined) {
    let { title } = category;
    titleDiv.text(title);
  }
}

/*
 * Handle clicking on a clue: show the question or answer.
 * */

function handleClick(evt) {
  if (counters.counter < 6) {
    createClue();
  }
}

//creates clue/category and appends it to card
function createClue() {
  if (counters.catCounter >= 2 && counters.counter < 6) {
    nextCategory();
  } else {
    nextQA();
  }
}

// updates counters for the next category
function nextCategory() {
  counters.counter++;
  counters.catCounter = 0;
  counters.lastClue = -1;
  createCard();
  createClue();
}

// retrives a random question with its answer and elimate duplicate questions
function nextQA() {
  let clueArr = categories[counters.counter];
  if (counters.counter < 6 && !counters.answered) {
    answerDiv.text("");
    let clues = clueArr.clues;
    let randomClue = Math.floor(Math.random() * clues.length);
    // elimates duplicate clues
    while (counters.lastClue === randomClue) {
      randomClue = Math.floor(Math.random() * clues.length);
    }
    counters.lastClue = randomClue;
    let clue = clues[randomClue];
    let question = clue.question;
    counters.answer = "Answer: " + clue.answer;
    clueDiv.text(question);
    counters.answered = true;
  } else if (counters.answered) {
    //display answer
    answerDiv.html(counters.answer);
    counters.answered = false;
    counters.catCounter++;
  } else {
    // game over
    gameOver();
  }
}
function gameOver() {
  card.fadeOut("slow");
  sbutton.hide();
  setTimeout(() => {
    modal.fadeIn("slow");
  }, 1000);
}

function restartGame() {
  modal.hide();
  sbutton.fadeIn("slow");
  showLoadingView();
}
/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  resetCounters();
  card.hide();
  spinner.show();
  hideLoadingView();
}

/** Remove the loading spinner and update the button used to fetch data. */

async function hideLoadingView() {
  await setupAndStart();
  spinner.hide();
  card.fadeIn("slow");
}

// called when the page loads
async function firstTimeLoad() {
  spinner.show();
  sbutton.text("Restart Game");
  await setupAndStart();
  spinner.hide();
  card.fadeIn("slow");
  console.log("First time load");
  sbutton.off("click", firstTimeLoad);
  sbutton.on("click", showLoadingView);
}
/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  let ids = await getCategoryIds();
  let category;
  for (let id of ids) {
    category = await getCategory(id);
    categories.push(category);
  }
  createCard();
  createClue();
}

card.on("click", handleClick);
spinner.hide();
restart.on("click", restartGame);
/** On click of start / restart button, set up game. */
sbutton.on("click", firstTimeLoad);