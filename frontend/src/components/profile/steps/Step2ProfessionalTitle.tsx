import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { ProfessionalTitle, LANGUAGES } from '@/types/profile';

const professionalTitleSchema = z.object({
  professionalTitle: z.string().min(5, 'Title must be at least 5 characters').max(80, 'Title must be less than 80 characters'),
  professionalOverview: z.string().min(50, 'Overview must be at least 50 characters').max(1000, 'Overview must be less than 1000 characters'),
  languages: z.array(z.object({
    language: z.string(),
    proficiency: z.enum(['Native', 'Fluent', 'Intermediate', 'Basic']),
  })).min(1, 'At least one language is required'),
  availabilityStatus: z.enum(['Full-time', 'Part-time', 'Available now', 'Not available']),
  availabilityDate: z.string().optional(),
});

interface Step2ProfessionalTitleProps {
  data?: ProfessionalTitle;
  onUpdate: (data: ProfessionalTitle) => void;
}

const Step2ProfessionalTitle: React.FC<Step2ProfessionalTitleProps> = ({ data, onUpdate }) => {
  const form = useForm<z.infer<typeof professionalTitleSchema>>({
    resolver: zodResolver(professionalTitleSchema),
    defaultValues: {
      professionalTitle: data?.professionalTitle || '',
      professionalOverview: data?.professionalOverview || '',
      languages: data?.languages || [],
      availabilityStatus: data?.availabilityStatus || 'Available now',
      availabilityDate: data?.availabilityDate ? new Date(data.availabilityDate).toISOString().split('T')[0] : '',
    },
  });

  const [newLanguage, setNewLanguage] = React.useState('');
  const [newProficiency, setNewProficiency] = React.useState<'Native' | 'Fluent' | 'Intermediate' | 'Basic'>('Fluent');

  const addLanguage = () => {
    if (newLanguage && !form.getValues('languages').find(l => l.language === newLanguage)) {
      const currentLanguages = form.getValues('languages');
      form.setValue('languages', [...currentLanguages, { language: newLanguage, proficiency: newProficiency }]);
      setNewLanguage('');
      setNewProficiency('Fluent');
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    const currentLanguages = form.getValues('languages');
    form.setValue('languages', currentLanguages.filter(l => l.language !== languageToRemove));
  };

  const onSubmit = (values: z.infer<typeof professionalTitleSchema>) => {
    const professionalTitle: ProfessionalTitle = {
      ...values,
      availabilityDate: values.availabilityDate ? new Date(values.availabilityDate) : undefined,
    };
    onUpdate(professionalTitle);
  };

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      const professionalTitle: ProfessionalTitle = {
        ...value,
        availabilityDate: value.availabilityDate ? new Date(value.availabilityDate) : undefined,
      } as ProfessionalTitle;
      onUpdate(professionalTitle);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onUpdate]);

  const availabilityStatus = form.watch('availabilityStatus');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Professional Title */}
        <FormField
          control={form.control}
          name="professionalTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professional Title / Headline *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Senior React & Next.js Developer | 5+ Years Experience"
                  {...field}
                />
              </FormControl>
              <div className="text-sm text-gray-500">
                {field.value.length}/80 characters
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Professional Overview */}
        <FormField
          control={form.control}
          name="professionalOverview"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professional Overview / About Me *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell clients about your expertise, experience, and what makes you unique. Share your story, highlight key achievements, and describe the value you bring to projects."
                  className="resize-none min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <div className="text-sm text-gray-500">
                {field.value.length}/1000 characters
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Languages */}
        <div>
          <FormLabel>Languages Spoken *</FormLabel>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select value={newLanguage} onValueChange={setNewLanguage}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newProficiency} onValueChange={(value: any) => setNewProficiency(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Native">Native</SelectItem>
                  <SelectItem value="Fluent">Fluent</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Basic">Basic</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={addLanguage} disabled={!newLanguage}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.watch('languages').map((lang, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {lang.language} ({lang.proficiency})
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => removeLanguage(lang.language)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
          {form.formState.errors.languages && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.languages.message}</p>
          )}
        </div>

        {/* Availability Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="availabilityStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Availability Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Available now">Available now</SelectItem>
                    <SelectItem value="Not available">Not available</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {availabilityStatus === 'Not available' && (
            <FormField
              control={form.control}
              name="availabilityDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available From</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">💡 Tips for your professional profile</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Use a clear, descriptive title that highlights your main expertise</li>
            <li>• Write a compelling overview that showcases your unique value proposition</li>
            <li>• Be honest about your language proficiency levels</li>
            <li>• Keep your availability status up-to-date for better client matching</li>
          </ul>
        </div>
      </form>
    </Form>
  );
};

export default Step2ProfessionalTitle;
