import { Link } from "react-router-dom";
import { Workflow, KanbanSquare, MessageSquare, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const features = [
  {
    icon: KanbanSquare,
    title: "Kanban that keeps pace",
    desc: "Drag tasks across Backlog, Todo, In Progress, Review and Done — everyone sees the move instantly.",
  },
  {
    icon: MessageSquare,
    title: "Team chat, built in",
    desc: "Channels and DMs live next to your projects, so context never gets lost in another tab.",
  },
  {
    icon: BarChart3,
    title: "Analytics that explain themselves",
    desc: "Project health shows exactly why a project is at risk — no unexplained scores.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Workflow className="h-4 w-4" />
            </div>
            <span className="font-semibold">Flowbase</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#" className="hover:text-foreground">Pricing</a>
            <a href="#" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild><Link to="/login">Log in</Link></Button>
            <Button size="sm" asChild><Link to="/register">Get started</Link></Button>
          </div>
        </div>
      </header>

      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Manage projects. Collaborate better. Get work done.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Plan projects, manage tasks, chat with your team, and understand your
            productivity — all from one workspace.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/register">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">View demo</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="container pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Flowbase. Built for teams that ship.
        </div>
      </footer>
    </div>
  );
}
