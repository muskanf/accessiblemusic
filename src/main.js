import "./style.css";

const rows = 8;
const columns = 8;

const grid = document.querySelector("#grid");

for (let row = 0; row < rows; row++) {
  for (let column = 0; column < columns; column++) {
    const cell = document.createElement("button");

    cell.className = "grid-cell";
    cell.type = "button";

    cell.textContent = `${row + 1}, ${column + 1}`;

    cell.setAttribute(
      "aria-label",
      `Row ${row + 1}, column ${column + 1}`
    );

    grid.appendChild(cell);
  }
}