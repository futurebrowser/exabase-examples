import {
  type CreateBookmarkRequestParentId,
  Kind,
  type ResourceDetail,
  ResourceRootListItemTypeEnum,
} from "@exabase/sdk";
import { getExabase } from "./exabase-server";

const FLASHCARDS_FOLDER_NAME = "Flashcards";

function asParentId(id: string): CreateBookmarkRequestParentId {
  return id as unknown as CreateBookmarkRequestParentId;
}

export type WorkspaceLayout = {
  spaceId: string;
  flashcardsFolderId: string;
};

export async function ensureWorkspaceLayout(
  baseId: string,
): Promise<WorkspaceLayout> {
  const api = getExabase();

  const list = await api.spaces.list({ limit: 50 }, { baseId });
  const spaceRoot = list.data.roots.find(
    (r) => r.type === ResourceRootListItemTypeEnum.Space,
  );

  let spaceId: string;
  if (!spaceRoot) {
    const space = await api.spaces.create(
      { name: "Library", isPrivate: false },
      { baseId },
    );
    spaceId = space.id;
  } else {
    spaceId = spaceRoot.id;
  }

  const folderFilter = await api.resources.filter(
    {
      parentId: spaceId,
      kind: [Kind.Folder],
      name: FLASHCARDS_FOLDER_NAME,
      limit: 10,
    },
    { baseId },
  );

  const existing = folderFilter.resources.find(
    (r): r is Extract<ResourceDetail, { kind: "folder" }> =>
      r.kind === "folder" && r.name === FLASHCARDS_FOLDER_NAME,
  );

  let flashcardsFolderId = existing?.id;
  if (!flashcardsFolderId) {
    const folder = await api.folders.create(
      {
        name: FLASHCARDS_FOLDER_NAME,
        parentId: asParentId(spaceId),
      },
      { baseId },
    );
    flashcardsFolderId = folder.id;
  }

  return { spaceId, flashcardsFolderId };
}
