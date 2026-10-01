import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Start Here" },
      {
        name: "description",
        content: "Clean mobile app starter. This is the starting point for a new project.",
      },
    ],
  }),
  component: StartScreen,
});

function StartScreen() {
  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Clean Mobile App Starter
      </p>
      <h1 className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-foreground">
        Project Start Here
      </h1>
      <p className="mt-3 max-w-[17.5rem] text-[15px] leading-relaxed text-muted-foreground">
        This is the starting point for a new project.
      </p>
    </div>
  );
}
