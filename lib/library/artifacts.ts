import { RemoteEntityRepository } from "@/lib/persistence/remote-repository";
import type { PersistenceStatus } from "@/lib/persistence/types";
import { AssessmentSchema } from "@/schemas/assessment";
import { PresentationSchema } from "@/schemas/presentation";
import { WorksheetSchema } from "@/schemas/worksheet";

export type ArtifactLibraryKind = "presentations" | "assessments" | "worksheets";

export type ArtifactLibraryItem = {
  id: string;
  lessonId: string;
  title: string;
  detail: string;
  count: number;
  countLabel: string;
  status: PersistenceStatus;
  updatedAt: string;
};

export async function listArtifactLibrary(kind: ArtifactLibraryKind): Promise<ArtifactLibraryItem[]> {
  if (kind === "presentations") {
    const records = await new RemoteEntityRepository("presentations", PresentationSchema).list({ limit: 100 });
    return records.map((record) => ({
      id: record.id,
      lessonId: record.value.lessonId,
      title: record.value.title,
      detail: record.value.theme.replaceAll("_", " "),
      count: record.value.slides.length,
      countLabel: record.value.slides.length === 1 ? "slide" : "slides",
      status: record.status,
      updatedAt: record.updatedAt,
    }));
  }

  if (kind === "assessments") {
    const records = await new RemoteEntityRepository("assessments", AssessmentSchema).list({ limit: 100 });
    return records.map((record) => ({
      id: record.id,
      lessonId: record.value.lessonId,
      title: record.value.title,
      detail: record.value.difficulty,
      count: record.value.items.length,
      countLabel: record.value.items.length === 1 ? "item" : "items",
      status: record.status,
      updatedAt: record.updatedAt,
    }));
  }

  const records = await new RemoteEntityRepository("worksheets", WorksheetSchema).list({ limit: 100 });
  return records.map((record) => ({
    id: record.id,
    lessonId: record.value.lessonId,
    title: record.value.title,
    detail: record.value.difficulty,
    count: record.value.items.length,
    countLabel: record.value.items.length === 1 ? "activity" : "activities",
    status: record.status,
    updatedAt: record.updatedAt,
  }));
}

export async function deleteArtifactLibraryItem(kind: ArtifactLibraryKind, id: string): Promise<void> {
  if (kind === "presentations") {
    await new RemoteEntityRepository("presentations", PresentationSchema).delete(id);
    return;
  }
  if (kind === "assessments") {
    await new RemoteEntityRepository("assessments", AssessmentSchema).delete(id);
    return;
  }
  await new RemoteEntityRepository("worksheets", WorksheetSchema).delete(id);
}
