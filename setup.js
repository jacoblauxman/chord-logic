import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url"; // for es module syntax (no global __dirname available, see below)

// import { chordSpellings, enharmonics, noteNames } from "./data.js";
import { noteNames } from "./data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "data.txt");
const fileData = fs.readFileSync(filePath, "utf8");

// provides all data structures to other mods
export const {
  octaveFreqs,
  noteFreqs,
  freqNames,
  absNoteVals,
  absValNotes,
  absByNote,
} = createNotesObjects();

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
