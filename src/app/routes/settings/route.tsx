import { WorkInProgress } from '~app/shared/WorkInProgress';

export function meta() {
  return [{ title: 'Instellingen · Familiekookboek' }];
}

export default function Settings() {
  return <WorkInProgress title="Instellingen" />;
}
