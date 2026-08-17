import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="That address doesn't match any dataroom, folder or share link."
        action={
          <Button asChild variant="brand">
            <Link to="/">Back to your datarooms</Link>
          </Button>
        }
        className="w-full max-w-md"
      />
    </div>
  );
}
