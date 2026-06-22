// Deterministic pastel-ish "spine color" derived from a title, so that
// books without cover art yet still render as a distinct, stable color
// instead of all looking identical.

function spineColorFor(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  const sat = 35 + (hash % 25); // 35-60%
  const light = 28 + (hash % 16); // 28-44%, dark enough for legible white text
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

module.exports = { spineColorFor };
