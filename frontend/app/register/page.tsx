"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Calendar, 
  Building, 
  Briefcase,
  Upload,
  X,
  CheckCircle,
  FileText,
  Loader2,
  ChevronRight
} from "lucide-react";

// Define validation schema with Zod
const experienceSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

const formSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    role: z.enum(["candidate", "hr"]),
    company: z.string().optional(),
    skills: z.string().optional(),
    experiences: z.array(experienceSchema).optional(),
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
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      dateOfBirth: "",
      role: "candidate",
      company: "",
      skills: "",
      experiences: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "experiences",
  });

  const selectedRole = watch("role");
  const formValues = watch();

  // Check if current step is valid
  const isStepValid = () => {
    switch(currentStep) {
      case 1:
        return formValues.fullName && formValues.email && formValues.password && formValues.dateOfBirth;
      case 2:
        return true; // Role is always selected
      case 3:
        return true; // Resume is optional
      case 4:
        return true; // Experiences are optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps && isStepValid()) {
      // Skip steps 3 and 4 for HR users
      if (selectedRole === "hr" && currentStep === 2) {
        // Submit form directly for HR
        handleSubmit(onSubmit)();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setResumeFile(file);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
      }
    }, 200);
  };

  const removeFile = () => {
    setResumeFile(null);
    setUploadProgress(0);
    setUploadError(null);
  };

  const onSubmit = (data: FormData) => {
    console.log("Form data:", { ...data, resume: resumeFile });
    // Redirect based on role
    if (data.role === "hr") {
      window.location.href = "/hr";
    } else {
      window.location.href = "/candidate";
    }
  };

  // Floating orbs animation (same as login page)
  const floatingOrb = (delay: number) => ({
    animate: {
      y: [0, -20, 0],
      x: [0, 10, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating orbs - same as login page */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          x: [0, -10, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-20 right-10 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl -z-10"
      />

      {/* Main container - split layout like modern SaaS sites [citation:9] */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Left side - Brand/Value proposition */}
        <div className="relative hidden lg:block bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 overflow-hidden">
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

              {/* Progress steps - visual indicator [citation:5] */}
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
                      Role & company
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 3 ? 'bg-white text-indigo-600' : 'bg-white/20 text-white'
                  }`}>
                    3
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${currentStep >= 3 ? 'text-white' : 'text-white/60'}`}>
                      Upload resume
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 4 ? 'bg-white text-indigo-600' : 'bg-white/20 text-white'
                  }`}>
                    4
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${currentStep >= 4 ? 'text-white' : 'text-white/60'}`}>
                      Experience
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

        {/* Right side - Multi-step form */}
        <div className="p-6 lg:p-8 bg-white dark:bg-slate-900">
          <div className="max-w-md mx-auto w-full">
            {/* Mobile logo */}
            <div className="lg:hidden mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                HireFlow
              </h1>
            </div>

            {/* Header with step indicator */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Step {currentStep} of {totalSteps}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {currentStep === 1 && "Create your account"}
                {currentStep === 2 && "Tell us about your role"}
                {currentStep === 3 && "Upload your resume (optional)"}
                {currentStep === 4 && "Add your experience"}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
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

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="dateOfBirth"
                          type="date"
                          {...register("dateOfBirth")}
                          className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                        />
                      </div>
                      {errors.dateOfBirth && (
                        <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
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

                    {selectedRole === "candidate" && (
                      <div className="space-y-2">
                        <Label htmlFor="skills">Skills (comma separated)</Label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="skills"
                            {...register("skills")}
                            placeholder="React, Node.js, TypeScript"
                            className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Resume Upload - Only for Candidates */}
                {currentStep === 3 && selectedRole === "candidate" && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-4">
                      <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
                          isDragging
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                            : resumeFile
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        
                        <div className="text-center">
                          {!resumeFile ? (
                            <>
                              <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Drag & drop your resume here, or click to browse
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Supports PDF, DOC, DOCX (max 5MB)
                              </p>
                            </>
                          ) : (
                            <div className="space-y-2">
                              {isUploading ? (
                                <>
                                  <FileText className="mx-auto h-8 w-8 text-indigo-500 animate-pulse" />
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Uploading: {resumeFile.name}
                                  </p>
                                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
                                      style={{ width: `${uploadProgress}%` }}
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {resumeFile.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {(resumeFile.size / 1024).toFixed(1)} KB
                                  </p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={removeFile}
                                    className="text-destructive hover:text-destructive/80"
                                  >
                                    <X className="h-4 w-4 mr-1" /> Remove
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {uploadError && (
                        <p className="text-sm text-destructive text-center">{uploadError}</p>
                      )}

                      <p className="text-xs text-center text-slate-500">
                        Your resume will be parsed by our AI to auto-fill your profile
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Experience - Only for Candidates */}
                {currentStep === 4 && selectedRole === "candidate" && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {fields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="relative p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>

                        <div className="space-y-3">
                          <Input
                            {...register(`experiences.${index}.jobTitle` as const)}
                            placeholder="Job title"
                            className="bg-white dark:bg-slate-900"
                          />
                          <Input
                            {...register(`experiences.${index}.company` as const)}
                            placeholder="Company"
                            className="bg-white dark:bg-slate-900"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="date"
                              {...register(`experiences.${index}.startDate` as const)}
                              className="bg-white dark:bg-slate-900"
                            />
                            <Input
                              type="date"
                              {...register(`experiences.${index}.endDate` as const)}
                              placeholder="End date"
                              className="bg-white dark:bg-slate-900"
                            />
                          </div>
                          <Textarea
                            {...register(`experiences.${index}.description` as const)}
                            placeholder="Description (optional)"
                            rows={2}
                            className="bg-white dark:bg-slate-900"
                          />
                        </div>
                      </motion.div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        append({
                          jobTitle: "",
                          company: "",
                          startDate: "",
                          endDate: "",
                          description: "",
                        })
                      }
                      className="w-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                    >
                      + Add Experience
                    </Button>
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
                      className="flex-1 h-11 border-slate-200 dark:border-slate-700"
                    >
                      Back
                    </Button>
                  )}
                  {currentStep < totalSteps && selectedRole === "candidate" ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid()}
                      className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-600/25"
                    >
                      Continue <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : currentStep === 2 && selectedRole === "hr" ? (
                    <Button
                      type="submit"
                      className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-600/25"
                    >
                      Create Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-600/25"
                    >
                      Create Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>

                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}