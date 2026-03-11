import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ProfileSetupStep, ProfileSetupData } from '@/types/profile';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Step1PersonalInfo from './steps/Step1PersonalInfo';
import Step2ProfessionalTitle from './steps/Step2ProfessionalTitle';
import Step3SkillsExpertise from './steps/Step3SkillsExpertise';
import Step4EducationCertifications from './steps/Step4EducationCertifications';
import Step5Portfolio from './steps/Step5Portfolio';
import Step6HourlyRate from './steps/Step6HourlyRate';
import Step7ReviewCompletion from './steps/Step7ReviewCompletion';

const ProfileSetup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ProfileSetupStep>(1);
  const [profileData, setProfileData] = useState<Partial<ProfileSetupData>>({});

  const steps = [
    { number: 1, title: 'Personal Information', description: 'Basic details about you' },
    { number: 2, title: 'Professional Title', description: 'Your expertise overview' },
    { number: 3, title: 'Skills & Expertise', description: 'What you can do' },
    { number: 4, title: 'Education & Certifications', description: 'Your qualifications' },
    { number: 5, title: 'Portfolio', description: 'Show your work' },
    { number: 6, title: 'Rate & Payment', description: 'Your preferences' },
    { number: 7, title: 'Review & Complete', description: 'Final check' },
  ];

  const getProgressPercentage = () => {
    return ((currentStep - 1) / 6) * 100;
  };

  const isStepComplete = (step: ProfileSetupStep): boolean => {
    switch (step) {
      case 1:
        return !!(profileData.step1?.fullName && profileData.step1?.email);
      case 2:
        return !!(profileData.step2?.professionalTitle && profileData.step2?.professionalOverview);
      case 3:
        return !!(profileData.step3?.primarySkills && profileData.step3?.primarySkills.length > 0);
      case 4:
        return !!(profileData.step4?.highestEducation);
      case 5:
        return !!(profileData.step5 && profileData.step5.length > 0);
      case 6:
        return !!(profileData.step6?.hourlyRateMin && profileData.step6?.hourlyRateMax);
      case 7:
        return !!(profileData.step7?.termsAccepted);
      default:
        return false;
    }
  };

  const canProceedToNext = (): boolean => {
    return isStepComplete(currentStep);
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateStepData = (step: ProfileSetupStep, data: any) => {
    setProfileData(prev => ({
      ...prev,
      [`step${step}`]: data
    }));
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1PersonalInfo
            data={profileData.step1}
            onUpdate={(data) => updateStepData(1, data)}
          />
        );
      case 2:
        return (
          <Step2ProfessionalTitle
            data={profileData.step2}
            onUpdate={(data) => updateStepData(2, data)}
          />
        );
      case 3:
        return (
          <Step3SkillsExpertise
            data={profileData.step3}
            onUpdate={(data) => updateStepData(3, data)}
          />
        );
      case 4:
        return (
          <Step4EducationCertifications
            data={profileData.step4}
            onUpdate={(data) => updateStepData(4, data)}
          />
        );
      case 5:
        return (
          <Step5Portfolio
            data={profileData.step5 || []}
            onUpdate={(data) => updateStepData(5, data)}
          />
        );
      case 6:
        return (
          <Step6HourlyRate
            data={profileData.step6}
            onUpdate={(data) => updateStepData(6, data)}
          />
        );
      case 7:
        return (
          <Step7ReviewCompletion
            profileData={profileData}
            onUpdate={(data) => updateStepData(7, data)}
            onComplete={() => {
              // Handle profile completion
              console.log('Profile completed:', profileData);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Let's set up your freelancer profile to attract the right clients</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Step Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
                <CardDescription>Complete all 7 steps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={getProgressPercentage()} className="w-full" />
                <div className="space-y-2">
                  {steps.map((step) => (
                    <div
                      key={step.number}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        currentStep === step.number
                          ? 'bg-blue-50 border border-blue-200'
                          : isStepComplete(step.number as ProfileSetupStep)
                          ? 'bg-green-50 border border-green-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (isStepComplete(step.number as ProfileSetupStep) || step.number === 1) {
                          setCurrentStep(step.number as ProfileSetupStep);
                        }
                      }}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep === step.number
                            ? 'bg-blue-500 text-white'
                            : isStepComplete(step.number as ProfileSetupStep)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isStepComplete(step.number as ProfileSetupStep) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          step.number
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{step.title}</div>
                        <div className="text-xs text-gray-500">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                <CardDescription>{steps[currentStep - 1].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-[500px]">
                  {renderCurrentStep()}
                </div>

                {/* Navigation Buttons */}
                {currentStep !== 7 && (
                  <>
                    <Separator className="my-6" />
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={!canProceedToNext()}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
