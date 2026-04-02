import { z } from "zod";

import { courseSchema } from "./site-content";

/** Artefakt aus `scripts/sync-yogaflow-courses.mts`, von `getSiteContent` eingelesen. */
export const yogaflowCoursesFileSchema = z.object({
  syncedAt: z.string(),
  courses: z.array(courseSchema).max(100),
});

export type ParsedYogaflowCoursesFile = z.infer<typeof yogaflowCoursesFileSchema>;

/** Default-Export für `scripts/sync-yogaflow-courses.mts` (tsx/Node); Named Export bleibt für App-Code. */
export default yogaflowCoursesFileSchema;
