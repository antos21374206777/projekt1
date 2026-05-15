const MEMORY_SIZE = 11;
const OUTPUT_SIZE = 10;

let memory = {};
let inputTape = [];
let outputTape = [];

let inputHead = 0;
let outputHead = 0;

let pc = 0;
let running = false;

const availableInstructions = [
  'LOAD',
  'STORE',
  'ADD',
  'SUB',
  'MULT',
  'DIV',
  'READ',
  'WRITE',
  'JUMP',
  'JGTZ',
  'JZERO',
  'HALT'
];

const program = [
  { label: 'START', instruction: 'READ', argument: '1' },
  { label: '', instruction: 'READ', argument: '2' },
  { label: '', instruction: 'LOAD', argument: '1' },
  { label: '', instruction: 'SUB', argument: '2' },
];

const labelMap = {};

function init() {
  createMemory();
  createProgramTable();
  buildLabelMap();
  reset();
}

function createMemory() {
  const tbody = document.querySelector('#memory tbody');
  tbody.innerHTML = '';

  for (let i = 0; i < MEMORY_SIZE; i++) {
    const tr = document.createElement('tr');

    const tdAddress = document.createElement('td');
    tdAddress.textContent = i;

    const tdValue = document.createElement('td');
    tdValue.id = `mem-${i}`;
    tdValue.textContent = '?';

    if (i === 0) {
      tdValue.classList.add('acc');
    }

    tr.appendChild(tdAddress);
    tr.appendChild(tdValue);

    tbody.appendChild(tr);
  }
}

function createProgramTable() {
  const tbody = document.getElementById('programBody');
  tbody.innerHTML = '';

  program.forEach((line, index) => {
    const tr = document.createElement('tr');
    tr.id = `line-${index}`;

    const instructionOptions = availableInstructions
      .map(instr => {
        const selected = instr === line.instruction ? 'selected' : '';
        return `<option value="${instr}" ${selected}>${instr}</option>`;
      })
      .join('');

    tr.innerHTML = `
      <td>${index}</td>

      <td>
        <input type="text" value="${line.label}" onchange="updateLabel(${index}, this.value)">
      </td>

      <td>
        <select onchange="updateInstruction(${index}, this.value)">
          ${instructionOptions}
        </select>
      </td>

      <td>
        <input type="text" value="${line.argument}" onchange="updateArgument(${index}, this.value)">
      </td>

      <td>
        <button onclick="removeProgramLine(${index})">Usuń</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  addEmptyLine();
}

function addEmptyLine() {
  const tbody = document.getElementById('programBody');

  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td colspan="4">
      <button onclick="addProgramLine()">+ Dodaj instrukcję</button>
    </td>
  `;

  tbody.appendChild(tr);
}

function addProgramLine() {
  program.push({
    label: '',
    instruction: 'LOAD',
    argument: '=0'
  });

  buildLabelMap();
  createProgramTable();
}

function updateInstruction(index, value) {
  program[index].instruction = value;
}

function updateArgument(index, value) {
  program[index].argument = value;
}

function updateLabel(index, value) {
  program[index].label = value;
  buildLabelMap();
}

function removeProgramLine(index) {
  if (program.length <= 1) {
    alert('Program musi posiadać przynajmniej jedną linię');
    return;
  }

  program.splice(index, 1);

  buildLabelMap();
  createProgramTable();
}

function buildLabelMap() {
  Object.keys(labelMap).forEach(key => delete labelMap[key]);

  program.forEach((line, index) => {
    if (line.label && line.label.trim() !== '') {
      labelMap[line.label.trim()] = index;
    }
  });
}

function reset() {
  memory = {};
  inputTape = [];
  outputTape = [];

  inputHead = 0;
  outputHead = 0;

  pc = 0;
  running = false;

  document.getElementById('instr').textContent = '-';
  document.getElementById('arg').textContent = '-';

  for (let i = 0; i < MEMORY_SIZE; i++) {
    updateMemoryCell(i);
  }

  for (let i = 0; i < OUTPUT_SIZE; i++) {
    document.getElementById(`out${i}`).value = '';
  }

  document.querySelectorAll('#programBody tr').forEach(row => {
    row.classList.remove('active-line');
  });

  loadInputTape();
}

function loadInputTape() {
  inputTape = [];

  for (let i = 0; i < 8; i++) {
    const value = parseInt(document.getElementById(`in${i}`).value);

    if (!isNaN(value)) {
      inputTape.push(value);
    }
  }
}

function updateMemoryCell(address) {
  const cell = document.getElementById(`mem-${address}`);

  if (memory[address] === undefined) {
    cell.textContent = '?';
    cell.style.backgroundColor = '#cccccc';
  } else {
    cell.textContent = memory[address];
    cell.style.backgroundColor = 'white';
  }

  if (address === 0) {
    cell.classList.add('acc');
  }
}

function getMemory(address) {
  if (memory[address] === undefined) {
    throw new Error(`Pamięć ${address} jest niezdefiniowana`);
  }

  return memory[address];
}

function setMemory(address, value) {
  memory[address] = value;
  updateMemoryCell(address);
  animateMemory(address); // ANIMACJA
}

function resolveValue(argument) {
  argument = argument.trim();

  if (argument.startsWith('=')) {
    return parseInt(argument.substring(1));
  }

  if (argument.startsWith('^')) {
    const addr = parseInt(argument.substring(1));
    const indirect = getMemory(addr);
    return getMemory(indirect);
  }

  return getMemory(parseInt(argument));
}

function resolveAddress(argument) {
  argument = argument.trim();

  if (argument.startsWith('^')) {
    const addr = parseInt(argument.substring(1));
    return getMemory(addr);
  }

  return parseInt(argument);
}
