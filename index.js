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
const { octaveFreqs, noteFreqs, freqNames, absNoteVals, absValNotes } =
  createNotesObjects();
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
      // test for making 'weighted' note+octave values
      absNoteVals[tone] = val;
      absValNotes[val] = tone;
      val += 1;
    }
  });

  return { octaveFreqs, noteFreqs, freqNames, absNoteVals, absValNotes };
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
    name = `${name} /${enharmonics[name]}`;
  } else if (chordName.includes("b")) {
    [name, qual] = [chordName.slice(0, 2), chordName.slice(2)];
    name = `${enharmonics[name]}/${name}`;
  } else {
    [name, qual] = [chordName.slice(0, 1), chordName.slice(1)];

    // default to major (as you do)
    if (qual === "") {
      // I think we can just trim this down to an empty string value, no need for `undefined/null` check(?)
      qual = "maj";
    }
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

  if (absNoteVals[root] > absNoteVals[third]) {
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

  // parse
  const [newName, newQual] = parseName(newChordName);
  const newChord = `${newName}${newQual}`;
  // console.log(newChord);
  // get notes
  const newSpelling = getChordSpelling(newChord);
  console.log(newSpelling);
  // find choices
  const choices = getRelativeChordTones(chordObj, newSpelling);
}

function getRelativeChordTones(chordObj, newSpelling) {
  let absOldRoot = absNoteVals[chordObj.root];
  let absOldThird = absNoteVals[chordObj.third];
  let absOldFifth = absNoteVals[chordObj.fifth];

  console.log(absOldRoot, absOldThird, absOldFifth);
  // let oldRootFreq = chordObj.freqs[0];
  // let oldThirdFreq = chordObj.freqs[1];
  // let oldFifthFreq = chordObj.freqs[2];
  // for newTone of newSpelling {
  // findBestChoices()
  // }
}

// function findBestChoices(oldFreq, newTone) { }

// TODO:
// - match each 'new note' to its given array values of freqs (`octaveFreqs`)
// - make an object of comparison values to 'old note' freqs -> helper function:
// -- helper iterates through each 'new note' freq arr to find two 'closest' (one below / 'lower' and one above / 'higher') of EACH 'old note' freq
// -- range plays a factor here: need a flag for "up / down / either" for instances where 'lower' or 'higher' may not exist (grab `next` of whichever DOES exist)
// -- -- this is ESPECIALLY true since we won't allow our full "range" (chords and their tones should probably be within the '2nd'/'3rd' octave range to the '6th' to avoid extremes)
// -- -- maybe use absolute note values to compare 'distance' (in reference to half steps) between notes rather than the actual freq values (which are logarithmic)
