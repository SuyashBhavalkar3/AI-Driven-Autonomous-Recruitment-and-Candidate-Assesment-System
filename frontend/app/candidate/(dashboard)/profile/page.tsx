"use client";
import Loader from '@/components/Loader'

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { calculateProfileCompletion, UserProfile } from "@/lib/profileCompletion";
import { profileAPI } from "@/lib/api";
import ProfileHeader from "@/components/candidate/ProfileHeader";
import ProfileCompletionStatus from "@/components/candidate/ProfileCompletionStatus";
import PersonalInfoCard from "@/components/candidate/PersonalInfoCard";
import ResumeCard from "@/components/candidate/ResumeCard";
import WorkExperienceCard from "@/components/candidate/WorkExperienceCard";
import EducationCard from "@/components/candidate/EducationCard";

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
}

export interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  skills?: string;
  resume?: string;
  profilePhoto?: string;
}

export default function CandidateProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState< | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    skills: [] as string[],
    linkedin_url: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const pageRef = useRef<HTMLDivElement>(null);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await profileAPI.getProfile();
        
        if (profile) {
          setProfileData(profile);
          console.log(profile);
          // Set form data from profile
          setFormData({
            name: profile.name,
            email: profile.email,
            phone: profile.phone || "",
            location: profile.location,
            bio: profile.bio || "",
            skills: profile.skills?.length > 0 ? 
              Object.values(profile.skills[0]).filter(Boolean).join(', ').split(', ') : [],
            linkedin_url: profile.linkedin_url || "",
          });
          
          setProfilePhoto(profile.profile_photo_url || "");
          
          // Set experiences from profile
          setExperiences(profile.experiences?.map(exp => ({
            id: exp.id.toString(),
            jobTitle: exp.job_title,
            company: exp.company_name,
            startDate: exp.start_date,
            endDate: exp.end_date || "",
            description: exp.description || "",
          })) || []);
          
          // Set education from profile
          setEducation(profile.education?.map(edu => ({
            id: edu.id.toString(),
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.field_of_study || "",
            startDate: edu.start_date,
            endDate: edu.end_date || "",
            grade: edu.grade || "",
          })) || []);
        } else {
          // No profile exists, set defaults
          setFormData({
            name: "",
            email: "",
            phone: "",
            location: "",
            bio: "",
            skills: [],
            linkedin_url: "",
          });
        }
        
      } catch (error) {
        console.error('Failed to load profile:', error);
        // Set default values on error
        setFormData({
          name: "",
          email: "",
          phone: "",
          location: "",
          bio: "",
          skills: [],
          linkedin_url: "",
        });
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

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
    resume: resumeFile ? "uploaded" : (profileData?.resume_url ? "uploaded" : ""),
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

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        newErrors.phone = "Please enter a valid phone number";
      }
    } else {
      newErrors.phone = "Phone number is required";
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

    if (!profilePhoto && !profileData?.profile_photo_url) {
      newErrors.profilePhoto = "Profile photo is required";
    }

    if (!resumeFile && !profileData?.resume_url) {
      newErrors.resume = "Resume is required";
    } else if (resumeFile) {
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
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhoto(reader.result as string);
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, profilePhoto: undefined }));
      setTouched((prev) => ({ ...prev, profilePhoto: true }));
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

  const handleSave = async () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      bio: true,
      skills: true,
      resume: true,
      profilePhoto: true,
    });

    if (Object.keys(validationErrors).length === 0) {
      try {
        setLoading(true);
        
        // Resume file is required for new profiles
        if (resumeFile && (profilePhotoFile || profileData?.profile_photo_url)) {
          const formDataToSend = new FormData();
          formDataToSend.append('phone', formData.phone);
          if (formData.linkedin_url) {
            formDataToSend.append('linkedin_url', formData.linkedin_url);
          }
          formDataToSend.append('bio', formData.bio);
          formDataToSend.append('file', resumeFile);
          
          // Handle profile photo
          if (profilePhotoFile) {
            formDataToSend.append('profile_photo', profilePhotoFile);
          } else if (profileData?.profile_photo_url) {
            const response = await fetch(profileData.profile_photo_url);
            const blob = await response.blob();
            formDataToSend.append('profile_photo', blob, 'profile.jpg');
          }

          console.log('Sending FormData with:', {
            phone: formData.phone,
            linkedin_url: formData.linkedin_url,
            bio: formData.bio,
            hasFile: !!resumeFile,
            hasPhoto: !!profilePhotoFile || !!profileData?.profile_photo_url
          });

          const updatedProfile = await profileAPI.uploadResume(formDataToSend);
          setProfileData(updatedProfile);
        } else if (!profileData?.resume_url) {
          throw new Error('Please upload both resume and profile photo');
        }
        
        // Add skills if they don't exist
        if (formData.skills.length > 0 && (!profileData?.skills || profileData.skills.length === 0)) {
          try {
            await profileAPI.addSkill({
              core_competencies: formData.skills.join(', ')
            });
          } catch (error) {
            console.error('Failed to add skills:', error);
          }
        }
        
        // Add experiences if they don't exist
        if (experiences.length > 0 && (!profileData?.experiences || profileData.experiences.length === 0)) {
          for (const exp of experiences) {
            try {
              await profileAPI.addExperience({
                company_name: exp.company,
                job_title: exp.jobTitle,
                start_date: exp.startDate,
                end_date: exp.endDate || undefined,
                description: exp.description || undefined,
                is_current: !exp.endDate,
              });
            } catch (error) {
              console.error('Failed to add experience:', exp, error);
            }
          }
        }
        
        // Add education if they don't exist
        if (education.length > 0 && (!profileData?.education || profileData.education.length === 0)) {
          for (const edu of education) {
            try {
              await profileAPI.addEducation({
                institution: edu.institution,
                degree: edu.degree,
                field_of_study: edu.fieldOfStudy || undefined,
                start_date: edu.startDate,
                end_date: edu.endDate || undefined,
                grade: edu.grade || undefined,
              });
            } catch (error) {
              console.error('Failed to add education:', edu, error);
            }
          }
        }
        
        setIsEditing(false);
        setTouched({});
        
        // Reload profile data
        const refreshedProfile = await profileAPI.getProfile();
        if (refreshedProfile) {
          setProfileData(refreshedProfile);
        }
        
      } catch (error) {
        console.error('Failed to save profile:', error);
        alert(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
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

      {loading ? (
    <Loader/>
      ) : (
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

            <EducationCard
              isEditing={isEditing}
              education={education}
              setEducation={setEducation}
            />
          </div>
        </div>
      )}
    </div>
  );
}
