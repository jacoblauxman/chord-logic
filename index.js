import { getDefaultChord, getNewChord } from "./chords.js";

const chordName = process.argv[2];
const chords = process.argv.slice(3);
let prevChordObj = null;

if (chordName) {
  let defaultChord = getDefaultChord(chordName);
  console.log(defaultChord);
  prevChordObj = defaultChord;
  for (let newChord of chords) {
    let newChordObj = getNewChord(prevChordObj, newChord);
    console.log("- Next Chord in Progression -\n", newChordObj);
    prevChordObj = newChordObj;
  }
}

// TODO (TODONE?) NOTES:
// - match each 'new note' to its given array values of freqs (`octaveFreqs`)
// - make an object of comparison values to 'old note' freqs -> helper function:
// -- helper iterates through each 'new note' freq arr to find two 'closest' (one below / 'lower' and one above / 'higher') of EACH 'old note' freq
// -- range plays a factor here: need a flag for "up / down / either" for instances where 'lower' or 'higher' may not exist (grab `next` of whichever DOES exist)
// -- -- this is ESPECIALLY true since we won't allow our full "range" (chords and their tones should probably be within the '2nd'/'3rd' octave range to the '6th' to avoid extremes)
// -- -- maybe use absolute note values to compare 'distance' (in reference to half steps) between notes rather than the actual freq values (which are logarithmic)
// -- eventually, create means to adjust overall chord tone 'range'
