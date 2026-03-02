"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Save,
  Upload,
  X,
  Plus,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { calculateProfileCompletion, UserProfile } from "@/lib/profileCompletion";
import { motion } from "framer-motion";
import gsap from "gsap";

interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export default function CandidateProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "",
    location: "",
    bio: "",
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Calculate profile completion
  const userProfile: UserProfile = {
    fullName: formData.name,
    email: formData.email,
    phone: formData.phone,
    location: formData.location,
    bio: formData.bio,
    skills: formData.skills,
    resume: resumeFile ? "uploaded" : "",
    experiences: experiences.map((exp) => ({
      jobTitle: exp.jobTitle,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate,
    })),
  };

  const profileStatus = calculateProfileCompletion(userProfile);

  // Generate decorative particles
  useEffect(() => {
    const newParticles: React.ReactNode[] = [];
    for (let i = 0; i < 15; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      newParticles.push(
        <div
          key={`dot-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-[#B8915C]/10 dark:bg-[#B8915C]/5"
          style={{ top: `${top}%`, left: `${left}%`, filter: "blur(1px)" }}
        />
      );
    }
    setParticles(newParticles);
  }, []);

  // GSAP entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".profile-header", {
        y: -20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });
      gsap.from(".status-card", {
        scale: 0.95,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: "back.out(1.2)",
      });
      gsap.from(".info-card", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) });
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: Date.now().toString(),
        jobTitle: "",
        company: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setExperiences(experiences.map((exp) =>
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const handleSave = () => {
    console.log("Saving profile:", { formData, profilePhoto, resumeFile, experiences });
    setIsEditing(false);
  };

  return (
    <div ref={pageRef} className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles}
      </div>

      <div ref={cardsRef} className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="profile-header mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="font-serif text-4xl font-medium text-[#2D2A24] dark:text-white mb-2 flex items-center gap-2">
              My Profile
              <Sparkles className="h-6 w-6 text-[#B8915C] animate-pulse" />
            </h1>
            <p className="text-[#5A534A] dark:text-slate-400">
              Complete your profile to apply for jobs
            </p>
          </div>
        </motion.div>

        {/* Profile Completion Status */}
        <Card
          className={`status-card mb-6 border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20 ${
            profileStatus.isComplete ? "border-green-200 dark:border-green-800" : "border-amber-200 dark:border-amber-800"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {profileStatus.isComplete ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                )}
                <div>
                  <h3 className="font-semibold text-lg text-[#2D2A24] dark:text-white">
                    {profileStatus.isComplete ? "Profile Complete!" : "Complete Your Profile"}
                  </h3>
                  <p className="text-sm text-[#5A534A] dark:text-slate-400">
                    {profileStatus.isComplete
                      ? "You can now apply for jobs, take assessments, and attend interviews"
                      : `${profileStatus.missingFields.length} field${
                          profileStatus.missingFields.length > 1 ? "s" : ""
                        } remaining`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-3xl font-bold ${
                    profileStatus.isComplete ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {profileStatus.percentage}%
                </div>
              </div>
            </div>
            <Progress
              value={profileStatus.percentage}
              className="h-3 bg-[#D6CDC2] dark:bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-[#B8915C] [&>div]:to-[#9F7A4F]"
            />
            {!profileStatus.isComplete && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profileStatus.missingFields.map((field) => (
                  <Badge key={field} variant="outline" className="border-[#B8915C]/30 text-[#B8915C]">
                    {field}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Personal Information Card */}
          <Card className="info-card border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-xl text-[#2D2A24] dark:text-white">
                  Personal Information
                </CardTitle>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="bg-[#B8915C] hover:bg-[#9F7A4F]"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      size="sm"
                      className="border-[#D6CDC2] text-[#4A443C]"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-[#B8915C]/20">
                  <AvatarImage src={profilePhoto || "https://github.com/shadcn.png"} />
                  <AvatarFallback className="bg-[#F1E9E0] text-[#2D2A24] text-xl">
                    {formData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => document.getElementById("photo-upload")?.click()}
                        className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#4A443C] dark:text-slate-300">Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-[#2D2A24] dark:text-white">
                      <User className="h-4 w-4 text-[#A69A8C]" />
                      {formData.name}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[#4A443C] dark:text-slate-300">Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-[#2D2A24] dark:text-white">
                      <Mail className="h-4 w-4 text-[#A69A8C]" />
                      {formData.email}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[#4A443C] dark:text-slate-300">Phone</Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-[#2D2A24] dark:text-white">
                      <Phone className="h-4 w-4 text-[#A69A8C]" />
                      {formData.phone || "Not provided"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[#4A443C] dark:text-slate-300">Location</Label>
                  {isEditing ? (
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-[#2D2A24] dark:text-white">
                      <MapPin className="h-4 w-4 text-[#A69A8C]" />
                      {formData.location || "Not provided"}
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[#4A443C] dark:text-slate-300">
                    Bio / Summary <span className="text-red-500">*</span>
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      placeholder="Write a brief summary about yourself (minimum 20 characters)..."
                      className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                    />
                  ) : (
                    <p className="text-[#2D2A24] dark:text-white">
                      {formData.bio || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[#4A443C] dark:text-slate-300">
                    Skills <span className="text-red-500">* (minimum 3)</span>
                  </Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                          placeholder="Type a skill and press Enter"
                          className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                        />
                        <Button
                          type="button"
                          onClick={addSkill}
                          size="sm"
                          className="bg-[#B8915C] hover:bg-[#9F7A4F]"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill, i) => (
                          <Badge
                            key={i}
                            className="bg-[#B8915C]/10 text-[#B8915C] border-none gap-1"
                          >
                            {skill}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-red-600"
                              onClick={() => removeSkill(skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.length > 0 ? (
                        formData.skills.map((skill, i) => (
                          <Badge key={i} className="bg-[#B8915C]/10 text-[#B8915C] border-none">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-[#5A534A]">No skills added</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resume Card */}
          <Card className="info-card border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-[#2D2A24] dark:text-white">
                Resume <span className="text-red-500">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resumeFile || !isEditing ? (
                <div className="flex items-center justify-between p-4 bg-[#F1E9E0] dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#B8915C]/10 rounded">
                      <FileText className="h-5 w-5 text-[#B8915C]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#2D2A24] dark:text-white">
                        {resumeFile ? resumeFile.name : "No resume uploaded"}
                      </p>
                      {resumeFile && (
                        <p className="text-sm text-[#5A534A] dark:text-slate-400">
                          {(resumeFile.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label htmlFor="resume-upload">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => document.getElementById("resume-upload")?.click()}
                          className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {resumeFile ? "Update" : "Upload"}
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-[#D6CDC2] rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload-empty"
                  />
                  <Upload className="h-12 w-12 text-[#A69A8C] mx-auto mb-4" />
                  <p className="text-[#2D2A24] dark:text-white mb-2">Upload your resume</p>
                  <p className="text-sm text-[#5A534A] dark:text-slate-400 mb-4">
                    PDF, DOC, or DOCX (max 5MB)
                  </p>
                  <label htmlFor="resume-upload-empty">
                    <Button
                      type="button"
                      onClick={() => document.getElementById("resume-upload-empty")?.click()}
                      className="bg-[#B8915C] hover:bg-[#9F7A4F]"
                    >
                      Choose File
                    </Button>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Experience Card */}
          <Card className="info-card border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-xl text-[#2D2A24] dark:text-white">
                  Work Experience (Optional)
                </CardTitle>
                {isEditing && (
                  <Button
                    onClick={addExperience}
                    size="sm"
                    variant="outline"
                    className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {experiences.length === 0 ? (
                <p className="text-[#5A534A] text-center py-4">No work experience added</p>
              ) : (
                experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 border border-[#D6CDC2] dark:border-slate-700 rounded-lg space-y-3 bg-white/50 dark:bg-slate-800/50"
                  >
                    {isEditing ? (
                      <>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExperience(exp.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[#4A443C] dark:text-slate-300">Job Title</Label>
                            <Input
                              value={exp.jobTitle}
                              onChange={(e) => updateExperience(exp.id, "jobTitle", e.target.value)}
                              placeholder="e.g. Senior Developer"
                              className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                            />
                          </div>
                          <div>
                            <Label className="text-[#4A443C] dark:text-slate-300">Company</Label>
                            <Input
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                              placeholder="e.g. Tech Corp"
                              className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                            />
                          </div>
                          <div>
                            <Label className="text-[#4A443C] dark:text-slate-300">Start Date</Label>
                            <Input
                              type="date"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                              className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                            />
                          </div>
                          <div>
                            <Label className="text-[#4A443C] dark:text-slate-300">End Date</Label>
                            <Input
                              type="date"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                              placeholder="Leave empty if current"
                              className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-[#4A443C] dark:text-slate-300">Description</Label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                              placeholder="Describe your responsibilities and achievements..."
                              rows={3}
                              className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <h4 className="font-semibold text-[#2D2A24] dark:text-white">
                            {exp.jobTitle}
                          </h4>
                          <p className="text-[#5A534A] dark:text-slate-400">{exp.company}</p>
                          <p className="text-sm text-[#A69A8C]">
                            {exp.startDate} - {exp.endDate || "Present"}
                          </p>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-[#5A534A] dark:text-slate-400">
                            {exp.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}