// Grabs the DOM element with id "rows" where the habit rows are created
const rows = document.getElementById("rows");

// Loads the saved version or state sourced from localStorage, or then resorts to an empty habits list/state
let state = JSON.parse(localStorage.getItem("habitTrackerState")) || { habits: [] };

// Return today's date as a "YYYY-MM-DD" string used as a key in the specified habit log
function todayKey() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// A 7-day view (weekly columns) array is created through the function getWeekKeys. The format is the same as previous: "YYYY-MM-DD" 
function getWeekKeys() {
  const keys = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(d);
    date.setDate(date.getDate() - i);
    keys.push(date.toISOString().split("T")[0]);
  }
  return keys;
}

// The variable weekKeys keeps the getWeekKeys array to show each habit by week in the table
const weekKeys = getWeekKeys();

// Create new habit object 
// The newHabit(name) function gives back one habit as an object
function newHabit(name) {
  return {
    // below produces a specific id for the habit added
    id: Math.random().toString(36).slice(2, 9),
    // User-inserted name for the habit
    name: name,
    // logs or updates the days which are ticked or unticked, results in storing the object.
    log: {}
  };
}

// This function converts the saved state into JSON and finally stores it to the localStorage also.
function saveState(stateObj) {
  localStorage.setItem("habitTrackerState", JSON.stringify(stateObj));
}

// This function calculates the number of consecutive days a habit was done
function computeStreak(habit) {
    // Count begins at 0
  let count = 0; 
  const d = new Date(); // checks current date
  while (true) {
    const key = d.toISOString().split("T")[0]; 
    if (habit.log[key]) { // checks if habit is done via the habit log
      count++; // streak increases by 1
      d.setDate(d.getDate() - 1); // move to previous day for checking
    } else {
      break; // stop if habit not done (unticked habit(s))
    }
  }
  return count; // returns streak length i.e. total number of days of completed habit
}


// =====================================================================
// === 1. RENDER UI: Dynamic DOM Generation (State Reconciliation) ===
// This function completely rebuilds the habit tracker table in the browser
// It is called every time the data changes (add, toggle, delete, import, etc.)
// It uses the current 'state' object to generate fresh HTML: no templates!
// =====================================================================
// render(): The master function that draws the entire UI from scratch
function render() {
  // Clears the existing rows and refreshes the HTML
  rows.innerHTML = "";

  // Displays a message if the list is empty which is "No habits yet"
  if (state.habits.length === 0) {
    // Here is the placeholder row created for the message "No habits yet" 
    const row = document.createElement("div");
    // grid layout styling applied
    row.setAttribute("style", "display:grid;grid-template-columns:1.6fr repeat(7,.9fr) .8fr 1fr;align-items:center;border-bottom:1px solid #eef2f6;");
    
    // Habit name column is added.
    const nameCol = document.createElement("div");
    nameCol.setAttribute("style", "padding:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;");
    nameCol.textContent = "No habits yet"; // Contains the placeholder message "No habits yet"
    row.appendChild(nameCol); // Put name column in the row
    
    // Add empty columns for the 7 days
    weekKeys.forEach(() => {
      const col = document.createElement("div");
      col.setAttribute("style", "padding:10px;text-align:center;"); // CSS styling spacing and centering applied
      row.appendChild(col); // Put empty name column in the row
    });
    
    // Show streak column (0 since no habits exist yet)
    const streakCol = document.createElement("div");
    streakCol.setAttribute("style", "padding:10px;font-variant-numeric:tabular-nums;");
    streakCol.textContent = "0"; 
    row.appendChild(streakCol); // Once again, adds to the row
    
    // Add column showing "Add a habit" message
    const actionsCol = document.createElement("div");
    actionsCol.setAttribute("style", "padding:10px;color:#66788a;");
    actionsCol.textContent = "Add a habit"; // Tells the user to add a habit
    row.appendChild(actionsCol); // Once more, it adds it to the row
    
    // Show placeholder empty message and exit
    rows.appendChild(row);
    return; // Stopping occurs here because no habits exist to display 
  }

  // Looping occurs for every habit and a row is produced
  state.habits.forEach(h => {
    // The habit row is produced (div element)    
    const row = document.createElement("div");
    row.setAttribute("style", "display:grid;grid-template-columns:1.6fr repeat(7,.9fr) .8fr 1fr;align-items:center;border-bottom:1px solid #eef2f6;");

    // Habit name is added for the first column
    const nameCol = document.createElement("div");
    // This one adds the habit name concretely
    nameCol.setAttribute("style", "padding:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;");
    nameCol.textContent = h.name;
    row.appendChild(nameCol); // Adding to the row once more

    // Creates the 7-day week log UI or columns
    weekKeys.forEach(k => {
      const col = document.createElement("div");
      col.setAttribute("style", "padding:10px;text-align:center;");

      // For each day a clickable button is produced
      const btn = document.createElement("button");
      btn.type = "button";
      // aria-label improving accessibility, assistive technologies or screen readers tell the user the date and the habit belonging to the button itself
      btn.setAttribute("aria-label", `${h.name} on ${k}`); // aria-label contained
      btn.setAttribute("role", "checkbox"); // role set to be a checkbox

      // Performs a check whether the day is marked as being completed or not
      const checked = !!h.log[k];
      btn.setAttribute("aria-checked", String(checked));
      btn.textContent = checked ? "Yes" : ""; // Here the check displays "Yes" on completed ones but if not, then it is empty.

      // This links the habit ID and date with the button making the click handler aware about the day and habit concerned with the toggling 
      btn.dataset.habitId = h.id; // habit id related
      btn.dataset.dateKey = k; // date related

      // Here the styling is applied so if a habit is completed, it appears as green
      btn.setAttribute(
        "style",
        "display:flex;align-items:center;justify-content:center;width:36px;height:36px;margin:auto;border-radius:8px;border:1px solid #dbe7f0;cursor:pointer;user-select:none;background:"+(checked?"#e9f8ef":"#fff")+";color:"+(checked?"#1e9e4a":"inherit")+";font-weight:"+(checked?"700":"400")+";"
      );

      // EventListener which toggles the habit of the day it is concerned with
      btn.addEventListener("click", onToggleDay);

      // For the users, Space/Enter keys are also toggled.
      btn.addEventListener("keydown", e => {
        // If statement for the Space/Enter being pressed
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          btn.click();
        }
      });

      col.appendChild(btn);
      row.appendChild(col);
    });

    // This one applies calculation for the streak amount and presents it on the UI
    const streakCol = document.createElement("div");
    streakCol.setAttribute("style", "padding:10px;font-variant-numeric:tabular-nums;");
    streakCol.textContent = String(computeStreak(h)); // Calculation occurs here
    row.appendChild(streakCol); // The streak column is presented in the habit row concerned

    // Action buttons concerned with the div connected to the buttons "tick today" and "delete habit"
    const actions = document.createElement("div");
    actions.setAttribute("style", "padding:10px;display:flex;gap:8px;flex-wrap:wrap;");

    // 1st: The tick today button related to the above action buttons
    const tick = document.createElement("button"); // Using JS the button is created
    tick.type = "button"; // Type listed being a button
    tick.textContent = "Tick today"; // textContent displays the "Tick today" text on the button
    // Styling applied below
    tick.setAttribute("style", "background:#fff;border:1px solid #dbe7f0;color:#0b3b58;padding:6px 10px;border-radius:8px;cursor:pointer;");
    tick.addEventListener("click", () => toggleLog(h.id, todayKey())); 
    actions.appendChild(tick);

    // 2nd: The delete button related to the above action buttons
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕"; // Text ("X") displayed once more for the delete button
    // Again styling made using inline CSS
    deleteBtn.style.cssText = "padding:6px 12px;border:none;background:#fee;color:#c00;border-radius:4px;cursor:pointer;font-weight:700;";
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Delete "${h.name}"?`)) {
        state.habits = state.habits.filter(x => x.id !== h.id);
        saveState(state);
        render();
      }
    });
    actions.appendChild(deleteBtn); // Adds delete button to actions container
    
    row.appendChild(actions); // Adds actions column to habit row
    rows.appendChild(row); // Add completed habit row to table
  });
}


// =====================================================================
// EVENT HANDLING & STATE MUTATION
// =====================================================================

// Mark a habit as done or not done for a date
function onToggleDay(e) {
  const btn = e.currentTarget; 
  const habitId = btn.dataset.habitId;
  const dateKey = btn.dataset.dateKey;
  toggleLog(habitId, dateKey);
}

// Enables making change to the checkmark regarding the habit and date targeted
function toggleLog(habitId, dateKey) {
  const habit = state.habits.find(h => h.id === habitId);
  if (habit) {
    habit.log[dateKey] = !habit.log[dateKey];
    saveState(state);
    render();
  }
}

// Add new habit via form
// =====================================================================
// Handle form submission to add new habit
document.getElementById("habit-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("habit-name"); // Get the input field
  const name = input.value.trim(); // Get habit name and remove extra spaces
  if (!name) return; // Exit if input is empty
  
  state.habits.push(newHabit(name)); // Add new habit to state
  saveState(state); // Save to localStorage
  input.value = ""; // Clear the input field
  render(); // Update the display
});

// Data management
// =====================================================================

// The code below helps to export the habits added as a JSON file
document.getElementById("export-json").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }); // Convert state to JSON
  const url = URL.createObjectURL(blob); // Create download link
  const a = document.createElement("a"); // Make link element
  a.href = url; // Set link to JSON file
  a.download = "habits-export.json"; // Set download filename
  a.click(); // Trigger download
  URL.revokeObjectURL(url); // Clean up memory
});

// This gives the option to import habits from JSON files
document.getElementById("import-json").addEventListener("change", async (e) => {
  const file = e.target.files?.[0]; // Get the selected file
  if (!file) return; // Exit if no file selected

  try {
    const text = await file.text(); // Read file content
    const data = JSON.parse(text); // Convert JSON to object
    if (!Array.isArray(data.habits)) throw new Error("Invalid format"); // Check if habits array exists
    
    state = data; // Replace current state with imported data
    saveState(state); // Save to localStorage
    render(); // Update display
    alert("Import complete. Data loaded."); // Notify user
  } catch (err) {
    alert("Import failed. Please check the JSON file format."); // Show error message
  }
  e.target.value = ""; // Clear file input
});

// Reset all data
document.getElementById("reset-all").addEventListener("click", () => {
  if (!confirm("Delete all habits and logs?")) return; // Ask user to confirm
  
  state = { habits: [] }; // Clear all habits
  saveState(state); // Save empty state
  render(); // Update display
  alert("All data reset."); // Notify user
});

// Show the app when page loads displaying the habits and other content.
render();