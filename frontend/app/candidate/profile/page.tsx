"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, Briefcase, Save, Upload, X, Plus, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { calculateProfileCompletion, UserProfile } from "@/lib/profileCompletion";

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

  // Calculate profile completion
  const userProfile: UserProfile = {
    fullName: formData.name,
    email: formData.email,
    phone: formData.phone,
    location: formData.location,
    bio: formData.bio,
    skills: formData.skills,
    resume: resumeFile ? "uploaded" : "",
    experiences: experiences.map(exp => ({
      jobTitle: exp.jobTitle,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate,
    })),
  };
  
  const profileStatus = calculateProfileCompletion(userProfile);

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
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const addExperience = () => {
    setExperiences([...experiences, {
      id: Date.now().toString(),
      jobTitle: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
    }]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const handleSave = () => {
    console.log("Saving profile:", { formData, profilePhoto, resumeFile, experiences });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Profile</h1>
          <p className="text-slate-600 dark:text-slate-400">Complete your profile to apply for jobs</p>
        </div>

        {/* Profile Completion Status */}
        <Card className={`mb-6 border-2 ${profileStatus.isComplete ? 'border-green-200 dark:border-green-800' : 'border-amber-200 dark:border-amber-800'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {profileStatus.isComplete ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                )}
                <div>
                  <h3 className="font-semibold text-lg">
                    {profileStatus.isComplete ? 'Profile Complete!' : 'Complete Your Profile'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {profileStatus.isComplete 
                      ? 'You can now apply for jobs, take assessments, and attend interviews' 
                      : `${profileStatus.missingFields.length} field${profileStatus.missingFields.length > 1 ? 's' : ''} remaining`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${profileStatus.isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                  {profileStatus.percentage}%
                </div>
              </div>
            </div>
            <Progress value={profileStatus.percentage} className="h-3" />
            {!profileStatus.isComplete && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profileStatus.missingFields.map(field => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profilePhoto || "https://github.com/shadcn.png"} />
                  <AvatarFallback>{formData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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
                      <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('photo-upload')?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <User className="h-4 w-4 text-slate-500" />
                      {formData.name}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <Mail className="h-4 w-4 text-slate-500" />
                      {formData.email}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <Phone className="h-4 w-4 text-slate-500" />
                      {formData.phone}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  {isEditing ? (
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      {formData.location}
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Bio / Summary <span className="text-red-500">*</span></Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      placeholder="Write a brief summary about yourself (minimum 20 characters)..."
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-white">{formData.bio || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Skills <span className="text-red-500">* (minimum 3)</span></Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          placeholder="Type a skill and press Enter"
                        />
                        <Button type="button" onClick={addSkill} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="gap-1">
                            {skill}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.length > 0 ? (
                        formData.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary">{skill}</Badge>
                        ))
                      ) : (
                        <p className="text-slate-500">No skills added</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Resume <span className="text-red-500">*</span></CardTitle>
            </CardHeader>
            <CardContent>
              {resumeFile || !isEditing ? (
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {resumeFile ? resumeFile.name : "No resume uploaded"}
                      </p>
                      {resumeFile && (
                        <p className="text-sm text-slate-500">{(resumeFile.size / 1024).toFixed(1)} KB</p>
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
                        <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('resume-upload')?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          {resumeFile ? 'Update' : 'Upload'}
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload-empty"
                  />
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 mb-2">Upload your resume</p>
                  <p className="text-sm text-slate-500 mb-4">PDF, DOC, or DOCX (max 5MB)</p>
                  <label htmlFor="resume-upload-empty">
                    <Button type="button" onClick={() => document.getElementById('resume-upload-empty')?.click()}>
                      Choose File
                    </Button>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Experience Section */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Work Experience (Optional)</CardTitle>
                {isEditing && (
                  <Button onClick={addExperience} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {experiences.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No work experience added</p>
              ) : (
                experiences.map((exp) => (
                  <div key={exp.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                    {isEditing ? (
                      <>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExperience(exp.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label>Job Title</Label>
                            <Input
                              value={exp.jobTitle}
                              onChange={(e) => updateExperience(exp.id, 'jobTitle', e.target.value)}
                              placeholder="e.g. Senior Developer"
                            />
                          </div>
                          <div>
                            <Label>Company</Label>
                            <Input
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                              placeholder="e.g. Tech Corp"
                            />
                          </div>
                          <div>
                            <Label>Start Date</Label>
                            <Input
                              type="date"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>End Date</Label>
                            <Input
                              type="date"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                              placeholder="Leave empty if current"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Description</Label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                              placeholder="Describe your responsibilities and achievements..."
                              rows={3}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{exp.jobTitle}</h4>
                          <p className="text-slate-600 dark:text-slate-400">{exp.company}</p>
                          <p className="text-sm text-slate-500">
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </p>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">{exp.description}</p>
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
