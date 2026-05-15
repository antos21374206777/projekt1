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
function highlightLine(index) {
  document.querySelectorAll('#programBody tr').forEach(row => {
    row.classList.remove('active-line');
  });

  const row = document.getElementById(`line-${index}`);

  if (row) {
    row.classList.add('active-line');
  }
}

/* =========================
   ANIMACJE (ONLY ADD)
========================= */

function animateMemory(address) {
  const cell = document.getElementById(`mem-${address}`);
  if (!cell) return;

  cell.animate([
    { transform: 'scale(1)', backgroundColor: '#fff176' },
    { transform: 'scale(1.15)', backgroundColor: '#ffd54f' },
    { transform: 'scale(1)', backgroundColor: '#fff' }
  ], { duration: 450 });
}

function animateCPU() {
  const cpu = document.querySelector('.cpu-box');
  if (!cpu) return;

  cpu.animate([
    { boxShadow: '0 0 0px #42a5f5' },
    { boxShadow: '0 0 25px #42a5f5' },
    { boxShadow: '0 0 0px #42a5f5' }
  ], { duration: 400 });
}

function animateInput(i) {
  const el = document.getElementById(`in${i}`);
  if (!el) return;

  el.animate([
    { transform: 'scale(1)', backgroundColor: '#81d4fa' },
    { transform: 'scale(1.2)', backgroundColor: '#29b6f6' },
    { transform: 'scale(1)', backgroundColor: '#fff' }
  ], { duration: 450 });
}

function animateOutput(i) {
  const el = document.getElementById(`out${i}`);
  if (!el) return;

  el.animate([
    { transform: 'scale(1)', backgroundColor: '#a5d6a7' },
    { transform: 'scale(1.2)', backgroundColor: '#66bb6a' },
    { transform: 'scale(1)', backgroundColor: '#fff' }
  ], { duration: 500 });
}

function executeInstruction(line) {

  animateCPU(); // ANIMACJA
    const instr = line.instruction.toUpperCase().trim();
  const arg = line.argument.trim();

  document.getElementById('instr').textContent = instr;
  document.getElementById('arg').textContent = arg || '-';

  switch (instr) {

    case 'LOAD': {
      const value = resolveValue(arg);
      setMemory(0, value);
      pc++;
      break;
    }

    case 'STORE': {
      const addr = resolveAddress(arg);
      setMemory(addr, getMemory(0));
      pc++;
      break;
    }

    case 'ADD': {
      const value = resolveValue(arg);
      setMemory(0, getMemory(0) + value);
      pc++;
      break;
    }

    case 'SUB': {
      const value = resolveValue(arg);
      setMemory(0, getMemory(0) - value);
      pc++;
      break;
    }

    case 'MULT': {
      const value = resolveValue(arg);
      setMemory(0, getMemory(0) * value);
      pc++;
      break;
    }

    case 'DIV': {
      const value = resolveValue(arg);

      if (value === 0) throw new Error('Dzielenie przez zero');

      setMemory(0, Math.floor(getMemory(0) / value));
      pc++;
      break;
    }

    case 'READ': {

      if (inputHead >= inputTape.length) {
        throw new Error('Koniec taśmy wejściowej');
      }

      animateInput(inputHead); // ANIMACJA

      const addr = resolveAddress(arg);
      setMemory(addr, inputTape[inputHead]);

      inputHead++;
      pc++;
      break;
    }

    case 'WRITE': {

      const value = resolveValue(arg);

      outputTape.push(value);

      if (outputHead < OUTPUT_SIZE) {
        document.getElementById(`out${outputHead}`).value = value;

        animateOutput(outputHead); // ANIMACJA
      }

      outputHead++;
      pc++;
      break;
    }

    case 'JUMP': {
      jumpToLabel(arg);
      break;
    }

    case 'JGTZ': {
      if (getMemory(0) > 0) {
        jumpToLabel(arg);
      } else {
        pc++;
      }
      break;
    }

    case 'JZERO': {
      if (getMemory(0) === 0) {
        jumpToLabel(arg);
      } else {
        pc++;
      }
      break;
    }

    case 'HALT': {
      running = false;
      pc = program.length;
      break;
    }

    default:
      throw new Error(`Nieznana instrukcja: ${instr}`);
  }
}

function jumpToLabel(label) {
  if (labelMap[label] === undefined) {
    throw new Error(`Nie znaleziono etykiety: ${label}`);
  }

  pc = labelMap[label];
}

function step() {
  if (pc >= program.length) {
    running = false;
    return false;
  }

  const line = program[pc];

  highlightLine(pc);

  executeInstruction(line);

  return true;
}

function stepButton() {
  try {
    step();
  } catch (error) {
    running = false;
    alert(error.message);
  }
}

async function run() {
  running = true;

  try {
    while (running && pc < program.length) {
      step();
      await sleep(400);
    }
  } catch (error) {
    running = false;
    alert(error.message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

window.run = run;
window.stepButton = stepButton;
window.reset = reset;

window.addProgramLine = addProgramLine;
window.updateInstruction = updateInstruction;
window.updateArgument = updateArgument;
window.updateLabel = updateLabel;
window.removeProgramLine = removeProgramLine;

window.onload = init;

let inputCount = 10;
let outputCount = 10;

function renderInputTape() {
  const indexes = document.getElementById("inputIndexes");
  const fields = document.getElementById("inputFields");

  indexes.innerHTML = "";
  fields.innerHTML = "";

  for (let i = 0; i < inputCount; i++) {
    indexes.innerHTML += `<span>${i}</span>`;
    fields.innerHTML += `
      <input type="number" id="in${i}" value="0">
    `;
  }
}

function renderOutputTape() {
  const indexes = document.getElementById("outputIndexes");
  const fields = document.getElementById("outputFields");

  indexes.innerHTML = "";
  fields.innerHTML = "";

  for (let i = 0; i < outputCount; i++) {
    indexes.innerHTML += `<span>${i}</span>`;
    fields.innerHTML += `
      <input type="number" id="out${i}" readonly>
    `;
  }
}

function addInput() {
  inputCount++;
  renderInputTape();
}

function removeInput() {
  if (inputCount > 10) {
    inputCount--;
    renderInputTape();
  }
}

function addOutput() {
  outputCount++;
  renderOutputTape();
}

function removeOutput() {
  if (outputCount > 10) {
    outputCount--;
    renderOutputTape();
  }
}

renderInputTape();
renderOutputTape();
