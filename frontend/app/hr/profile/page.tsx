"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
<<<<<<< HEAD
import { User, Mail, Phone, Building, Save, Upload } from "lucide-react";
=======
import { User, Mail, Phone, Building, Save, Upload, Sparkles } from "lucide-react";
>>>>>>> 843d47b8eb622fe5c116fb34bf1d6b17de7c4921

export default function HRProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "HR Manager",
    email: "hr@company.com",
    phone: "+1 234 567 8900",
    company: "TechCorp Inc.",
    department: "Human Resources",
  });

  const handleSave = () => {
    console.log("Saving profile:", formData);
    setIsEditing(false);
  };

  return (
<<<<<<< HEAD
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Profile</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your account information</p>
      </div>

      <Card className="max-w-3xl border-slate-200 dark:border-slate-800">
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
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>HR</AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
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
              <Label>Company</Label>
              {isEditing ? (
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Building className="h-4 w-4 text-slate-500" />
                  {formData.company}
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Department</Label>
              {isEditing ? (
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              ) : (
                <p className="text-slate-900 dark:text-white">{formData.department}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
=======
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            My Profile
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal information and account settings
          </p>
        </div>

        {/* Profile Card */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-slate-900 dark:text-white">
                Personal Information
              </CardTitle>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    size="sm"
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-indigo-500/20">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-xl">
                    {formData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md"
                  >
                    <Upload className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </Button>
                )}
              </div>
              {isEditing && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Click the upload button to change your profile photo
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  Full Name
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                    <User className="h-4 w-4 text-indigo-500" />
                    <span>{formData.name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  Email
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                    <Mail className="h-4 w-4 text-indigo-500" />
                    <span>{formData.email}</span>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  Phone
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                    <Phone className="h-4 w-4 text-indigo-500" />
                    <span>{formData.phone}</span>
                  </div>
                )}
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  Company
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="pl-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                    <Building className="h-4 w-4 text-indigo-500" />
                    <span>{formData.company}</span>
                  </div>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="department" className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  Department
                </Label>
                {isEditing ? (
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                  />
                ) : (
                  <div className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                    {formData.department}
                  </div>
                )}
              </div>
            </div>

            {/* Optional: Add a note about when the profile was last updated */}
            {!isEditing && (
              <div className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                Last updated: Today at 10:30 AM
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
>>>>>>> 843d47b8eb622fe5c116fb34bf1d6b17de7c4921
