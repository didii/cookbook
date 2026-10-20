import { test } from 'node:test';

// Needs a browser: key presses and focus.
test.todo('recipe-step-editing › Enter moves to the next step');
// Needs a browser: key presses and focus.
test.todo('recipe-step-editing › Enter in the last step changes nothing');
// Needs a browser: the disabled state of the buttons.
test.todo('recipe-step-editing › Buttons of the empty step are inert');
// Needs a browser: the disabled state of the buttons.
test.todo('recipe-step-editing › Insert is inert on the empty last step');
// Needs a browser: key presses and focus.
test.todo('recipe-step-editing › Backspace removes an empty step');
// Needs a browser: the disabled state of the buttons.
test.todo('recipe-step-editing › Edge steps cannot move out of the list');
// Needs a browser: pointer events and layout.
test.todo('recipe-step-editing › Step can be dragged');
// Needs a browser or a screen reader: the live region.
test.todo('recipe-step-editing › Step move is announced');
// Needs a browser: the Tab order.
test.todo('recipe-step-editing › Step buttons are one tab stop');
// Needs a browser: key presses, focus and the caret.
test.todo('recipe-step-editing › Alt and arrow move the step');

// Removed by consolidate-step-list-behavior: keep these until the change is archived and the main spec drops the scenarios.
test.todo('recipe-step-editing › Step can be added with the button');
test.todo('recipe-step-editing › Enter at the end starts the next step');
test.todo('recipe-step-editing › Enter elsewhere changes nothing');
