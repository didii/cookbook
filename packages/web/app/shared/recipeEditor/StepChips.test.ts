import { test } from 'node:test';

// Needs a browser: hover, focus and visibility.
test.todo('recipe-step-chips › A ghost is shown only while its step is active');
// Needs a browser: layout while hovering from one step to another.
test.todo('recipe-step-chips › The add row keeps its space');
// Needs a browser: the colour of the underline in the text.
test.todo('recipe-step-chips › Following and pinned chips are marked differently');
// Needs a browser: pointer hover and the fill of the marked words.
test.todo('recipe-step-chips › Hovering a chip fills its words');

// Needs a browser: the Tab order and arrow keys.
test.todo('recipe-step-chips › Chips are one tab stop');
// Needs a browser: key presses and the popup opening.
test.todo('recipe-step-chips › Enter opens the popup');
