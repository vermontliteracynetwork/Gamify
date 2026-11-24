// Theme ideas for the beta (owner, 2026-11-24): "recommendations for concepts
// of themes ... but I also want recommendations for different materials". Shown
// on the beta classroom kit (/beta-kit) and used for the regular theme emails.
// Original concepts only: no other company's, game's or toy's name.
export interface ThemeIdea { game: string; title: string; idea: string; material: string; older?: boolean }

export const THEME_IDEAS: ThemeIdea[] = [
  { game: 'Question Tracker', title: 'Flower tracker', idea: 'Every right answer grows a flower in the class garden until it is in full bloom.', material: 'Pressed real flowers and leaves, or flowers sculpted from modeling dough' },
  { game: 'Question Tracker', title: 'Constellation map', idea: 'Each right answer lights a star and joins it to the last one, drawing the class constellation.', material: 'Foil and glitter glue on black paper', older: true },
  { game: 'Game Show', title: 'Museum night', idea: 'Every card is a picture frame on the museum wall; open one to reveal the question behind the painting.', material: 'Tiny paintings on cardboard squares, photographed one by one' },
  { game: 'Game Show', title: 'Newsroom', idea: 'Cards are breaking-news headlines; teams are the rival news desks.', material: 'Collage from newspaper and magazine cutouts', older: true },
  { game: 'Board Game', title: 'Nature trail', idea: 'The trail winds through a forest the class built: real leaves for the spaces, twigs for the bridges.', material: 'Leaves, sticks, stones and moss, arranged and photographed from above' },
  { game: 'Match Three', title: 'Bakery case', idea: 'Match the pastries the class baked, out of clay.', material: 'Clay or modeling dough, painted' },
  { game: 'Match Three', title: 'Chemistry lab', idea: 'Match glowing beakers, flasks and atoms.', material: 'Digital design, or textured paint on cut card', older: true },
  { game: 'Four in a Row', title: 'Clay coins', idea: 'Each team drops coins they pressed and stamped themselves.', material: 'Air-dry clay pressed with buttons, keys or leaves for texture' },
  { game: 'Bubble Pop', title: 'Recycled reef', idea: 'Bubbles float through a reef made of bottle caps and cardboard coral.', material: 'Bottle caps, cardboard, tissue paper and other recycled things' },
  { game: 'Bowling', title: 'Bottle bowling', idea: 'The pins are bottles the class decorated; the lane is a cardboard runway.', material: 'Decorated plastic bottles and cardboard, photographed' },
  { game: 'Bowling', title: 'Stadium night', idea: 'A bright stadium lane with team pennants and a scoreboard crowd.', material: 'Fabric scraps and felt for pennants, digital for the lane', older: true },
  { game: 'Territory', title: 'Rocket ship and space rocks', idea: 'Rocket ships claim planets while dodging drifting space rocks.', material: 'Painted foam or pebbles for the space rocks, foil for the ships' },
];

// Materials to try, with a photo tip (physical design, owner 2026-11-24).
export const MATERIALS: { name: string; tip: string }[] = [
  { name: 'Clay and modeling dough', tip: 'Shape each piece about palm size, let it set, and photograph it from straight above.' },
  { name: 'Textured paint', tip: 'Puffy paint, sand or salt mixed in, finger paint and sponge prints all show up well in a photo.' },
  { name: 'Collage', tip: 'Magazine cutouts, fabric, yarn, tissue paper and felt. Glue flat so nothing casts big shadows.' },
  { name: 'Recycled things', tip: 'Bottle caps, cardboard, egg cartons, paper rolls and lids. Clean labels off any brand names first.' },
  { name: 'Nature', tip: 'Leaves, sticks, stones, flowers, pinecones and shells. Arrange them on plain paper and photograph outside in daylight.' },
  { name: 'Pencils, crayons, markers and paint', tip: 'Print the blank pages and draw inside each outline; the corner squares help Gamify find each piece.' },
  { name: 'Digital design', tip: 'Any drawing or design app: download the digital design file, design each page and save it as a PNG.' },
];

export const PHOTO_TIPS = [
  'Put the piece on plain white paper.',
  'Use bright, even light, like a window or the outdoors, without a flash.',
  'Shoot from straight above and fill the frame with the piece.',
  'Keep faces, names and brand logos out of every photo.',
];
