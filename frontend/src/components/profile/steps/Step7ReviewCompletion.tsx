import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProfileSetupData } from '@/types/profile';
import { CheckCircle, Eye, User, Briefcase, Award, Image, DollarSign, FileText } from 'lucide-react';
import ProfilePreview from '../ProfilePreview';

interface Step7ReviewCompletionProps {
  profileData: Partial<ProfileSetupData>;
  onUpdate: (data: { termsAccepted: boolean; completedAt: Date }) => void;
  onComplete: () => void;
}

const Step7ReviewCompletion: React.FC<Step7ReviewCompletionProps> = ({
  profileData,
  onUpdate,
  onComplete,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const calculateProfileStrength = () => {
    let strength = 0;
    const maxStrength = 100;

    // Step 1: Personal Information (20 points)
    if (profileData.step1?.fullName) strength += 5;
    if (profileData.step1?.profilePhoto) strength += 5;
    if (profileData.step1?.email) strength += 3;
    if (profileData.step1?.location?.city && profileData.step1?.location?.country) strength += 4;
    if (profileData.step1?.shortBio && profileData.step1.shortBio.length >= 50) strength += 3;

    // Step 2: Professional Title (15 points)
    if (profileData.step2?.professionalTitle) strength += 5;
    if (profileData.step2?.professionalOverview && profileData.step2.professionalOverview.length >= 100) strength += 5;
    if (profileData.step2?.languages && profileData.step2.languages.length > 0) strength += 5;

    // Step 3: Skills & Expertise (20 points)
    if (profileData.step3?.primarySkills && profileData.step3.primarySkills.length >= 3) strength += 10;
    if (profileData.step3?.primarySkills && profileData.step3.primarySkills.length >= 5) strength += 5;
    if (profileData.step3?.toolsAndTechnologies && profileData.step3.toolsAndTechnologies.length > 0) strength += 5;

    // Step 4: Education & Certifications (10 points)
    if (profileData.step4?.highestEducation) strength += 5;
    if (profileData.step4?.certifications && profileData.step4.certifications.length > 0) strength += 5;

    // Step 5: Portfolio (20 points)
    if (profileData.step5 && profileData.step5.length >= 1) strength += 10;
    if (profileData.step5 && profileData.step5.length >= 2) strength += 10;

    // Step 6: Hourly Rate & Payment (15 points)
    if (profileData.step6?.hourlyRateMin && profileData.step6.hourlyRateMax) strength += 10;
    if (profileData.step6?.preferredPayoutMethod) strength += 5;

    return Math.min(strength, maxStrength);
  };

  const profileStrength = calculateProfileStrength();
  const getStrengthColor = () => {
    if (profileStrength >= 90) return 'text-green-600';
    if (profileStrength >= 70) return 'text-blue-600';
    if (profileStrength >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthMessage = () => {
    if (profileStrength >= 90) return 'Excellent! Your profile is very strong.';
    if (profileStrength >= 70) return 'Good! Your profile is well-rounded.';
    if (profileStrength >= 50) return 'Decent. Consider adding more details.';
    return 'Incomplete. Please add more information.';
  };

  const handleTermsChange = (checked: boolean) => {
    setTermsAccepted(checked);
    onUpdate({
      termsAccepted: checked,
      completedAt: new Date(),
    });
  };

  const handleCompleteProfile = () => {
    if (termsAccepted) {
      onComplete();
    }
  };

  const stepIcons = {
    1: <User className="w-5 h-5" />,
    2: <Briefcase className="w-5 h-5" />,
    3: <Award className="w-5 h-5" />,
    4: <FileText className="w-5 h-5" />,
    5: <Image className="w-5 h-5" />,
    6: <DollarSign className="w-5 h-5" />,
  };

  const stepTitles = {
    1: 'Personal Information',
    2: 'Professional Title',
    3: 'Skills & Expertise',
    4: 'Education & Certifications',
    5: 'Portfolio',
    6: 'Hourly Rate & Payment',
  };

  const isStepComplete = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(profileData.step1?.fullName && profileData.step1?.email);
      case 2:
        return !!(profileData.step2?.professionalTitle && profileData.step2?.professionalOverview);
      case 3:
        return !!(profileData.step3?.primarySkills && profileData.step3.primarySkills.length > 0);
      case 4:
        return !!(profileData.step4?.highestEducation);
      case 5:
        return !!(profileData.step5 && profileData.step5.length > 0);
      case 6:
        return !!(profileData.step6?.hourlyRateMin && profileData.step6?.hourlyRateMax);
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Strength Meter */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Strength</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Profile Completion</span>
              <span className={`text-lg font-bold ${getStrengthColor()}`}>
                {profileStrength}%
              </span>
            </div>
            <Progress value={profileStrength} className="w-full h-3" />
            <p className={`text-sm ${getStrengthColor()}`}>
              {getStrengthMessage()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step Completion Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stepIcons).map(([stepNumber, icon]) => (
              <div key={stepNumber} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    isStepComplete(parseInt(stepNumber as unknown as string))
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {icon}
                  </div>
                  <div>
                    <div className="font-medium">{stepTitles[stepNumber as keyof typeof stepTitles]}</div>
                    <div className="text-sm text-gray-500">
                      {isStepComplete(parseInt(stepNumber as unknown as string)) ? 'Completed' : 'Incomplete'}
                    </div>
                  </div>
                </div>
                <CheckCircle
                  className={`w-5 h-5 ${
                    isStepComplete(parseInt(stepNumber as unknown as string))
                      ? 'text-green-500'
                      : 'text-gray-300'
                  }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Button */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Public Profile Preview
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            See how clients will view your profile
          </p>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={handleTermsChange}
              />
              <div className="space-y-2">
                <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                  I agree to the platform Terms of Conditions
                </label>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• I confirm that I am an independent contractor</p>
                  <p>• I understand that I am responsible for my own taxes</p>
                  <p>• I agree to abide by platform policies and community guidelines</p>
                  <p>• I understand that profile information must be accurate and truthful</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🎉 Ready to start!</h4>
              <p className="text-sm text-blue-800">
                Once you complete your profile, you'll be able to:
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Browse and apply to freelance projects</li>
                <li>• Receive proposals from clients</li>
                <li>• Build your reputation with reviews</li>
                <li>• Access advanced platform features</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleCompleteProfile}
          disabled={!termsAccepted || profileStrength < 70}
          className="px-8 py-3 text-lg"
        >
          Complete Profile
        </Button>
      </div>

      {!termsAccepted && (
        <p className="text-center text-sm text-gray-500">
          Please accept the terms and conditions to continue
        </p>
      )}

      {termsAccepted && profileStrength < 70 && (
        <p className="text-center text-sm text-amber-600">
          Complete more profile sections to reach at least 70% completion
        </p>
      )}

      {/* Profile Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Public Profile Preview</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </Button>
              </div>
              <ProfilePreview profileData={profileData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step7ReviewCompletion;
