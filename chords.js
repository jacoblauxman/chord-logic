import {
  voiceLead,
  getChordSpelling,
  getNewAbsChoices,
  parseName,
} from "./utils.js";

import { absNoteVals, absValNotes, freqNames, noteFreqs } from "./setup.js";

// generates first chord provided by input - defaults to octave range of '4-5'
export function getDefaultChord(chordName) {
  const [name, qual] = parseName(chordName);
  let chord = `${name}${qual}`;

  // // TESTING: for working with 'default' chord values (without yet making separate data structure for those spellings):
  let [root, third, fifth] = getChordSpelling(chord);

  console.log(root, third, fifth);
  let rootOct = 4;
  let thirdOct = rootOct;
  let fifthOct = rootOct;
  let rootFreq = noteFreqs[`${root}${rootOct}`];

  if (absNoteVals[`${third}${rootOct}`] < absNoteVals[`${root}${rootOct}`]) {
    thirdOct += 1;
  }

  if (absNoteVals[`${fifth}${rootOct}`] < absNoteVals[`${root}${rootOct}`]) {
    fifthOct += 1;
  }

  let thirdFreq = noteFreqs[`${third}${thirdOct}`];
  let fifthFreq = noteFreqs[`${fifth}${fifthOct}`];

  const absVals = [rootFreq, thirdFreq, fifthFreq].map((freq) => {
    const name = freqNames[`${freq}`];
    return absNoteVals[name];
  });

  let chordObj = {
    chord,
    absVals,
    freqs: [rootFreq, thirdFreq, fifthFreq],
    root: `${root}${rootOct}`,
    third: `${third}${thirdOct}`,
    fifth: `${fifth}${fifthOct}`,
  };

  return chordObj;
}

// generate new chord based off prior chord
export function getNewChord(oldChordObj, newChordName) {
  if (!oldChordObj) {
    console.log("Note: must set default chord first!");
    return;
  }

  // parse
  const [newName, newQual] = parseName(newChordName);
  const newChord = `${newName}${newQual}`;

  // get notes
  const newSpelling = getChordSpelling(newChord);
  const [newRoot, newThird, newFifth] = newSpelling;

  // find best choices + format return data
  const newAbsChoices = getNewAbsChoices(newSpelling);
  const voiceLeading = voiceLead(oldChordObj.absVals, newAbsChoices);
  const newNoteNames = voiceLeading.map((val) => absValNotes[val]);
  const freqs = newNoteNames.map((note) => noteFreqs[note]);

  // define note (name + oct)
  const root =
    newNoteNames[newNoteNames.findIndex((note) => note.includes(newRoot))];
  const third =
    newNoteNames[newNoteNames.findIndex((note) => note.includes(newThird))];
  const fifth =
    newNoteNames[newNoteNames.findIndex((note) => note.includes(newFifth))];

  const newChordObj = {
    chord: newChord,
    absVals: voiceLeading,
    freqs,
    root,
    third,
    fifth,
  };

  return newChordObj;
}
