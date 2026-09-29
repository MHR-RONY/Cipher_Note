import type { Request } from "express";

export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const positiveInt = (raw: unknown, fallback: number): number => {
  if (typeof raw !== "string") return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

export const paginate = (req: Request): Pagination => {
  const page = positiveInt(req.query["page"], 1);
  const limit = Math.min(positiveInt(req.query["limit"], DEFAULT_LIMIT), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
};

export const paginated = <T>(data: T[], total: number, { page, limit }: Pagination): Paginated<T> => ({
  data,
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
});
