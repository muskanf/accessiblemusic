import "./style.css";
const rows = 3;
const columns = 8;
// filling the matrx with zeros
const matrix = Array.from(
  { length: rows },
  () => Array(columns).fill(0)
);
// Names for the three rows.
// These will later be: ["Kick", "Snare", "Hi-hat"]
const rowNames = [
  "Row 1",
  "Row 2",
  "Row 3"
];
const headerRow = document.querySelector("#column-headers");
const gridBody = document.querySelector("#grid-body");
const screenReaderStatus =
  document.querySelector("#screen-reader-status");
// column headers
for (let column = 0; column < columns; column++) {
  const header = document.createElement("th");
  header.scope = "col";
  header.id = `column-${column}`;
  header.textContent = `Beat ${column + 1}`;
  headerRow.appendChild(header);
}
// Add one final header for the row controls.
const controlsHeader = document.createElement("th");
controlsHeader.scope = "col";
controlsHeader.textContent = "Row controls";
headerRow.appendChild(controlsHeader);
// table rows
for (let row = 0; row < rows; row++) {
  const tableRow = document.createElement("tr");
  //row header
  const rowHeader = document.createElement("th");
  rowHeader.scope = "row";
  rowHeader.id = `row-${row}`;
  rowHeader.textContent = rowNames[row];
  tableRow.appendChild(rowHeader);
  // 8 checkbox cells
  for (let column = 0; column < columns; column++) {
    const tableCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "grid-checkbox";
    // Gives JavaScript a way to know which
    // matrix position this checkbox represents.
    checkbox.dataset.row = row;
    checkbox.dataset.column = column;
    // Screen reader label:"Row 1, Beat 3, checkbox, unchecked"
    // The screen reader will automatically announce checked / unchecked state.
    checkbox.setAttribute(
      "aria-label",
      `${rowNames[row]}, Beat ${column + 1}`
    );
  //updating the matrix when a checkbox is checked or unchecked
    checkbox.addEventListener("change", () => {
      matrix[row][column] =
        checkbox.checked ? 1 : 0;
      console.log(matrix);
    });
    tableCell.appendChild(checkbox);
    tableRow.appendChild(tableCell);
  }
  // read row button
  const controlsCell = document.createElement("td");
  const readButton = document.createElement("button");
  readButton.type = "button";
  readButton.textContent = "Read row";
  readButton.setAttribute(
    "aria-label",
    `Read contents of ${rowNames[row]}`
  );
  readButton.addEventListener("click", () => {
    readRow(row);
  });
  controlsCell.appendChild(readButton);
  tableRow.appendChild(controlsCell);
  gridBody.appendChild(tableRow);
}
// read row with screen reader
function readRow(row) {
  const rowValues = matrix[row];
  // Convert:
  //
  // [1, 0, 0, 1] -> "one zero zero one"

  const spokenValues = rowValues
    .map(value => value === 1 ? "one" : "zero")
    .join(" ");
  const message =
    `${rowNames[row]}: ${spokenValues}`;
  // Clear first so pressing the same button
  // repeatedly still triggers an announcement.
  screenReaderStatus.textContent = "";
  requestAnimationFrame(() => {
    screenReaderStatus.textContent = message;
  });
}