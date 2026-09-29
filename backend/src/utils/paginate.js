const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const paginate = (req) => {
  const rawPage = Number.parseInt(req.query?.page, 10);
  const rawLimit = Number.parseInt(req.query?.limit, 10);

  const page = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);
  const limit = Number.isNaN(rawLimit)
    ? DEFAULT_LIMIT
    : Math.min(MAX_LIMIT, Math.max(1, rawLimit));

  return { page, limit, skip: (page - 1) * limit };
};
