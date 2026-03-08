"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
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
    role: z.enum(["candidate", "hr"], { message: "Please select your role" }),
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
      message: "Company name is required for recruiters",
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
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "" as any,
      company: "",
    },
  });

  const selectedRole = watch("role");
  const formValues = watch();

  // Check if current step is valid
  const isStepValid = () => {
    switch(currentStep) {
      case 1:
        return formValues.fullName && formValues.email && formValues.password;
      case 2:
        // Force explicit role selection - cannot proceed without selecting
        if (!formValues.role) {
          return false;
        }
        if (formValues.role === "hr") {
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

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const isEmployer = data.role === "hr";
      
      // Register user
      const userData = await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        is_employer: isEmployer,
        company: data.company,
      });

      // Auto-login after registration
      const authResponse = await loginUser({
        email: data.email,
        password: data.password,
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

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#F9F6F0]">
      {/* Artistic background – organic shapes with noise texture */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#E6D7C3] rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D9C5B3] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-20 w-[500px] h-[500px] bg-[#C7B5A0] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Subtle paper texture overlay */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none" />

      {/* Main card – refined glassmorphism */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden backdrop-blur-xl bg-white/40 border border-white/50 shadow-2xl"
      >
        {/* Left side – artistic branding */}
        <div className="relative hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-[#F1E9E0]/80 to-[#E5D9CF]/80 backdrop-blur-sm">
          {/* Abstract ink-like shapes */}
          <div className="absolute inset-0 opacity-20">
            <svg className="absolute top-10 left-10 w-64 h-64" viewBox="0 0 200 200" fill="none">
              <path d="M50 100C50 70 70 50 100 50C130 50 150 70 150 100C150 130 130 150 100 150C70 150 50 130 50 100Z" fill="#B8915C" />
              <circle cx="120" cy="80" r="40" fill="#C17C5A" />
            </svg>
          </div>

          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="font-serif text-4xl font-medium tracking-tight text-[#2D2A24] mb-2"
            >
              HireFlow
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-lg text-[#4A443C] leading-relaxed max-w-sm"
            >
              Join the future of hiring.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mt-8 h-px w-16 bg-[#B8915C]/40"
            />
          </div>

          {/* Step indicator with artistic flair */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep >= 1 ? 'bg-[#B8915C] text-white' : 'bg-white/60 text-[#5A534A] border border-[#D6CDC2]'
              }`}>
                1
              </div>
              <div>
                <p className={`text-sm font-medium ${currentStep >= 1 ? 'text-[#2D2A24]' : 'text-[#5A534A]'}`}>
                  Account details
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep >= 2 ? 'bg-[#B8915C] text-white' : 'bg-white/60 text-[#5A534A] border border-[#D6CDC2]'
              }`}>
                2
              </div>
              <div>
                <p className={`text-sm font-medium ${currentStep >= 2 ? 'text-[#2D2A24]' : 'text-[#5A534A]'}`}>
                  Role selection
                </p>
              </div>
            </div>
          </motion.div>

          {/* Hand-drawn signature element */}
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
            className="absolute bottom-12 right-12 w-24 h-24 opacity-20"
          >
            <svg viewBox="0 0 100 100" fill="none" stroke="#2D2A24" strokeWidth="1">
              <path d="M20 80 Q 40 20, 80 30" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>

        {/* Right side – form */}
        <div className="p-6 lg:p-10 backdrop-blur-xl bg-white/70">
          <div className="max-w-md mx-auto w-full">
            {/* Mobile logo */}
            <div className="lg:hidden mb-6">
              <h1 className="font-serif text-3xl font-medium text-[#2D2A24]">HireFlow</h1>
            </div>

            {/* Header with step indicator */}
            <div className="mb-6">
              <h2 className="text-xl font-medium text-[#2D2A24]">
                Step {currentStep} of {totalSteps}
              </h2>
              <p className="text-sm text-[#5A534A]">
                {currentStep === 1 && "Create your account"}
                {currentStep === 2 && "Select your role"}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
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
                      <Label htmlFor="fullName" className="text-sm font-medium text-[#4A443C]">
                        Full name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A69A8C]" />
                        <Input
                          id="fullName"
                          {...register("fullName")}
                          placeholder="John Doe"
                          className="pl-10 h-11 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-xl transition-all placeholder:text-[#A69A8C]"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-sm text-red-600">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-[#4A443C]">
                        Work email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A69A8C]" />
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="name@company.com"
                          className="pl-10 h-11 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-xl transition-all placeholder:text-[#A69A8C]"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-[#4A443C]">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A69A8C]" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          {...register("password")}
                          placeholder="••••••••"
                          className="pl-10 h-11 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-xl transition-all placeholder:text-[#A69A8C] pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A69A8C] hover:text-[#5A534A] text-sm"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-600">{errors.password.message}</p>
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
                      <Label className="text-sm font-medium text-[#4A443C]">I am a</Label>
                      <Controller
                        control={control}
                        name="role"
                        render={({ field: { value, onChange } }) => (
                          <Select value={value || ""} onValueChange={(newValue) => {
                            onChange(newValue);
                          }}>
                            <SelectTrigger className={`h-11 bg-white/60 backdrop-blur-sm rounded-xl text-[#2D2A24] ${
                              errors.role ? 'border-red-300 border-2' : 'border-[#D6CDC2]'
                            }`}>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="candidate">👤 Candidate - Find your next opportunity</SelectItem>
                              <SelectItem value="hr">🏢 Recruiter / HR - Hire talented candidates</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.role && (
                        <p className="text-sm text-red-600 font-medium">⚠️ {errors.role.message}</p>
                      )}
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
                          <Label htmlFor="company" className="text-sm font-medium text-[#4A443C]">
                            Company name
                          </Label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A69A8C]" />
                            <Input
                              id="company"
                              {...register("company")}
                              placeholder="Acme Inc."
                              className="pl-10 h-11 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-xl transition-all placeholder:text-[#A69A8C]"
                            />
                          </div>
                          {errors.company && (
                            <p className="text-sm text-red-600">{errors.company.message}</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="mt-6 space-y-3">
                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1 h-11 border-[#D6CDC2] text-[#4A443C] hover:bg-white/80 rounded-xl"
                    >
                      Back
                    </Button>
                  )}
                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid()}
                      className="flex-1 h-11 bg-[#B8915C] hover:bg-[#9F7A4F] text-white rounded-xl shadow-lg shadow-[#B8915C]/20 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!isStepValid() || isSubmitting}
                      className="flex-1 h-11 bg-[#B8915C] hover:bg-[#9F7A4F] text-white rounded-xl shadow-lg shadow-[#B8915C]/20 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Account <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Artistic sign-in link */}
                <div className="relative pt-4">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 flex justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-[#B8915C]/30" />
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <span className="text-sm text-[#5A534A]">Already have an account?</span>
                    <Link
                      href="/login"
                      className="group relative inline-flex items-center gap-1 text-[#B8915C] hover:text-[#9F7A4F] font-medium transition-colors"
                    >
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      <svg
                        className="absolute -bottom-1 left-0 w-full h-2"
                        viewBox="0 0 60 8"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M0 6 Q 15 2, 30 6 T 60 6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          className="opacity-50"
                        />
                      </svg>
                    </Link>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <svg width="40" height="12" viewBox="0 0 40 12" fill="none">
                      <path d="M2 10 L20 2 L38 10" stroke="#B8915C" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
                    </svg>
                  </div>
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center text-sm text-slate-600 dark:text-slate-400"
              >
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                >
                  Sign in
                </Link>
              </motion.p>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Custom keyframes for blob animation */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}