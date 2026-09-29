import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

// Signature-only placeholder so the route owners can mount these in parallel.
// T4 replaces this whole file.
export const usersGroupedByInterests = asyncHandler(async () => {
  throw new HttpError(501, "Not implemented");
});

export const postsByAuthor = asyncHandler(async () => {
  throw new HttpError(501, "Not implemented");
});
