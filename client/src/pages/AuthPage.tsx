import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from "../lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, 'Gebruikersnaam is verplicht'),
  password: z.string().min(1, 'Wachtwoord is verplicht'),
});

const registerSchema = z.object({
  username: z.string().min(1, 'Gebruikersnaam is verplicht'),
  fullName: z.string().min(1, 'Volledige naam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 tekens bevatten'),
  phone: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      fullName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      const result = await loginMutation.mutateAsync(data);
      console.log("Login successful, redirecting to dashboard");
      // Force query invalidation to ensure everything is up-to-date
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      // Ensure we have user data before redirecting
      if (result) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Inloggen mislukt",
        description: "Ongeldige inloggegevens. Probeer opnieuw.",
        variant: "destructive",
      });
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      await registerMutation.mutateAsync(data);
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        title: "Registratie mislukt",
        description: "Er is een fout opgetreden bij het registreren.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <img src="/Logo.jpg" alt="Spar-Tec Logo" className="h-20" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">PlanningSync</h2>
            <p className="mt-2 text-sm text-gray-600">
              Beheer uw werkbonnen, materialen en klanten op één plek
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Inloggen</TabsTrigger>
              <TabsTrigger value="register">Registreren</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Log in op uw account</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gebruikersnaam</FormLabel>
                            <FormControl>
                              <Input placeholder="Gebruikersnaam" {...field} />
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
                              <Input type="password" placeholder="Wachtwoord" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? 'Bezig met inloggen...' : 'Inloggen'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Maak een nieuw account</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gebruikersnaam</FormLabel>
                            <FormControl>
                              <Input placeholder="Gebruikersnaam" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Volledige naam</FormLabel>
                            <FormControl>
                              <Input placeholder="Volledige naam" {...field} />
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
                            <FormLabel>E-mailadres</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="E-mailadres" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefoonnummer</FormLabel>
                            <FormControl>
                              <Input placeholder="Telefoonnummer" {...field} />
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
                              <Input type="password" placeholder="Wachtwoord" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? 'Bezig met registreren...' : 'Registreren'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 h-full w-full bg-primary flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl font-bold mb-4">Welkom bij PlanningSync</h1>
            <p className="text-xl mb-6">
              Het beheerplatform voor installatiebedrijven. Beheer uw werkbonnen, facturen, materialen en klanten op één centraal punt.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center">
                <div className="rounded-full bg-white bg-opacity-20 p-2 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Werkbonnenbeheer</h3>
                  <p className="text-white text-opacity-80">Maak, bewerk en volg werkbonnen eenvoudig op</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="rounded-full bg-white bg-opacity-20 p-2 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Facturatie</h3>
                  <p className="text-white text-opacity-80">Genereer eenvoudig facturen op basis van werkbonnen</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="rounded-full bg-white bg-opacity-20 p-2 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Klantenbeheer</h3>
                  <p className="text-white text-opacity-80">Houd contactgegevens en werkgeschiedenis bij</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}