"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { calculateProfileCompletion, UserProfile } from "@/lib/profileCompletion";
import ProfileHeader from "@/components/candidate/ProfileHeader";
import ProfileCompletionStatus from "@/components/candidate/ProfileCompletionStatus";
import PersonalInfoCard from "@/components/candidate/PersonalInfoCard";
import ResumeCard from "@/components/candidate/ResumeCard";
import WorkExperienceCard from "@/components/candidate/WorkExperienceCard";

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  skills?: string;
  resume?: string;
}

export default function CandidateProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com", // This will be read‑only
    phone: "",
    location: "",
    bio: "",
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const pageRef = useRef<HTMLDivElement>(null);

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

  // Build user profile object for completion calculation
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

  // Validation function
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    // Email is read‑only – we assume it is always valid from the backend
    // but we can still check that it exists (should never be empty)
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        newErrors.phone = "Please enter a valid phone number";
      }
    }

    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required";
    } else if (formData.bio.trim().length < 20) {
      newErrors.bio = "Bio must be at least 20 characters";
    }

    if (formData.skills.length === 0) {
      newErrors.skills = "At least one skill is required";
    } else if (formData.skills.length < 3) {
      newErrors.skills = "Please add at least 3 skills";
    }

    if (!resumeFile) {
      newErrors.resume = "Resume is required";
    } else {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (resumeFile.size > maxSize) {
        newErrors.resume = "Resume file size must be less than 5MB";
      }
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(resumeFile.type)) {
        newErrors.resume = "Resume must be a PDF, DOC, or DOCX file";
      }
    }

    return newErrors;
  };

  const isFormValid = () => Object.keys(validateForm()).length === 0;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateForm());
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setErrors((prev) => ({ ...prev, resume: undefined }));
      setTouched((prev) => ({ ...prev, resume: true }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      const updatedSkills = [...formData.skills, skillInput.trim()];
      setFormData((prev) => ({ ...prev, skills: updatedSkills }));
      setSkillInput("");
      setErrors(validateForm());
    }
  };

  const removeSkill = (skill: string) => {
    const updatedSkills = formData.skills.filter((s) => s !== skill);
    setFormData((prev) => ({ ...prev, skills: updatedSkills }));
    setErrors(validateForm());
  };

  const handleSave = () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      bio: true,
      skills: true,
      resume: true,
    });

    if (Object.keys(validationErrors).length === 0) {
      console.log("Saving profile:", { formData, profilePhoto, resumeFile, experiences });
      setIsEditing(false);
      setTouched({});
    } else {
      const firstErrorField = Object.keys(validationErrors)[0];
      document.getElementById(`field-${firstErrorField}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <div ref={pageRef} className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">{particles}</div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <ProfileHeader isEditing={isEditing} setIsEditing={setIsEditing} onSave={handleSave} />

        <ProfileCompletionStatus profileStatus={profileStatus} />

        <div className="space-y-6">
          <PersonalInfoCard
            isEditing={isEditing}
            formData={formData}
            setFormData={setFormData}
            profilePhoto={profilePhoto}
            onPhotoUpload={handlePhotoUpload}
            skillInput={skillInput}
            setSkillInput={setSkillInput}
            onAddSkill={addSkill}
            onRemoveSkill={removeSkill}
            errors={errors}
            touched={touched}
            onBlur={handleBlur}
          />

          <ResumeCard
            isEditing={isEditing}
            resumeFile={resumeFile}
            onResumeUpload={handleResumeUpload}
            errors={errors}
            touched={touched}
          />

          <WorkExperienceCard
            isEditing={isEditing}
            experiences={experiences}
            setExperiences={setExperiences}
          />
        </div>
      </div>
    </div>
  );
}