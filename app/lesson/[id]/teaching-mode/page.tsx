import { LessonTeachingMode } from "@/components/presentation-mode/lesson-teaching-mode";

export default async function TeachingModePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonTeachingMode lessonId={id} />;
}

