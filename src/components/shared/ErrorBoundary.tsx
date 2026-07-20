import { Component, type ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from "@/components/shared/types";

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              An unexpected error occurred. Your documents are safe — reloading
              usually fixes this.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
            <Button onClick={() => location.reload()}>Reload app</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
