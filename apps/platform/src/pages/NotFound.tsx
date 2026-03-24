import { Button } from "@axeVision/shared/components/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 animate-slide-up">
        {/* 404 Number */}
        <div className="relative">
          <h1 className="text-9xl font-bold font-heading text-primary opacity-10">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-2xl font-semibold text-foreground">
              Page Not Found
            </h2>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 max-w-md mx-auto">
          <p className="text-muted-foreground text-lg">
            Oops! The page you're looking for seems to have wandered off into the digital void.
          </p>
          <p className="text-sm text-muted-foreground">
            Don't worry, even the best accessibility scanners can't find this one!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild variant="outline">
            <Link to="/dashboard">
              📊 Go to Dashboard
            </Link>
          </Button>
        </div>

        {/* Fun Accessibility Note */}
        <div className="pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">
            This page is fully accessible! (Unlike the one you were looking for) 😉
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;