
import "./style.css";
import * as Tone from "tone";

const rowNames = ["Kick", "Snare", "Hi-hat"];

let rows = 3;
let columns = 8;
let tempo = 120;
let audioFeedback = true;
let currentStep = 0;
let isPlaying = false;

let matrix = [
  [1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 0],
  [1, 0, 1, 0, 1, 0, 1, 0]
];

const headerRow = document.querySelector("#column-headers");
const gridBody = document.querySelector("#grid-body");
const status = document.querySelector("#screen-reader-status");

const playButton = document.querySelector("#play-button");
const stopButton = document.querySelector("#stop-button");
const restartButton = document.querySelector("#restart-button");

const settingsButton = document.querySelector("#settings-button");
const closeButton = document.querySelector("#close-settings");
const settingsPanel = document.querySelector("#settings-panel");
const overlay = document.querySelector("#settings-overlay");

const rowsSelect = document.querySelector("#rows-select");
const stepsSelect = document.querySelector("#steps-select");
const tempoInput = document.querySelector("#tempo-input");
const audioSelect = document.querySelector("#audio-select");

let gridCells = [];
let gridCheckboxes = [];
let columnHeaders = [];
let pointerNavigation = false;

//this function starts the audio system
async function startAudio() {
  await Tone.start();
}

//this function announces messages to screen readers
function announce(message) {
  status.textContent = "";
  requestAnimationFrame(() => {
    status.textContent = message;
  });
}

//this function creates the drum instruments
const output = new Tone.Gain(0.8).toDestination();

const kick = new Tone.MembraneSynth({
  pitchDecay: 0.05,
  octaves: 8,
  envelope: {
    attack: 0.001,
    decay: 0.4,
    sustain: 0,
    release: 0.1
  }
}).connect(output);

const snare = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: {
    attack: 0.001,
    decay: 0.18,
    sustain: 0,
    release: 0.05
  }
}).connect(output);

const hihatFilter = new Tone.Filter({
  frequency: 7000,
  type: "highpass"
}).connect(output);

const hihat = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: {
    attack: 0.001,
    decay: 0.045,
    sustain: 0,
    release: 0.01
  }
}).connect(hihatFilter);

//this function plays a drum sound
function playDrum(row, time = Tone.now(), volume = 0.7) {
  if (row === 0) {
    kick.triggerAttackRelease("C2", "8n", time, volume);
  } else if (row === 1) {
    snare.triggerAttackRelease("16n", time, volume);
  } else {
    hihat.triggerAttackRelease("32n", time, volume);
  }
}

//this synthesizer creates the position feedback
const navigationSynth = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: {
    attack: 0.002,
    decay: 0.06,
    sustain: 0,
    release: 0.04
  }
}).toDestination();

navigationSynth.volume.value = -20;

//this function plays audio when a user navigates to a cell
async function playNavigationSound(row, column, checkbox) {
  if (!audioFeedback) return;

  try {
    await startAudio();
  } catch {
    return;
  }

  if (document.activeElement !== checkbox || !audioFeedback) {
    return;
  }

  const checked = matrix[row][column] === 1;
  const notes = [
    "C4", "D4", "E4", "F4",
    "G4", "A4", "B4", "C5",
    "D5", "E5", "F5", "G5",
    "A5", "B5", "C6", "D6"
  ];

  const now = Tone.now();

  playDrum(row, now, checked ? 0.6 : 0.15);

  navigationSynth.triggerAttackRelease(
    notes[column],
    "32n",
    now + 0.12,
    0.35
  );
}

//this function plays a sound when a note changes
async function playToggleSound(row, column, checked) {
  try {
    await startAudio();

    if (checked) {
      playDrum(row);
    } else {
      navigationSynth.triggerAttackRelease(
        "C3",
        "32n",
        Tone.now(),
        0.3
      );
    }
  } catch (error) {
    console.error("Audio error:", error);
  }
}

//this function reads a row using the screen reader
function readRow(row) {
  const values = matrix[row]
    .map(value => value === 1 ? "one" : "zero")
    .join(" ");

  announce(`${rowNames[row]}: ${values}`);
}

//this function creates the entire grid
function createGrid() {
  headerRow.innerHTML = `
    <th scope="col">
      <span class="sr-only">Instrument</span>
    </th>
  `;

  gridBody.innerHTML = "";
  gridCells = [];
  gridCheckboxes = [];
  columnHeaders = [];

  for (let column = 0; column < columns; column++) {
    const header = document.createElement("th");
    header.scope = "col";
    header.className = "step-header";
    header.textContent = "";

    const label = document.createElement("span");
    label.className = "sr-only";
    label.textContent = `Step ${column + 1}`;

    header.appendChild(label);
    headerRow.appendChild(header);
    columnHeaders.push(header);
  }

  const controlsHeader = document.createElement("th");
  controlsHeader.scope = "col";
  controlsHeader.className = "controls-header";
  controlsHeader.innerHTML = '<span class="sr-only">Row controls</span>';
  headerRow.appendChild(controlsHeader);

  for (let row = 0; row < rows; row++) {
    const tableRow = document.createElement("tr");
    tableRow.className = `row-${row}`;

    const rowHeader = document.createElement("th");
    rowHeader.scope = "row";
    rowHeader.className = "row-header";
    rowHeader.innerHTML = `<span class="sr-only">${rowNames[row]}</span>`;
    tableRow.appendChild(rowHeader);

    const rowCells = [];
    const rowCheckboxes = [];

    for (let column = 0; column < columns; column++) {
      const cell = document.createElement("td");
      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.className = "grid-checkbox";
      checkbox.checked = matrix[row][column] === 1;
      checkbox.dataset.row = row;
      checkbox.dataset.column = column;

      checkbox.setAttribute(
        "aria-label",
        `${rowNames[row]}, step ${column + 1} of ${columns}`
      );

      cell.classList.toggle("active", checkbox.checked);

      checkbox.addEventListener("focus", () => {
        if (!pointerNavigation) {
          void playNavigationSound(row, column, checkbox);
        }
      });

      checkbox.addEventListener("change", () => {
        matrix[row][column] = checkbox.checked ? 1 : 0;
        cell.classList.toggle("active", checkbox.checked);
        void playToggleSound(row, column, checkbox.checked);
      });

      cell.appendChild(checkbox);
      tableRow.appendChild(cell);

      rowCells.push(cell);
      rowCheckboxes.push(checkbox);
    }

    gridCells.push(rowCells);
    gridCheckboxes.push(rowCheckboxes);

    const controlsCell = document.createElement("td");
    controlsCell.className = "row-controls";

    const readButton = document.createElement("button");
    readButton.type = "button";
    readButton.className = "read-button";
    readButton.setAttribute("aria-label", `Read ${rowNames[row]} row`);

    readButton.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4Z"/>
        <path d="M17 9a5 5 0 0 1 0 6"/>
      </svg>
    `;

    readButton.addEventListener("click", () => readRow(row));

    controlsCell.appendChild(readButton);
    tableRow.appendChild(controlsCell);
    gridBody.appendChild(tableRow);
  }
}

//this function updates the matrix when the grid size changes
function resizeGrid(newRows, newColumns) {
  stopPlayback();

  const newMatrix = Array.from(
    { length: newRows },
    (_, row) => Array.from(
      { length: newColumns },
      (_, column) => matrix[row]?.[column] ?? 0
    )
  );

  rows = newRows;
  columns = newColumns;
  matrix = newMatrix;

  createGrid();
  announce(`Grid changed to ${rows} rows and ${columns} steps`);
}

//this function highlights the current playing step
function highlightStep(step) {
  columnHeaders.forEach((header, column) => {
    header.classList.toggle("playing", column === step);
  });

  gridCells.forEach(row => {
    row.forEach((cell, column) => {
      cell.classList.toggle("playing", column === step);
    });
  });
}

//this function removes the playback highlight
function clearHighlight() {
  columnHeaders.forEach(header => {
    header.classList.remove("playing");
  });

  gridCells.forEach(row => {
    row.forEach(cell => {
      cell.classList.remove("playing");
    });
  });
}

//this function plays one step of the sequence
function playStep(time) {
  const step = currentStep;

  for (let row = 0; row < rows; row++) {
    if (matrix[row][step] === 1) {
      playDrum(row, time);
    }
  }

  Tone.getDraw().schedule(() => {
    if (isPlaying) highlightStep(step);
  }, time);

  currentStep = (currentStep + 1) % columns;
}

const transport = Tone.getTransport();
transport.bpm.value = tempo;
transport.scheduleRepeat(playStep, "8n");

//this function stops playback
function stopPlayback() {
  isPlaying = false;
  transport.stop();
  transport.position = 0;
  currentStep = 0;
  clearHighlight();
}

//this function opens the settings menu
function openSettings() {
  settingsPanel.hidden = false;
  overlay.hidden = false;
  settingsButton.setAttribute("aria-expanded", "true");
  closeButton.focus();
}

//this function closes the settings menu
function closeSettings() {
  settingsPanel.hidden = true;
  overlay.hidden = true;
  settingsButton.setAttribute("aria-expanded", "false");
  settingsButton.focus();
}

//this function clears the grid
function clearGrid() {
  stopPlayback();

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      matrix[row][column] = 0;
      gridCheckboxes[row][column].checked = false;
      gridCells[row][column].classList.remove("active");
    }
  }

  announce("Grid cleared");
}

//this event starts the sequencer
playButton.addEventListener("click", async () => {
  try {
    await startAudio();
    if (isPlaying) return;

    stopPlayback();
    isPlaying = true;
    transport.start();

    announce("Playback started");
  } catch (error) {
    console.error("Playback error:", error);
    announce("Unable to start playback");
  }
});

//this event stops the sequencer
stopButton.addEventListener("click", () => {
  stopPlayback();
  announce("Playback stopped");
});

//this event clears the grid
restartButton.addEventListener("click", clearGrid);

//these events open and close the settings menu
settingsButton.addEventListener("click", openSettings);
closeButton.addEventListener("click", closeSettings);
overlay.addEventListener("click", closeSettings);

document.addEventListener("keydown", event => {
  pointerNavigation = false;

  if (event.key === "Tab" || event.key === " ") {
    void startAudio().catch(() => {});
  }

  if (event.key === "Escape" && !settingsPanel.hidden) {
    closeSettings();
  }
}, true);

document.addEventListener("pointerdown", () => {
  pointerNavigation = true;
  void startAudio().catch(() => {});
}, true);

//this event changes the number of instrument rows
rowsSelect.addEventListener("change", () => {
  resizeGrid(Number(rowsSelect.value), columns);
});

//this event changes the number of steps
stepsSelect.addEventListener("change", () => {
  resizeGrid(rows, Number(stepsSelect.value));
});

//this event changes the playback tempo
tempoInput.addEventListener("change", () => {
  const value = Number(tempoInput.value);

  if (value >= 40 && value <= 240) {
    tempo = value;
    transport.bpm.value = tempo;
    announce(`Tempo set to ${tempo}`);
  } else {
    tempoInput.value = tempo;
  }
});

//this event enables or disables navigation sounds
audioSelect.addEventListener("change", () => {
  audioFeedback = audioSelect.value === "on";

  announce(
    audioFeedback
      ? "Navigation audio enabled"
      : "Navigation audio disabled"
  );
});

createGrid();
