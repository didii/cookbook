import { browserStorage, clearDraft, draftKeyField, type DraftStorage } from '~app/lib/draftStore';

/**
 * The `clientAction` of both editor routes. It calls the server action and removes the draft that the form named (`draftKeyField`) when the save succeeded.
 * A successful save is the server redirecting, which the call raises as a thrown redirect `Response`; a refused save is returned as data and keeps the draft.
 */
export async function endDraftAfterSave<T>(
  { request, serverAction }: { request: Request; serverAction: () => Promise<T> },
  storage: DraftStorage | undefined = browserStorage(),
): Promise<T> {
  const key = (await request.clone().formData()).get(draftKeyField);
  try {
    return await serverAction();
  } catch (thrown) {
    if (typeof key === 'string' && thrown instanceof Response && thrown.status >= 300 && thrown.status < 400) clearDraft(storage, key);
    throw thrown;
  }
}
