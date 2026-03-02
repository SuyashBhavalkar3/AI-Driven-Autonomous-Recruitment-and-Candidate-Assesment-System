"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Building,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { registerUser, loginUser } from "@/lib/api";
import { setAuthToken, setUserRole, setUserData } from "@/lib/auth";

// Define validation schema with Zod
const formSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["candidate", "hr"]),
    company: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "hr" && !data.company) {
        return false;
      }
      return true;
    },
    {
      message: "Company name is required for HR",
      path: ["company"],
    }
  );

type FormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleFromUrl = searchParams.get('role') as 'candidate' | 'hr' | null;
  
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: roleFromUrl || "candidate",
      company: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] =
    useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);

  const selectedRole = watch("role");
  const formValues = watch();

  // Check if current step is valid
  const isStepValid = () => {
    switch(currentStep) {
      case 1:
        return formValues.fullName && formValues.email && formValues.password;
      case 2:
        if (selectedRole === "hr") {
          return formValues.company && formValues.company.trim() !== "";
        }
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps && isStepValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Register user
      const userData = await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
        company: data.company,
      });

      // Auto-login after registration
      const authResponse = await loginUser({
        email: data.email,
        password: data.password,
        role: data.role,
      });

      // Store auth data
      setAuthToken(authResponse.access_token);
      setUserRole(data.role);
      setUserData(userData);

      // Redirect to appropriate dashboard
      router.push(data.role === 'hr' ? '/hr' : '/candidate');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const heading = isEmployerDefault ? "Sign up as HR" : "Create your account";
  const description = isEmployerDefault
    ? "Fill in the details below to start posting jobs."
    : "Let us know who you are so we can get you started.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* left visual same as login for consistency */}
        <div className="relative hidden lg:block bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.2] bg-[size:20px_20px]" />
          
          <div className="relative h-full flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">HireFlow</h2>
              <p className="text-white/80 text-sm">AI-powered recruitment</p>
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-3xl font-bold text-white mb-4">
                  Join the future of hiring
                </h3>
                <p className="text-white/90 text-lg">
                  Create your free account and experience how AI transforms talent acquisition.
                </p>
              </motion.div>

              {/* Progress steps - visual indicator */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 1 ? 'bg-white text-indigo-600' : 'bg-white/20 text-white'
                  }`}>
                    1
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${currentStep >= 1 ? 'text-white' : 'text-white/60'}`}>
                      Account details
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 2 ? 'bg-white text-indigo-600' : 'bg-white/20 text-white'
                  }`}>
                    2
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${currentStep >= 2 ? 'text-white' : 'text-white/60'}`}>
                      Role selection
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial - social proof [citation:5] */}
              <div className="pt-6 border-t border-white/20">
                <p className="text-white/80 text-sm italic">
                  "HireFlow helped us reduce time-to-hire by 40% while finding better-qualified candidates."
                </p>
                <p className="text-white/60 text-xs mt-2">
                  — Naav lihaa konacha
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* right side form */}
        <div className="p-8 lg:p-12 bg-white dark:bg-slate-900">
          <div className="max-w-sm mx-auto w-full">
            <div className="lg:hidden mb-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                HireFlow
              </h1>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                {heading}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {currentStep === 1 && "Create your account"}
                {currentStep === 2 && "Select your role"}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                </div>
              )}
              
              <AnimatePresence mode="wait">
                {/* Step 1: Account Details */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="fullName"
                          {...register("fullName")}
                          placeholder="John Doe"
                          className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Work email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="name@company.com"
                          className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          {...register("password")}
                          placeholder="••••••••"
                          className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password.message}</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Role Selection */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label>I am a</Label>
                      <Controller
                        control={control}
                        name="role"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="candidate">Candidate</SelectItem>
                              <SelectItem value="hr">HR / Recruiter</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <AnimatePresence>
                      {selectedRole === "hr" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2 overflow-hidden"
                        >
                          <Label htmlFor="company">Company name</Label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              id="company"
                              {...register("company")}
                              placeholder="Acme Inc."
                              className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                            />
                          </div>
                          {errors.company && (
                            <p className="text-sm text-destructive">{errors.company.message}</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </motion.div>

              {/* Navigation buttons */}
              <div className="mt-6 space-y-3">
                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1 h-11 border-slate-200 dark:border-slate-700"
                    >
                      Back
                    </Button>
                  )}
                  {(currentStep < totalSteps && selectedRole === "candidate") || (currentStep < 2 && selectedRole === "hr") ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid()}
                      className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-600/25"
                    >
                      Continue <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!isStepValid()}
                      className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-600/25"
                    >
                      Create Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-center text-sm text-slate-600 dark:text-slate-400"
              >
                Already have an account?{' '}
                <Link
                  href={`/login?type=${isEmployerDefault ? 'hr' : 'candidate'}`}
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                >
                  Sign in
                </Link>
              </motion.p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
