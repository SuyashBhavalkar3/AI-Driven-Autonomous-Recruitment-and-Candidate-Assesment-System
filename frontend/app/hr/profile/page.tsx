"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Building, Save, Upload } from "lucide-react";

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
