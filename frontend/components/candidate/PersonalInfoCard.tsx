"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Upload, X, Plus } from "lucide-react";
export interface ValidationErrors {
  name?: string;      // Error message for full name field
  email?: string;     // Error message for email (though read-only, still validated)
  phone?: string;     // Error message for phone number
  bio?: string;       // Error message for bio/summary
  skills?: string;    // Error message for skills list
  resume?: string;    // Error message for resume file
}

interface PersonalInfoCardProps {
  isEditing: boolean;
  formData: {
    name: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    skills: string[];
    linkedin_url: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      phone: string;
      location: string;
      bio: string;
      skills: string[];
      linkedin_url: string;
    }>
  >;
  profilePhoto: string;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  skillInput: string;
  setSkillInput: (value: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;
  errors: ValidationErrors;
  touched: Record<string, boolean>;
  onBlur: (field: string) => void;
}

export default function PersonalInfoCard({
  isEditing,
  formData,
  setFormData,
  profilePhoto,
  onPhotoUpload,
  skillInput,
  setSkillInput,
  onAddSkill,
  onRemoveSkill,
  errors,
  touched,
  onBlur,
}: PersonalInfoCardProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="info-card border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20">
      <CardHeader>
        <CardTitle className="font-serif text-xl text-[#2D2A24] dark:text-white">
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo Upload */}
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
                onChange={onPhotoUpload}
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
          {/* Name */}
          <div className="space-y-2" id="field-name">
            <Label className="text-[#4A443C] dark:text-slate-300">
              Full Name <span className="text-red-500">*</span>
            </Label>
            {isEditing ? (
              <>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={() => onBlur("name")}
                  className={`bg-white/50 dark:bg-slate-800/50 border ${
                    touched.name && errors.name ? "border-red-500" : "border-[#D6CDC2] focus:border-[#B8915C]"
                  }`}
                />
                {touched.name && errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-[#2D2A24] dark:text-white">
                <User className="h-4 w-4 text-[#A69A8C]" />
                {formData.name}
              </div>
            )}
          </div>

          {/* Email (read‑only) */}
          <div className="space-y-2">
            <Label className="text-[#4A443C] dark:text-slate-300">
              Email <span className="text-red-500">*</span>
            </Label>
            {isEditing ? (
              <Input
                value={formData.email}
                disabled
                className="bg-gray-100 dark:bg-slate-800/50 border-[#D6CDC2] cursor-not-allowed"
              />
            ) : (
              <div className="flex items-center gap-2 text-[#2D2A24] dark:text-white">
                <Mail className="h-4 w-4 text-[#A69A8C]" />
                {formData.email}
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2" id="field-phone">
            <Label className="text-[#4A443C] dark:text-slate-300">Phone</Label>
            {isEditing ? (
              <>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={() => onBlur("phone")}
                  placeholder="e.g., +1 234 567 8900"
                  className={`bg-white/50 dark:bg-slate-800/50 border ${
                    touched.phone && errors.phone ? "border-red-500" : "border-[#D6CDC2] focus:border-[#B8915C]"
                  }`}
                />
                {touched.phone && errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-[#2D2A24] dark:text-white">
                <Phone className="h-4 w-4 text-[#A69A8C]" />
                {formData.phone || "Not provided"}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-[#4A443C] dark:text-slate-300">Location</Label>
            {isEditing ? (
              <Input
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
              />
            ) : (
              <div className="flex items-center gap-2 text-[#2D2A24] dark:text-white">
                <MapPin className="h-4 w-4 text-[#A69A8C]" />
                {formData.location || "Not provided"}
              </div>
            )}
          </div>

          {/* LinkedIn URL */}
          <div className="space-y-2 md:col-span-2">
            <Label className="text-[#4A443C] dark:text-slate-300">LinkedIn URL</Label>
            {isEditing ? (
              <Input
                value={formData.linkedin_url}
                onChange={(e) => handleChange("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/your-profile"
                className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
              />
            ) : (
              <div className="flex items-center gap-2 text-[#2D2A24] dark:text-white">
                <svg className="h-4 w-4 text-[#A69A8C]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                {formData.linkedin_url || "Not provided"}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2 md:col-span-2" id="field-bio">
            <Label className="text-[#4A443C] dark:text-slate-300">
              Bio / Summary <span className="text-red-500">*</span>
            </Label>
            {isEditing ? (
              <>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  onBlur={() => onBlur("bio")}
                  rows={4}
                  placeholder="Write a brief summary about yourself (minimum 20 characters)..."
                  className={`bg-white/50 dark:bg-slate-800/50 border ${
                    touched.bio && errors.bio ? "border-red-500" : "border-[#D6CDC2] focus:border-[#B8915C]"
                  }`}
                />
                {touched.bio && errors.bio && (
                  <p className="text-sm text-red-600 mt-1">{errors.bio}</p>
                )}
              </>
            ) : (
              <p className="text-[#2D2A24] dark:text-white">{formData.bio || "Not provided"}</p>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-2 md:col-span-2" id="field-skills">
            <Label className="text-[#4A443C] dark:text-slate-300">
              Skills <span className="text-red-500">* (minimum 3)</span>
            </Label>
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), onAddSkill())}
                      placeholder="Type a skill and press Enter"
                      className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                    />
                    <Button type="button" onClick={onAddSkill} size="sm" className="bg-[#B8915C] hover:bg-[#9F7A4F]">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, i) => (
                      <Badge key={i} className="bg-[#B8915C]/10 text-[#B8915C] border-none gap-1">
                        {skill}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() => onRemoveSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                {touched.skills && errors.skills && (
                  <p className="text-sm text-red-600 mt-1">{errors.skills}</p>
                )}
              </>
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
  );
}