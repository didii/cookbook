import { test } from 'node:test';

// Needs a browser: the colour of part of the text in the field.
test.todo('recipe-ingredient-editing › Quantity is highlighted while typing');
// Needs a browser: key presses and focus.
test.todo('recipe-ingredient-editing › Enter moves to the next row');
// Needs a browser: key presses and focus.
test.todo('recipe-ingredient-editing › Arrow keys move between rows');
// Needs a browser: the Tab order.
test.todo('recipe-ingredient-editing › Row buttons are one tab stop');
// Needs a browser: key presses, focus and the caret.
test.todo('recipe-ingredient-editing › Alt and arrow move the row');
// Needs a browser: key presses and focus.
test.todo('recipe-ingredient-editing › Backspace removes an empty row');
// Needs a browser: the disabled state of the buttons.
test.todo('recipe-ingredient-editing › Edge rows cannot move out of the list');
// Needs a browser or a screen reader: the live region.
test.todo('recipe-ingredient-editing › Move is announced');
