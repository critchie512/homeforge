import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <h1 className="font-display text-xl font-semibold" data-testid="text-404-title">
              Page not found
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            That page doesn't exist. Head back to the start and begin a new table project.
          </p>
          <Button asChild className="mt-6" data-testid="button-404-home">
            <Link href="/">Back to NestForge Studio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
