"use client";

import { motion } from "framer-motion";
import { GraduationCap, Plus, Trash2 } from "lucide-react";

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
}

interface EducationCardProps {
  isEditing: boolean;
  education: Education[];
  setEducation: React.Dispatch<React.SetStateAction<Education[]>>;
}

export default function EducationCard({ isEditing, education, setEducation }: EducationCardProps) {
  const addEducation = () => {
    setEducation([
      ...education,
      {
        id: Date.now().toString(),
        institution: "",
        degree: "",
        fieldOfStudy: "",
        startDate: "",
        endDate: "",
        grade: "",
      },
    ]);
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter((edu) => edu.id !== id));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducation(
      education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  return (
    <motion.div
      className="info-card bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-[#B8915C]/10"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B8915C]/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[#B8915C]" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Education
          </h3>
        </div>
        {isEditing && (
          <button
            onClick={addEducation}
            className="flex items-center gap-2 px-4 py-2 bg-[#B8915C]/10 hover:bg-[#B8915C]/20 text-[#B8915C] rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Education
          </button>
        )}
      </div>

      <div className="space-y-4">
        {education.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm italic">
            No education added yet. {isEditing && "Click 'Add Education' to get started."}
          </p>
        ) : (
          education.map((edu) => (
            <div
              key={edu.id}
              className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Institution"
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Degree"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Field of Study"
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducation(edu.id, "fieldOfStudy", e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Grade/CGPA"
                        value={edu.grade}
                        onChange={(e) => updateEducation(edu.id, "grade", e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Start Date (e.g., June 2020)"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="End Date (e.g., June 2024)"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="ml-3 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {edu.institution}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-500">
                    <span>
                      {edu.startDate} - {edu.endDate || "Present"}
                    </span>
                    {edu.grade && <span>Grade: {edu.grade}</span>}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
