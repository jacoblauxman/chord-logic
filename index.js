import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url"; // for es module syntax (no global __dirname available, see below)

import {
  chordSpellings,
  enharmonics,
  noteNames,
  absoluteNoteVals,
} from "./data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "data.txt");
const fileData = fs.readFileSync(filePath, "utf8");

const chordName = process.argv[2];
const newChordName = process.argv[3];

//

//
//
//

// RUNNING SCRIPT (for now)
const [_octaveFreqs, noteFreqs] = createNotesObject();
// NOTE: YOU MAY NEED TO CHANGE THE NAME AGAIN DUMMY!
if (chordName) {
  let parsed = parseName(chordName);
  let defaultChord = getDefaultChord(parsed);
  console.log(defaultChord);
  if (newChordName) {
    let newChord = getNewChord(defaultChord, newChordName);
    console.log(newChord);
  }
}

//
//
//

//

function createNotesObject() {
  const octaveFreqs = noteNames.reduce(
    (acc, curr) => ((acc[curr] = []), acc),
    {},
  );

  const noteFreqs = {};

  const dataLines = fileData.split("\n");
  const regex = new RegExp(/noteFreq\[(\d+)\]\["(.+)"\]\s*=\s*(\d+\.\d+)/);

  dataLines.forEach((line) => {
    const result = parseData(regex, line);
    if (result) {
      const [name, freq, octave] = result;

      octaveFreqs[name].push(freq);
      noteFreqs[`${name}${octave}`] = freq;
    }
  });

  return [octaveFreqs, noteFreqs];
}

function parseData(regex, line) {
  const match = regex.exec(line);

  if (match) {
    const parsedData = [match[2], match[3], match[1]];
    return parsedData;
  }
}

function parseName(chordName) {
  let name;
  let qual;
  if (chordName.includes("#")) {
    [name, qual] = [chordName.slice(0, 2), chordName.slice(2)];
    name = `${name}/${enharmonics[name]}`;
  } else if (chordName.includes("b")) {
    [name, qual] = [chordName.slice(0, 2), chordName.slice(2)];
    name = `${enharmonics[name]}/${name}`;
  } else {
    [name, qual] = [chordName.slice(0, 1), chordName.slice(1)];
  }

  return [name, qual];
}

function getChordSpelling(chord) {
  let spelling = chordSpellings[chord];

  return spelling;
}

function getDefaultChord() {
  const [name, qual] = parseName(chordName);
  let chord = `${name}${qual}`;

  // // TESTING: for working with 'default' values (without yet making separate data structure for those spellings):
  let [root, third, fifth] = getChordSpelling(chord);

  let rootFreq = noteFreqs[`${root}3`];
  let thirdFreq;
  let fifthFreq;

  let rootOct = 4;
  let notesOct;

  if (absoluteNoteVals[root] > absoluteNoteVals[third]) {
    thirdFreq = noteFreqs[`${third}5`];
    fifthFreq = noteFreqs[`${fifth}5`];
    notesOct = rootOct + 1;
  } else {
    thirdFreq = noteFreqs[`${third}4`];
    fifthFreq = noteFreqs[`${fifth}4`];
    notesOct = rootOct;
  }

  let chordObj = {
    chord,
    freqs: [rootFreq, thirdFreq, fifthFreq],
    root: `${root}${rootOct}`,
    third: `${third}${notesOct}`,
    fifth: `${fifth}${notesOct}`,
  };

  return chordObj;
}

function getNewChord(chordObj, newChordName) {
  if (!chordObj) {
    console.log("Note: must set default chord first!");
    return;
  }

  const [newName, newQual] = parseName(newChordName);
  const newChord = `${newName}${newQual}`;
  console.log(newName, newQual);
  const spelling = getChordSpelling(newChord);
  console.log(spelling);
}
