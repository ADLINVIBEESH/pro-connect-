import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { X, Plus, Star } from 'lucide-react';
import { SkillsExpertise, PREDEFINED_SKILLS } from '@/types/profile';

const skillsSchema = z.object({
  primarySkills: z.array(z.object({
    name: z.string(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
    yearsOfExperience: z.number().min(0).max(50),
  })).min(1, 'At least one skill is required').max(15, 'Maximum 15 skills allowed'),
  topSpecializations: z.array(z.string()).optional(),
  toolsAndTechnologies: z.array(z.string()).optional(),
});

interface Step3SkillsExpertiseProps {
  data?: SkillsExpertise;
  onUpdate: (data: SkillsExpertise) => void;
}

const skillLevelColors = {
  Beginner: 'bg-gray-500',
  Intermediate: 'bg-blue-500',
  Advanced: 'bg-purple-500',
  Expert: 'bg-orange-500',
};

const Step3SkillsExpertise: React.FC<Step3SkillsExpertiseProps> = ({ data, onUpdate }) => {
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Intermediate');
  const [newSkillYears, setNewSkillYears] = useState([2]);
  const [newTool, setNewTool] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');

  const form = useForm<z.infer<typeof skillsSchema>>({
    resolver: zodResolver(skillsSchema),
    defaultValues: {
      primarySkills: data?.primarySkills || [],
      topSpecializations: data?.topSpecializations || [],
      toolsAndTechnologies: data?.toolsAndTechnologies || [],
    },
  });

  const addSkill = () => {
    if (newSkill && !form.getValues('primarySkills').find(s => s.name === newSkill)) {
      const currentSkills = form.getValues('primarySkills');
      if (currentSkills.length < 15) {
        form.setValue('primarySkills', [...currentSkills, {
          name: newSkill,
          level: newSkillLevel,
          yearsOfExperience: newSkillYears[0],
        }]);
        setNewSkill('');
        setNewSkillLevel('Intermediate');
        setNewSkillYears([2]);
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues('primarySkills');
    form.setValue('primarySkills', currentSkills.filter(s => s.name !== skillToRemove));
  };

  const addTool = () => {
    if (newTool && !form.getValues('toolsAndTechnologies')?.includes(newTool)) {
      const currentTools = form.getValues('toolsAndTechnologies') || [];
      form.setValue('toolsAndTechnologies', [...currentTools, newTool]);
      setNewTool('');
    }
  };

  const removeTool = (toolToRemove: string) => {
    const currentTools = form.getValues('toolsAndTechnologies') || [];
    form.setValue('toolsAndTechnologies', currentTools.filter(t => t !== toolToRemove));
  };

  const addSpecialization = () => {
    if (newSpecialization && !form.getValues('topSpecializations')?.includes(newSpecialization)) {
      const currentSpecializations = form.getValues('topSpecializations') || [];
      form.setValue('topSpecializations', [...currentSpecializations, newSpecialization]);
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (specToRemove: string) => {
    const currentSpecializations = form.getValues('topSpecializations') || [];
    form.setValue('topSpecializations', currentSpecializations.filter(s => s !== specToRemove));
  };

  const onSubmit = (values: z.infer<typeof skillsSchema>) => {
    onUpdate(values);
  };

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      onUpdate(value as SkillsExpertise);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onUpdate]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Primary Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Skills *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Select value={newSkill} onValueChange={setNewSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_SKILLS.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newSkillLevel} onValueChange={(value: any) => setNewSkillLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
                <div className="col-span-1">
                  <div className="text-sm text-gray-600 mb-1">Experience: {newSkillYears[0]} years</div>
                  <Slider
                    value={newSkillYears}
                    onValueChange={setNewSkillYears}
                    max={30}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
                <Button type="button" onClick={addSkill} disabled={!newSkill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {form.watch('primarySkills').map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${skillLevelColors[skill.level]}`} />
                      <span className="font-medium">{skill.name}</span>
                      <Badge variant="outline">{skill.level}</Badge>
                      <span className="text-sm text-gray-600">{skill.yearsOfExperience} years</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkill(skill.name)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {form.formState.errors.primarySkills && (
              <p className="text-sm text-red-500">{form.formState.errors.primarySkills.message}</p>
            )}
            <div className="text-sm text-gray-500">
              {form.watch('primarySkills').length}/15 skills
            </div>
          </CardContent>
        </Card>

        {/* Top Specializations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Specializations / Niches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Frontend, Full-Stack, MERN, Next.js"
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
              />
              <Button type="button" onClick={addSpecialization} disabled={!newSpecialization}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.watch('topSpecializations')?.map((spec, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {spec}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => removeSpecialization(spec)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tools & Technologies */}
        <Card>
          <CardHeader>
            <CardTitle>Tools & Technologies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Git, Docker, AWS, Figma"
                value={newTool}
                onChange={(e) => setNewTool(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
              />
              <Button type="button" onClick={addTool} disabled={!newTool}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.watch('toolsAndTechnologies')?.map((tool, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {tool}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => removeTool(tool)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">💡 Tips for skills section</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Focus on your strongest skills that clients are looking for</li>
            <li>• Be honest about your skill levels and experience</li>
            <li>• Include both technical and business-relevant skills</li>
            <li>• Add specializations that make you stand out from others</li>
            <li>• List tools you're proficient with for project collaboration</li>
          </ul>
        </div>
      </form>
    </Form>
  );
};

export default Step3SkillsExpertise;
