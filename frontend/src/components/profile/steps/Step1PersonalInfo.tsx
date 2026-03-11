import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Camera } from 'lucide-react';
import { PersonalInformation, TIME_ZONES } from '@/types/profile';

const personalInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  profilePhoto: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email address'),
  location: z.object({
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  timeZone: z.string().min(1, 'Time zone is required'),
  dateOfBirth: z.string().optional(),
  shortBio: z.string().min(10, 'Bio must be at least 10 characters').max(160, 'Bio must be less than 160 characters'),
});

interface Step1PersonalInfoProps {
  data?: PersonalInformation;
  onUpdate: (data: PersonalInformation) => void;
}

const Step1PersonalInfo: React.FC<Step1PersonalInfoProps> = ({ data, onUpdate }) => {
  const [profileImage, setProfileImage] = useState<string>(data?.profilePhoto || '');

  const form = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: data?.fullName || '',
      profilePhoto: data?.profilePhoto || '',
      phoneNumber: data?.phoneNumber || '',
      email: data?.email || '',
      location: {
        city: data?.location?.city || '',
        country: data?.location?.country || '',
      },
      timeZone: data?.timeZone || 'UTC+00:00',
      dateOfBirth: data?.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
      shortBio: data?.shortBio || '',
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result);
        form.setValue('profilePhoto', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: z.infer<typeof personalInfoSchema>) => {
    const personalInfo: PersonalInformation = {
      ...values,
      dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth) : undefined,
    };
    onUpdate(personalInfo);
  };

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      const personalInfo: PersonalInformation = {
        ...value,
        dateOfBirth: value.dateOfBirth ? new Date(value.dateOfBirth) : undefined,
      } as PersonalInformation;
      onUpdate(personalInfo);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onUpdate]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Photo */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profileImage} alt="Profile" />
              <AvatarFallback className="text-lg">
                {form.watch('fullName').split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="profile-photo"
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <input
                id="profile-photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
          <div>
            <h3 className="font-medium">Profile Photo</h3>
            <p className="text-sm text-gray-500">
              Upload a professional photo (min 400×400px, showing your face is recommended)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 234 567 8900" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date of Birth */}
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={form.control}
            name="location.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City *</FormLabel>
                <FormControl>
                  <Input placeholder="New York" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Country */}
          <FormField
            control={form.control}
            name="location.country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country *</FormLabel>
                <FormControl>
                  <Input placeholder="United States" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Zone */}
          <FormField
            control={form.control}
            name="timeZone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Zone *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your time zone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_ZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Short Bio */}
        <FormField
          control={form.control}
          name="shortBio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Bio / Tagline *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Full-stack developer | React & Node.js | Building scalable SaaS since 2020"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <div className="text-sm text-gray-500">
                {field.value.length}/160 characters
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Tips for a great profile</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use a professional, clear photo where your face is visible</li>
            <li>• Write a compelling bio that highlights your expertise</li>
            <li>• Include your real location for better client matching</li>
            <li>• Set the correct time zone for scheduling</li>
          </ul>
        </div>
      </form>
    </Form>
  );
};

export default Step1PersonalInfo;
