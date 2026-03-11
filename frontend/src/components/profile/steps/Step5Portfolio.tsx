import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, ExternalLink, Upload, Image as ImageIcon } from 'lucide-react';
import { Project } from '@/types/profile';

const projectSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  role: z.string().min(1, 'Your role is required'),
  technologies: z.array(z.string()).min(1, 'At least one technology is required'),
  projectUrl: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  clientName: z.string().optional(),
});

interface Step5PortfolioProps {
  data: Project[];
  onUpdate: (data: Project[]) => void;
}

const Step5Portfolio: React.FC<Step5PortfolioProps> = ({ data, onUpdate }) => {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: '',
    description: '',
    role: '',
    technologies: [],
    projectUrl: '',
    images: [],
    startDate: '',
    endDate: '',
    clientName: '',
  });
  const [newTech, setNewTech] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      role: '',
      technologies: [],
      projectUrl: '',
      images: [],
      startDate: '',
      endDate: '',
      clientName: '',
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setUploadedImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTechnology = () => {
    if (newTech && !newProject.technologies?.includes(newTech)) {
      setNewProject(prev => ({
        ...prev,
        technologies: [...(prev.technologies || []), newTech]
      }));
      setNewTech('');
    }
  };

  const removeTechnology = (techToRemove: string) => {
    setNewProject(prev => ({
      ...prev,
      technologies: prev.technologies?.filter(t => t !== techToRemove) || []
    }));
  };

  const addProject = () => {
    if (newProject.title && newProject.description && newProject.role && newProject.technologies && newProject.technologies.length > 0) {
      const project: Project = {
        id: Date.now().toString(),
        title: newProject.title,
        description: newProject.description,
        role: newProject.role,
        technologies: newProject.technologies,
        projectUrl: newProject.projectUrl || undefined,
        images: uploadedImages,
        startDate: newProject.startDate ? new Date(newProject.startDate) : undefined,
        endDate: newProject.endDate ? new Date(newProject.endDate) : undefined,
        clientName: newProject.clientName || undefined,
      };

      onUpdate([...data, project]);
      
      // Reset form
      setNewProject({
        title: '',
        description: '',
        role: '',
        technologies: [],
        projectUrl: '',
        images: [],
        startDate: '',
        endDate: '',
        clientName: '',
      });
      setUploadedImages([]);
      setShowProjectForm(false);
      form.reset();
    }
  };

  const removeProject = (projectId: string) => {
    onUpdate(data.filter(p => p.id !== projectId));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Portfolio Projects</h3>
          <p className="text-sm text-gray-600">Showcase your best work to attract clients</p>
        </div>
        <Button
          type="button"
          onClick={() => setShowProjectForm(true)}
          disabled={data.length >= 10}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-4">Add your first project to showcase your work</p>
          <Button type="button" onClick={() => setShowProjectForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Project
          </Button>
        </div>
      )}

      {/* Existing Projects */}
      <div className="space-y-4">
        {data.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <p className="text-sm text-gray-600">{project.role}</p>
                  {project.clientName && (
                    <p className="text-sm text-gray-500">Client: {project.clientName}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProject(project.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-3">{project.description}</p>
              
              {project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.technologies.map((tech, index) => (
                    <Badge key={index} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}

              {project.projectUrl && (
                <div className="mb-3">
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Live Project
                  </a>
                </div>
              )}

              {project.images && project.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {project.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${project.title} screenshot ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {(project.startDate || project.endDate) && (
                <div className="text-sm text-gray-500 mt-3">
                  {project.startDate && new Date(project.startDate).toLocaleDateString()}
                  {project.startDate && project.endDate && ' - '}
                  {project.endDate && new Date(project.endDate).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Project Form */}
      {showProjectForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Title *</label>
                <Input
                  placeholder="E-commerce Website"
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Role *</label>
                <Input
                  placeholder="Full-stack Developer"
                  value={newProject.role}
                  onChange={(e) => setNewProject(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Client Name</label>
                <Input
                  placeholder="ABC Company (or 'Private Project')"
                  value={newProject.clientName}
                  onChange={(e) => setNewProject(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Project URL</label>
                <Input
                  placeholder="https://example.com"
                  value={newProject.projectUrl}
                  onChange={(e) => setNewProject(prev => ({ ...prev, projectUrl: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input
                  type="date"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <Textarea
                placeholder="Describe what you did, the challenges you solved, and the results achieved..."
                className="resize-none"
                rows={3}
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Technologies Used *</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="React, Node.js, MongoDB..."
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                  />
                  <Button type="button" onClick={addTechnology} disabled={!newTech}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newProject.technologies?.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tech}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => removeTechnology(tech)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Project Screenshots</label>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload screenshots (max 5MB each, up to 5 images)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="project-images"
                    />
                    <label
                      htmlFor="project-images"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Choose Images
                    </label>
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" onClick={addProject}>
                Add Project
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowProjectForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-indigo-50 p-4 rounded-lg">
        <h4 className="font-medium text-indigo-900 mb-2">💡 Tips for portfolio projects</h4>
        <ul className="text-sm text-indigo-800 space-y-1">
          <li>• Show your best and most relevant work first</li>
          <li>• Include clear screenshots or live links when possible</li>
          <li>• Describe your specific role and contributions</li>
          <li>• Highlight the technologies and challenges involved</li>
          <li>• Focus on projects that demonstrate your expertise</li>
        </ul>
      </div>
    </div>
  );
};

export default Step5Portfolio;
