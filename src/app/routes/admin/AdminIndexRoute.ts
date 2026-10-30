import { redirect } from 'react-router';

/** `/beheer` opens on the rules page. */
export function loader() {
  return redirect('/beheer/herkenning');
}
