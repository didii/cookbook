import { createContext } from 'react-router';

/** Verified email of the signed-in family member. Set for every request in workers/app.ts. */
export const userEmailContext = createContext<string>();

/** Whether this key (the member's email) may fetch another page or image for an import now. Set for every request in workers/handler.ts. */
export const importAllowContext = createContext<(key: string) => Promise<boolean>>();

/** Worker bindings (D1 etc.). Set for every request in workers/app.ts. */
export const envContext = createContext<Env>();
