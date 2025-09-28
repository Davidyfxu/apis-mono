import { DateTime, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const Task = z.object({
  name: Str({ example: "lorem" }),
  slug: Str(),
  description: Str({ required: false }),
  completed: z.boolean().default(false),
  due_date: DateTime(),
});

export const Report = z.object({
  id: z.number().optional(),
  title: Str({ example: "Daily Report 2025-01-15" }),
  date: DateTime(),
  description: Str({ required: false }),
  word_file_url: Str({ required: false }),
  mp3_file_url: Str({ required: false }),
  created_at: DateTime().optional(),
  updated_at: DateTime().optional(),
});

export interface DatabaseReport {
  id: number;
  title: string;
  date: string;
  description: string | null;
  word_file_url: string | null;
  mp3_file_url: string | null;
  created_at: string;
  updated_at: string;
}
