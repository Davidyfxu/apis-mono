import { DateTime, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const Report = z.object({
  id: z.number().optional(),
  title: Str(),
  date: DateTime(),
  description: Str({ required: false }),
  word_file_url: Str({ required: false }),
  mp3_file_url: Str({ required: false }),
  created_at: DateTime().optional(),
  updated_at: DateTime().optional(),
});

// 用于创建报告的schema
export const ReportCreateSchema = Report.omit({
  created_at: true,
  updated_at: true,
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
