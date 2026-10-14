import { createContext } from "react-router";

/** Verified email of the signed-in family member. Set for every request in workers/app.ts. */
export const userEmailContext = createContext<string>();
