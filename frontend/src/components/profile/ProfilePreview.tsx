import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ProfileSetupData } from '@/types/profile';
import { 
  MapPin, 
  Globe, 
  Calendar, 
  Mail, 
  Phone, 
  DollarSign, 
  Clock,
  Award,
  GraduationCap,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';

interface ProfilePreviewProps {
  profileData: Partial<ProfileSetupData>;
}

const ProfilePreview: React.FC<ProfilePreviewProps> = ({ profileData }) => {
  const step1 = profileData.step1;
  const step2 = profileData.step2;
  const step3 = profileData.step3;
  const step4 = profileData.step4;
  const step5 = profileData.step5;
  const step6 = profileData.step6;

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'bg-orange-100 text-orange-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Beginner': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥',
      CNY: '¥',
    };
    return `${currencySymbols[currency] || currency}${amount}`;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-t-lg">
        <div className="flex items-start space-x-6">
          <Avatar className="w-24 h-24 border-4 border-white">
            <AvatarImage src={step1?.profilePhoto} alt={step1?.fullName} />
            <AvatarFallback className="text-2xl bg-white text-blue-600">
              {step1?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{step1?.fullName || 'Your Name'}</h1>
            <p className="text-xl mb-3">{step2?.professionalTitle || 'Your Professional Title'}</p>
            <div className="flex flex-wrap gap-2 text-sm">
              {step1?.location?.city && step1?.location?.country && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {step1.location.city}, {step1.location.country}
                </div>
              )}
              {step1?.timeZone && (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {step1.timeZone}
                </div>
              )}
              {step2?.availabilityStatus && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {step2.availabilityStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* About Section */}
        {step2?.professionalOverview && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">About</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{step2.professionalOverview}</p>
            </CardContent>
          </Card>
        )}

        {/* Bio Section */}
        {step1?.shortBio && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Tagline</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 italic">"{step1.shortBio}"</p>
            </CardContent>
          </Card>
        )}

        {/* Languages */}
        {step2?.languages && step2.languages.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Languages</h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {step2.languages.map((lang, index) => (
                  <Badge key={index} variant="secondary">
                    {lang.language} ({lang.proficiency})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skills & Expertise */}
        {step3?.primarySkills && step3.primarySkills.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Skills & Expertise</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-3">Primary Skills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {step3.primarySkills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{skill.name}</div>
                        <div className="text-sm text-gray-600">{skill.yearsOfExperience} years</div>
                      </div>
                      <Badge className={getSkillLevelColor(skill.level)}>
                        {skill.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {step3.topSpecializations && step3.topSpecializations.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {step3.topSpecializations.map((spec, index) => (
                      <Badge key={index} variant="outline">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {step3.toolsAndTechnologies && step3.toolsAndTechnologies.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Tools & Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {step3.toolsAndTechnologies.map((tool, index) => (
                      <Badge key={index} variant="secondary">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Education */}
        {step4?.highestEducation && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Education
              </h2>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-lg">{step4.highestEducation.degree}</div>
                <div className="text-gray-600">{step4.highestEducation.field}</div>
                <div className="text-gray-500">{step4.highestEducation.institution}</div>
                <div className="text-sm text-gray-500 mt-1">Class of {step4.highestEducation.year}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        {step4?.certifications && step4.certifications.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certifications
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {step4.certifications.map((cert, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium">{cert.name}</div>
                    <div className="text-gray-600">{cert.issuingOrganization}</div>
                    {cert.credentialId && (
                      <div className="text-sm text-gray-500">ID: {cert.credentialId}</div>
                    )}
                    <div className="text-sm text-gray-500">
                      Issued: {cert.issueDate instanceof Date ? cert.issueDate.toLocaleDateString() : new Date(cert.issueDate).toLocaleDateString()}
                      {cert.expiryDate && ` • Expires: ${cert.expiryDate instanceof Date ? cert.expiryDate.toLocaleDateString() : new Date(cert.expiryDate).toLocaleDateString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio */}
        {step5 && step5.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Portfolio
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {step5.map((project, index) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{project.title}</h3>
                        <p className="text-gray-600">{project.role}</p>
                        {project.clientName && (
                          <p className="text-sm text-gray-500">Client: {project.clientName}</p>
                        )}
                      </div>
                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Live Demo
                        </a>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-3">{project.description}</p>
                    
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.technologies.map((tech, techIndex) => (
                          <Badge key={techIndex} variant="secondary">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {project.images && project.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {project.images.map((image, imageIndex) => (
                          <img
                            key={imageIndex}
                            src={image}
                            alt={`${project.title} screenshot ${imageIndex + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}

                    {(project.startDate || project.endDate) && (
                      <div className="text-sm text-gray-500 mt-3">
                        {project.startDate && `Started: ${project.startDate instanceof Date ? project.startDate.toLocaleDateString() : new Date(project.startDate).toLocaleDateString()}`}
                        {project.startDate && project.endDate && ' • '}
                        {project.endDate && `Completed: ${project.endDate instanceof Date ? project.endDate.toLocaleDateString() : new Date(project.endDate).toLocaleDateString()}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rate & Availability */}
        {step6?.hourlyRateMin && step6?.hourlyRateMax && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Rate & Availability
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(step6.hourlyRateMin, step6.currency || 'USD')} - {formatCurrency(step6.hourlyRateMax, step6.currency || 'USD')}
                  <span className="text-sm font-normal text-green-600 ml-2">per hour</span>
                </div>
              </div>

              {step6.preferredProjectTypes && step6.preferredProjectTypes.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Preferred Project Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {step6.preferredProjectTypes.map((type, index) => (
                      <Badge key={index} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {step6.minimumProjectBudget && (
                <div>
                  <h3 className="font-medium mb-2">Minimum Project Budget</h3>
                  <p className="text-gray-600">
                    {formatCurrency(step6.minimumProjectBudget, step6.currency || 'USD')}+
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Contact</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {step1?.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {step1.email}
                </div>
              )}
              {step1?.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {step1.phoneNumber}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePreview;
