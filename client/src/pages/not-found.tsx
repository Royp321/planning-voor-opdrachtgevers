import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Pagina niet gevonden</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            De pagina die u probeert te bereiken bestaat niet.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Ga terug naar de <a href="/" className="text-primary hover:underline">homepage</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
