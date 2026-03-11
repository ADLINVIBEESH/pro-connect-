import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, Shield } from 'lucide-react';
import { HourlyRatePreferences, CURRENCIES } from '@/types/profile';

const hourlyRateSchema = z.object({
  hourlyRateMin: z.number().min(1, 'Minimum rate must be at least 1'),
  hourlyRateMax: z.number().min(1, 'Maximum rate must be at least 1'),
  currency: z.string().min(1, 'Currency is required'),
  preferredProjectTypes: z.array(z.string()).min(1, 'At least one project type is required'),
  minimumProjectBudget: z.number().optional(),
  preferredPayoutMethod: z.enum(['PayPal', 'Payoneer', 'Bank Transfer', 'Wise', 'UPI']),
  billingInfo: z.object({
    taxId: z.string().optional(),
    gstin: z.string().optional(),
  }).optional(),
}).refine((data) => data.hourlyRateMax >= data.hourlyRateMin, {
  message: "Maximum rate must be greater than or equal to minimum rate",
  path: ["hourlyRateMax"],
});

interface Step6HourlyRateProps {
  data?: HourlyRatePreferences;
  onUpdate: (data: HourlyRatePreferences) => void;
}

const Step6HourlyRate: React.FC<Step6HourlyRateProps> = ({ data, onUpdate }) => {
  const form = useForm<z.infer<typeof hourlyRateSchema>>({
    resolver: zodResolver(hourlyRateSchema),
    defaultValues: {
      hourlyRateMin: data?.hourlyRateMin || 10,
      hourlyRateMax: data?.hourlyRateMax || 50,
      currency: data?.currency || 'USD',
      preferredProjectTypes: data?.preferredProjectTypes || ['Hourly'],
      minimumProjectBudget: data?.minimumProjectBudget,
      preferredPayoutMethod: data?.preferredPayoutMethod || 'PayPal',
      billingInfo: data?.billingInfo || {
        taxId: '',
        gstin: '',
      },
    },
  });

  const currency = form.watch('currency');
  const selectedCurrency = CURRENCIES.find(c => c.code === currency);
  const minRate = form.watch('hourlyRateMin');
  const maxRate = form.watch('hourlyRateMax');

  const projectTypes = [
    { id: 'Hourly', label: 'Hourly Projects', description: 'Paid per hour worked' },
    { id: 'Fixed-price', label: 'Fixed-price Projects', description: 'One-time payment for the entire project' },
    { id: 'Milestone-based', label: 'Milestone-based', description: 'Paid upon completion of milestones' },
  ];

  const payoutMethods = [
    { id: 'PayPal', label: 'PayPal', description: 'Global payment platform' },
    { id: 'Payoneer', label: 'Payoneer', description: 'Cross-border payments' },
    { id: 'Bank Transfer', label: 'Bank Transfer', description: 'Direct bank deposit' },
    { id: 'Wise', label: 'Wise', description: 'Low-cost international transfers' },
    { id: 'UPI', label: 'UPI', description: 'India instant payments' },
  ];

  const onSubmit = (values: z.infer<typeof hourlyRateSchema>) => {
    const hourlyRatePreferences: HourlyRatePreferences = values;
    onUpdate(hourlyRatePreferences);
  };

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      onUpdate(value as HourlyRatePreferences);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onUpdate]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Hourly Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Hourly Rate *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.code} - {curr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyRateMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Rate</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {selectedCurrency?.symbol}
                        </span>
                        <Input
                          type="number"
                          className="pl-8"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyRateMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Rate</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {selectedCurrency?.symbol}
                        </span>
                        <Input
                          type="number"
                          className="pl-8"
                          placeholder="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedCurrency?.symbol}{minRate} - {selectedCurrency?.symbol}{maxRate}
                  <span className="text-sm font-normal text-gray-600 ml-2">per hour</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Your hourly rate range for clients
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="minimumProjectBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Project Budget (optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {selectedCurrency?.symbol}
                      </span>
                      <Input
                        type="number"
                        className="pl-8"
                        placeholder="1000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </div>
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    You won't see projects below this budget
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Preferred Project Types */}
        <Card>
          <CardHeader>
            <CardTitle>Preferred Project Types *</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="preferredProjectTypes"
              render={() => (
                <FormItem>
                  <div className="space-y-3">
                    {projectTypes.map((type) => (
                      <FormField
                        key={type.id}
                        control={form.control}
                        name="preferredProjectTypes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={type.id}
                              className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(type.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, type.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== type.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">
                                  {type.label}
                                </FormLabel>
                                <p className="text-sm text-gray-500">
                                  {type.description}
                                </p>
                              </div>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Preferred Payout Method *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="preferredPayoutMethod"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payout method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {payoutMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div>
                            <div className="font-medium">{method.label}</div>
                            <div className="text-sm text-gray-500">{method.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Billing Information (optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="billingInfo.taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax ID / SSN</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional tax identification number"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    For tax purposes and compliance
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingInfo.gstin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GSTIN (India only)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Goods and Services Tax Identification Number"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    Required for Indian freelancers
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">💡 Pricing tips</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Research market rates for your skills and experience level</li>
            <li>• Consider your location, experience, and expertise when setting rates</li>
            <li>• Start with competitive rates and increase as you gain experience</li>
            <li>• Be flexible but don't undervalue your work</li>
            <li>• Different clients prefer different payment structures</li>
          </ul>
        </div>
      </form>
    </Form>
  );
};

export default Step6HourlyRate;
