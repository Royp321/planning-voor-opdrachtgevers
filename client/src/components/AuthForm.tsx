import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { FaClipboardCheck, FaFileInvoiceDollar, FaCamera } from "react-icons/fa";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "Gebruikersnaam is verplicht"),
  password: z.string().min(1, "Wachtwoord is verplicht"),
});

const registerSchema = z.object({
  username: z.string().min(1, "Gebruikersnaam is verplicht"),
  email: z.string().email("Voer een geldig e-mailadres in"),
  password: z.string().min(6, "Wachtwoord moet minimaal 6 karakters bevatten"),
  confirmPassword: z.string().min(1, "Bevestig uw wachtwoord"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "admin",
      password: "admin123",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const user = await response.json();
      
      toast({
        title: "Ingelogd",
        description: `Welkom terug, ${user.username}!`,
      });
      
      // Redirect to dashboard
      setLocation("/");
    } catch (error) {
      toast({
        title: "Inloggen mislukt",
        description: "Ongeldige inloggegevens. Probeer opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      const { username, email, password } = data;
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const user = await response.json();
      
      toast({
        title: "Account aangemaakt",
        description: "Uw account is succesvol aangemaakt en u bent ingelogd!",
      });
      
      // Redirect to dashboard
      setLocation("/");
    } catch (error) {
      toast({
        title: "Registratie mislukt",
        description: "Er is een fout opgetreden bij het registreren.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl w-full space-y-8 flex flex-col lg:flex-row gap-8">
      {/* Login/Register Panel */}
      <div className="bg-white p-8 rounded-lg shadow-md flex-1">
        <div className="pb-5 border-b border-gray-200 mb-6">
          <h2 className="text-lg font-medium text-primary">
            Log in of registreer om toegang te krijgen tot het volledige systeem.
          </h2>
          <div className="mt-4 flex space-x-4">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                isLogin
                  ? "border-primary text-primary"
                  : "border-transparent hover:border-gray-300 text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setIsLogin(true)}
            >
              Inloggen
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                !isLogin
                  ? "border-primary text-primary"
                  : "border-transparent hover:border-gray-300 text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setIsLogin(false)}
            >
              Registreren
            </button>
          </div>
        </div>

        {/* Login Form */}
        {isLogin ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Inloggen</h3>
            <p className="text-gray-600">
              Voer uw gegevens in om in te loggen bij uw account.
            </p>

            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gebruikersnaam</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="form-input"
                          placeholder="Voer uw gebruikersnaam in"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wachtwoord</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="form-input"
                          placeholder="Voer uw wachtwoord in"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-[#003A66]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Inloggen
                </Button>
              </form>
            </Form>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Registreren</h3>
            <p className="text-gray-600">
              Maak een nieuw account aan om toegang te krijgen tot het systeem.
            </p>

            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gebruikersnaam</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="form-input"
                          placeholder="Kies een gebruikersnaam"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          className="form-input"
                          placeholder="Voer uw e-mailadres in"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wachtwoord</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="form-input"
                          placeholder="Kies een wachtwoord"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wachtwoord bevestigen</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="form-input"
                          placeholder="Bevestig uw wachtwoord"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-[#003A66]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Registreren
                </Button>
              </form>
            </Form>
          </div>
        )}
      </div>

      {/* Features Panel */}
      <div className="bg-white p-8 rounded-lg shadow-md flex-1">
        <h2 className="text-2xl font-bold text-primary mb-6">
          Beheer uw installatieprojecten
        </h2>
        <p className="text-gray-600 mb-8">
          Een compleet systeem voor het beheren van werkbonnen, materialen, facturen
          en klantgegevens voor uw installatiebedrijf.
        </p>

        <div className="space-y-6">
          <div className="flex items-start">
            <div className="bg-[#EBF5FF] p-3 rounded-lg mr-4">
              <FaClipboardCheck className="text-primary text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Werkbon afmelden</h3>
              <p className="text-gray-600">
                Registreer gebruikte materialen en werkuren ter plaatse
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-[#EBF5FF] p-3 rounded-lg mr-4">
              <FaFileInvoiceDollar className="text-primary text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Factuur generatie</h3>
              <p className="text-gray-600">
                Automatische berekeningen van materiaal- en arbeidskosten
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-[#EBF5FF] p-3 rounded-lg mr-4">
              <FaCamera className="text-primary text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Uploads & Foto's</h3>
              <p className="text-gray-600">
                Voeg foto's toe van installaties en upload benodigde documenten
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
