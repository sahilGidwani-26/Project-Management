import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <Compass className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
      <Button asChild className="mt-2">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
