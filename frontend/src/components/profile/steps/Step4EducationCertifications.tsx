import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, GraduationCap, Award } from 'lucide-react';
import { EducationCertifications, Education, Certification, RelevantCourse } from '@/types/profile';

const educationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().min(1, 'Field of study is required'),
  institution: z.string().min(1, 'Institution is required'),
  year: z.number().min(1950).max(new Date().getFullYear()),
});

const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuingOrganization: z.string().min(1, 'Issuing organization is required'),
  credentialId: z.string().optional(),
  issueDate: z.string(),
  expiryDate: z.string().optional(),
});

const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  platform: z.string().min(1, 'Platform is required'),
  completionDate: z.string().optional(),
  certificateUrl: z.string().url().optional().or(z.literal('')),
});

const educationCertificationsSchema = z.object({
  highestEducation: educationSchema,
  certifications: z.array(certificationSchema).optional(),
  relevantCourses: z.array(courseSchema).optional(),
});

interface Step4EducationCertificationsProps {
  data?: EducationCertifications;
  onUpdate: (data: EducationCertifications) => void;
}

const Step4EducationCertifications: React.FC<Step4EducationCertificationsProps> = ({ data, onUpdate }) => {
  const [showCertForm, setShowCertForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);

  const form = useForm<z.infer<typeof educationCertificationsSchema>>({
    resolver: zodResolver(educationCertificationsSchema),
    defaultValues: {
      highestEducation: data?.highestEducation || {
        degree: '',
        field: '',
        institution: '',
        year: new Date().getFullYear(),
      },
      certifications: data?.certifications || [],
      relevantCourses: data?.relevantCourses || [],
    },
  });

  const [newCertification, setNewCertification] = useState<Partial<Certification>>({
    name: '',
    issuingOrganization: '',
    credentialId: '',
    issueDate: '',
    expiryDate: '',
  });

  const [newCourse, setNewCourse] = useState<Partial<RelevantCourse>>({
    name: '',
    platform: '',
    completionDate: '',
    certificateUrl: '',
  });

  const addCertification = () => {
    if (newCertification.name && newCertification.issuingOrganization && newCertification.issueDate) {
      const currentCerts = form.getValues('certifications') || [];
      form.setValue('certifications', [...currentCerts, {
        ...newCertification,
        issueDate: newCertification.issueDate,
        expiryDate: newCertification.expiryDate,
      } as Certification]);
      setNewCertification({
        name: '',
        issuingOrganization: '',
        credentialId: '',
        issueDate: '',
        expiryDate: '',
      });
      setShowCertForm(false);
    }
  };

  const removeCertification = (index: number) => {
    const currentCerts = form.getValues('certifications') || [];
    form.setValue('certifications', currentCerts.filter((_, i) => i !== index));
  };

  const addCourse = () => {
    if (newCourse.name && newCourse.platform) {
      const currentCourses = form.getValues('relevantCourses') || [];
      form.setValue('relevantCourses', [...currentCourses, {
        ...newCourse,
        completionDate: newCourse.completionDate ? new Date(newCourse.completionDate) : undefined,
      } as RelevantCourse]);
      setNewCourse({
        name: '',
        platform: '',
        completionDate: '',
        certificateUrl: '',
      });
      setShowCourseForm(false);
    }
  };

  const removeCourse = (index: number) => {
    const currentCourses = form.getValues('relevantCourses') || [];
    form.setValue('relevantCourses', currentCourses.filter((_, i) => i !== index));
  };

  const onSubmit = (values: z.infer<typeof educationCertificationsSchema>) => {
    const educationCertifications: EducationCertifications = {
      ...values,
      certifications: values.certifications?.map(cert => ({
        ...cert,
        issueDate: new Date(cert.issueDate),
        expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
      })) || [],
      relevantCourses: values.relevantCourses?.map(course => ({
        ...course,
        completionDate: course.completionDate ? new Date(course.completionDate) : undefined,
      })) || [],
    };
    onUpdate(educationCertifications);
  };

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      const educationCertifications: EducationCertifications = {
        ...value,
        certifications: value.certifications?.map(cert => ({
          ...cert,
          issueDate: new Date(cert.issueDate),
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
        })) || [],
        relevantCourses: value.relevantCourses?.map(course => ({
          ...course,
          completionDate: course.completionDate ? new Date(course.completionDate) : undefined,
        })) || [],
      } as EducationCertifications;
      onUpdate(educationCertifications);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onUpdate]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Highest Education */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Highest Education *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="highestEducation.degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree</FormLabel>
                    <FormControl>
                      <Input placeholder="Bachelor of Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="highestEducation.field"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field of Study</FormLabel>
                    <FormControl>
                      <Input placeholder="Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="highestEducation.institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution</FormLabel>
                    <FormControl>
                      <Input placeholder="University of Technology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="highestEducation.year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Graduation Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certifications
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCertForm(!showCertForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showCertForm && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Certification Name"
                    value={newCertification.name}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Issuing Organization"
                    value={newCertification.issuingOrganization}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, issuingOrganization: e.target.value }))}
                  />
                  <Input
                    placeholder="Credential ID (optional)"
                    value={newCertification.credentialId}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, credentialId: e.target.value }))}
                  />
                  <Input
                    type="date"
                    placeholder="Issue Date"
                    value={newCertification.issueDate}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, issueDate: e.target.value }))}
                  />
                  <Input
                    type="date"
                    placeholder="Expiry Date (optional)"
                    value={newCertification.expiryDate}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button type="button" onClick={addCertification}>Add</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCertForm(false)}>Cancel</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {form.watch('certifications')?.map((cert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{cert.name}</div>
                    <div className="text-sm text-gray-600">{cert.issuingOrganization}</div>
                    {cert.credentialId && (
                      <div className="text-xs text-gray-500">ID: {cert.credentialId}</div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCertification(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Relevant Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Relevant Courses / Bootcamps
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCourseForm(!showCourseForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showCourseForm && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Course Name"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Platform (e.g., Udemy, Coursera)"
                    value={newCourse.platform}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, platform: e.target.value }))}
                  />
                  <Input
                    type="date"
                    placeholder="Completion Date (optional)"
                    value={newCourse.completionDate}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, completionDate: e.target.value }))}
                  />
                  <Input
                    placeholder="Certificate URL (optional)"
                    value={newCourse.certificateUrl}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, certificateUrl: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button type="button" onClick={addCourse}>Add</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCourseForm(false)}>Cancel</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {form.watch('relevantCourses')?.map((course, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{course.name}</div>
                    <div className="text-sm text-gray-600">{course.platform}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCourse(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="bg-amber-50 p-4 rounded-lg">
          <h4 className="font-medium text-amber-900 mb-2">💡 Tips for education section</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Include your highest level of formal education</li>
            <li>• Add relevant certifications that validate your skills</li>
            <li>• Include online courses and bootcamps that demonstrate continuous learning</li>
            <li>• Focus on qualifications relevant to your freelance work</li>
          </ul>
        </div>
      </form>
    </Form>
  );
};

export default Step4EducationCertifications;
