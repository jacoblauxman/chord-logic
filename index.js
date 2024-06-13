import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url"; // for es module syntax (no global __dirname available, see below)

import { chordSpellings, enharmonics, noteNames } from "./data.js";

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
const {
  octaveFreqs,
  noteFreqs,
  freqNames,
  absNoteVals,
  absValNotes,
  absByNote,
} = createNotesObjects();

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

function createNotesObjects() {
  const octaveFreqs = noteNames.reduce(
    (acc, curr) => ((acc[curr] = []), acc),
    {},
  );

  // enables 'direct' lookup of both frequency based off Note+Octave and vice versa
  const noteFreqs = {};
  const freqNames = {};
  const absNoteVals = {};
  const absValNotes = {};
  const absByNote = noteNames.reduce(
    (acc, curr) => ((acc[curr] = []), acc),
    {},
  );
  let val = 0;

  const dataLines = fileData.split("\n");
  const regex = new RegExp(/noteFreq\[(\d+)\]\["(.+)"\]\s*=\s*(\d+\.\d+)/);

  dataLines.forEach((line) => {
    const result = parseData(regex, line);
    if (result) {
      const [name, freq, octave] = result;
      let tone = `${name}${octave}`;

      octaveFreqs[name].push(freq);
      noteFreqs[tone] = freq;
      freqNames[`${freq}`] = tone;
      // test for making 'weighted' note+octave values (for cmp, instead of frequency values)
      absNoteVals[tone] = val;
      absValNotes[val] = tone;
      absByNote[name].push(val);
      val += 1;
    }
  });

  return {
    octaveFreqs,
    noteFreqs,
    freqNames,
    absNoteVals,
    absValNotes,
    absByNote,
  };
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

  // default to major (as you do)
  if (qual === "") {
    // I think we can just trim this down to an empty string value, no need for `undefined/null` check(?)
    qual = "maj";
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

  // // TESTING: for working with 'default' chord values (without yet making separate data structure for those spellings):
  let [root, third, fifth] = getChordSpelling(chord);

  let rootFreq = noteFreqs[`${root}3`];
  let thirdFreq;
  let fifthFreq;

  let rootOct = 4;
  let notesOct;

  if (absNoteVals[root] > absNoteVals[third]) {
    thirdFreq = noteFreqs[`${third}5`];
    fifthFreq = noteFreqs[`${fifth}5`];
    notesOct = rootOct + 1;
  } else {
    thirdFreq = noteFreqs[`${third}4`];
    fifthFreq = noteFreqs[`${fifth}4`];
    notesOct = rootOct;
  }

  const absVals = [rootFreq, thirdFreq, fifthFreq].map((freq) => {
    const name = freqNames[`${freq}`];
    return absNoteVals[name];
  });

  let chordObj = {
    chord,
    absVals,
    freqs: [rootFreq, thirdFreq, fifthFreq],
    root: `${root}${rootOct}`,
    third: `${third}${notesOct}`,
    fifth: `${fifth}${notesOct}`,
  };

  return chordObj;
}

function getNewChord(oldChordObj, newChordName) {
  if (!oldChordObj) {
    console.log("Note: must set default chord first!");
    return;
  }

  // parse
  const [newName, newQual] = parseName(newChordName);

  const newChord = `${newName}${newQual}`;
  console.log(newChord);
  // get notes
  const newSpelling = getChordSpelling(newChord);
  console.log(newSpelling);
  // find best choices
  const newAbsChoices = getNewAbsChoices(newSpelling);
  console.log(newAbsChoices);

  const voiceLeading = voiceLead(oldChordObj.absVals, newAbsChoices);
  console.log(voiceLeading);

  // return `newChordObj`
  // const newChordObj = {
  //   chord: newChord,
  //   // TODO!
  // };
}

function getNewAbsChoices(newSpelling) {
  let newAbsChoices = [];
  for (const noteName of newSpelling) {
    newAbsChoices = newAbsChoices.concat(absByNote[noteName]);
  }

  return newAbsChoices;
}

// TODO: Finish logic!
function voiceLead(oldAbsVals, newAbsChoices) {
  const bestChoices = {};
  for (const oldVal of oldAbsVals) {
    bestChoices[oldVal] = calculateBestChoices(oldVal, newAbsChoices);
  }

  for (const key in bestChoices) {
    console.log(key);
    console.log(bestChoices[key]);
  }
}

function calculateBestChoices(oldVal, newAbsChoices) {
  let low = {
    first: { diff: Infinity, val: null },
    second: { diff: Infinity, val: null },
  };
  let hi = {
    first: { diff: Infinity, val: null },
    second: { diff: Infinity, val: null },
  };

  for (const newVal of newAbsChoices) {
    let diff = Math.abs(newVal - oldVal);

    if (newVal <= oldVal) {
      if (diff < low.first.diff) {
        low.second = { ...low.first };
        low.first = { diff, val: newVal };
      } else if (diff < low.second.diff) {
        low.second = { diff, val: newVal };
      }
    } else {
      if (diff < hi.first.diff) {
        hi.second = { ...hi.first };
        hi.first = { diff, val: newVal };
      } else if (diff < hi.second.diff) {
        hi.second = { diff, val: newVal };
      }
    }
  }
  return { low, hi };
}

//
//

// TODO NOTES:
// - match each 'new note' to its given array values of freqs (`octaveFreqs`)
// - make an object of comparison values to 'old note' freqs -> helper function:
// -- helper iterates through each 'new note' freq arr to find two 'closest' (one below / 'lower' and one above / 'higher') of EACH 'old note' freq
// -- range plays a factor here: need a flag for "up / down / either" for instances where 'lower' or 'higher' may not exist (grab `next` of whichever DOES exist)
// -- -- this is ESPECIALLY true since we won't allow our full "range" (chords and their tones should probably be within the '2nd'/'3rd' octave range to the '6th' to avoid extremes)
// -- -- maybe use absolute note values to compare 'distance' (in reference to half steps) between notes rather than the actual freq values (which are logarithmic)
