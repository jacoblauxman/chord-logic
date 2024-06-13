import { chordSpellings, enharmonics } from "./data.js";
import { absByNote, absValNotes } from "./setup.js";

export function parseName(chordName) {
  let name;
  let qual;
  let checked = false;

  // enharmonics edge case (think you're funny with the inputs? no Cb / B# or E# / Fb for me, please!)
  switch (chordName.slice(0, 2)) {
    case "B#":
      name = "C";
      checked = true;
      break;
    case "Cb":
      name = "B";
      checked = true;
      break;
    case "E#":
      name = "F";
      checked = true;
      break;
    case "Fb":
      name = "E";
      checked = true;
      break;
    default:
      break;
  }

  // handling enharmonic / natural spelling
  if (chordName.includes("#") && !checked) {
    [name, qual] = [chordName.slice(0, 1), chordName.slice(2)];
    name = name.toUpperCase() + "#";
    name = `${name}/${enharmonics[name]}`;
  } else if (chordName.includes("b") && !checked) {
    [name, qual] = [chordName.slice(0, 1), chordName.slice(2)];
    name = name.toUpperCase() + "b";
    name = `${enharmonics[name]}/${name}`;
  } else if (!checked) {
    [name, qual] = [chordName.slice(0, 1), chordName.slice(1)];
  } else {
    qual = chordName.slice(2);
  }

  // default to major (as you do)
  if (qual === "") {
    // no need for `undefined/null` check(?)
    qual = "maj";
  } else if (qual === "m" || qual === "-") {
    qual = "min";
  } else if (qual === "+") {
    qual = "aug";
  } else if (qual === "o" || qual === "0" || qual === "°" || qual === "ø") {
    qual = "dim";
  }

  return [name, qual];
}

// arr of general 'note names' (no oct)
export function getChordSpelling(chord) {
  let spelling = chordSpellings[chord];

  return spelling;
}

// arr of all possible new abs value choices (`[0, 4, 7, 11, ... etc]`) re: new chord (tones)
export function getNewAbsChoices(newSpelling) {
  let newAbsChoices = [];
  for (const noteName of newSpelling) {
    newAbsChoices = newAbsChoices.concat(absByNote[noteName]);
  }

  return newAbsChoices;
}

// returns new arr of abs vals of new chord tones (the "best" `absVal`s)
export function voiceLead(oldAbsVals, newAbsChoices) {
  // grab ds of 'higher'/'lower' best choices (2 ea.)
  const bestChoices = {};
  for (const oldVal of oldAbsVals) {
    bestChoices[oldVal] = calculateBestChoices(oldVal, newAbsChoices);
  }

  // configurations of all possible voice leading options (based off old chord vals)
  const configurations = generateLeads(bestChoices);

  // validate and organize data - 'lowest diff wins'
  const validConfigs = configurations.filter(
    (config) => !hasDuplicateNote(config),
  );
  const sortedConfigs = validConfigs.sort((a, b) => a.diff - b.diff);

  return sortedConfigs[0].vals;
}

// determines 2 closest 'lower'/'higher' best choices (re: `newAbsChoices` for each `oldVal`)
export function calculateBestChoices(oldVal, newAbsChoices) {
  // defaults (for iter mutations)
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

// provides all possible configurations of voice leading choices
export function generateLeads(bestChoices) {
  const choiceKeys = Object.keys(bestChoices);
  let configurations = [{ vals: [], diff: 0 }];

  for (const key of choiceKeys) {
    const choices = [
      bestChoices[key].low.first.val,
      bestChoices[key].low.second.val,
      bestChoices[key].hi.first.val,
      bestChoices[key].hi.second.val,
    ].filter((choice) => choice.val !== null);

    const diffs = [
      bestChoices[key].low.first.diff,
      bestChoices[key].low.second.diff,
      bestChoices[key].hi.first.diff,
      bestChoices[key].hi.second.diff,
    ].filter((diff) => diff.diff !== null);

    configurations = generateConfigs(configurations, choices, diffs);
  }

  return configurations;
}

// helper to expand current configurations with all possible choices + diffs
export function generateConfigs(currentConfigs, choices, diffs) {
  const newConfigs = [];
  for (const config of currentConfigs) {
    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      const diff = diffs[i];

      newConfigs.push({
        vals: [...config.vals, choice],
        diff: config.diff + diff,
      });
    }
  }

  return newConfigs;
}

// helper for removing invalid new chord configs (ie. no D5 powerchords or something like 'DF#F#' spellings)
export function hasDuplicateNote(config) {
  const noteSet = new Set();

  for (const val of config.vals) {
    const noteName = absValNotes[val].slice(0, -1);
    if (noteSet.has(noteName)) {
      return true;
    }

    noteSet.add(noteName);
  }

  return false;
}
