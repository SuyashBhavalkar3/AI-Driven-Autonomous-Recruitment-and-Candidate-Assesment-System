"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Building, Save, Upload, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-stone-900 dark:text-white flex items-center gap-2">
            My Profile
            <Sparkles className="h-5 w-5 text-amber-500" />
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Manage your personal information and account settings
          </p>
        </div>

        {/* Profile Card */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
          <CardHeader className="border-b border-stone-200 dark:border-stone-800 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-stone-900 dark:text-white">
                Personal Information
              </CardTitle>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg shadow-amber-500/20"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    size="sm"
                    className="border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
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
                <Avatar className="h-24 w-24 ring-4 ring-amber-500/20">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white text-xl">
                    {formData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-md"
                  >
                    <Upload className="h-4 w-4 text-stone-600 dark:text-stone-300" />
                  </Button>
                )}
              </div>
              {isEditing && (
                <div className="text-sm text-stone-500 dark:text-stone-400">
                  Click the upload button to change your profile photo
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                  Full Name
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-stone-900 dark:text-white bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md">
                    <User className="h-4 w-4 text-amber-500" />
                    <span>{formData.name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                  Email
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-stone-900 dark:text-white bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md">
                    <Mail className="h-4 w-4 text-amber-500" />
                    <span>{formData.email}</span>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                  Phone
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-stone-900 dark:text-white bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md">
                    <Phone className="h-4 w-4 text-amber-500" />
                    <span>{formData.phone}</span>
                  </div>
                )}
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                  Company
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-stone-900 dark:text-white bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md">
                    <Building className="h-4 w-4 text-amber-500" />
                    <span>{formData.company}</span>
                  </div>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="department" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                  Department
                </Label>
                {isEditing ? (
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                  />
                ) : (
                  <div className="text-stone-900 dark:text-white bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md">
                    {formData.department}
                  </div>
                )}
              </div>
            </div>

            {/* Optional: Add a note about when the profile was last updated */}
            {!isEditing && (
              <div className="text-xs text-stone-400 dark:text-stone-500 pt-2 border-t border-stone-200 dark:border-stone-800">
                Last updated: Today at 10:30 AM
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}