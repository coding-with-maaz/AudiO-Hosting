'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePlans, useMySubscriptions, useSubscribe, useCancelSubscription } from '@/hooks/usePlans';
import { useProfile } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { formatFileSize } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Check, X, CreditCard, Zap, Shield, Infinity, Calendar, AlertCircle, Crown, FileAudio } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PlansPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useMySubscriptions();
  const { profile } = useProfile();
  const { user, updateUser } = useAuthStore();
  const subscribe = useSubscribe();
  const cancelSubscription = useCancelSubscription();
  
  // Use profile from hook or fallback to auth store user
  const currentProfile = profile || user;

  const subscriptions = subscriptionsData?.subscriptions || [];
  const activeSubscription = subscriptions.find((sub: any) => sub.status === 'active');
  const currentPlanId = activeSubscription?.planId;

  const handleSubscribe = async (planId: string) => {
    if (confirm('Are you sure you want to subscribe to this plan? Your current subscription will be cancelled.')) {
      try {
        setSelectedPlan(planId);
        const result = await subscribe.mutateAsync(planId);
        
        if (result.success) {
          alert('Subscription created successfully! Please complete the payment to activate your plan.');
          // In a real app, you would redirect to payment page here
          // For now, we'll just refresh the page
          window.location.reload();
        }
      } catch (error: any) {
        console.error('Subscription error:', error);
        alert(error?.response?.data?.message || 'Failed to subscribe. Please try again.');
      } finally {
        setSelectedPlan(null);
      }
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    const reason = prompt('Please provide a reason for cancellation (optional):');
    if (confirm('Are you sure you want to cancel this subscription?')) {
      try {
        await cancelSubscription.mutateAsync({ id: subscriptionId, reason: reason || undefined });
        alert('Subscription cancelled successfully');
        window.location.reload();
      } catch (error: any) {
        console.error('Cancel subscription error:', error);
        alert(error?.response?.data?.message || 'Failed to cancel subscription. Please try again.');
      }
    }
  };

  const formatPrice = (price: number, currency: string = 'USD', billingPeriod: string) => {
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);

    if (billingPeriod === 'lifetime') {
      return formattedPrice;
    }
    return `${formattedPrice}/${billingPeriod === 'monthly' ? 'mo' : 'yr'}`;
  };

  const getStoragePercentage = () => {
    const profileData = currentProfile || user;
    if (!profileData?.storageLimit || profileData.storageLimit === 0) return 0;
    return ((profileData.storageUsed || 0) / profileData.storageLimit) * 100;
  };

  if (plansLoading || subscriptionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading plans...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Subscription Plans
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Choose the perfect plan for your audio hosting needs
          </p>
        </div>

        {/* Current Subscription Status */}
        {activeSubscription && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Current Plan: {activeSubscription.plan?.name}
                </h3>
                <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                  {activeSubscription.endDate
                    ? `Expires on ${new Date(activeSubscription.endDate).toLocaleDateString()}`
                    : 'Lifetime subscription'}
                </p>
                {currentProfile && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-blue-800 dark:text-blue-200">Storage Used</span>
                      <span className="text-blue-900 dark:text-blue-100 font-medium">
                        {formatFileSize(currentProfile.storageUsed || 0)} / {formatFileSize(currentProfile.storageLimit || 0)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
                      <div
                        className="h-full bg-blue-600 transition-all dark:bg-blue-400"
                        style={{ width: `${Math.min(getStoragePercentage(), 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {activeSubscription.status === 'active' && (
                <Button
                  variant="outline"
                  onClick={() => handleCancelSubscription(activeSubscription.id)}
                  disabled={cancelSubscription.isPending}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {plans && plans.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan: any) => {
              const isCurrentPlan = currentPlanId === plan.id;
              const isPending = selectedPlan === plan.id && subscribe.isPending;
              const features = plan.features || {};

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border-2 p-6 shadow-lg transition-all ${
                    plan.isPopular
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {/* Popular Badge */}
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                    {plan.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                    )}
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(parseFloat(plan.price), plan.currency, plan.billingPeriod)}
                      </span>
                      {plan.billingPeriod === 'lifetime' && (
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">one-time</span>
                      )}
                    </div>
                  </div>

                  {/* Plan Features */}
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Storage: {formatFileSize(plan.storageLimit)}
                      </span>
                    </div>

                    {plan.bandwidthLimit ? (
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Bandwidth: {formatFileSize(plan.bandwidthLimit)}/month
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Infinity className="h-5 w-5 text-purple-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Unlimited Bandwidth</span>
                      </div>
                    )}

                    {plan.maxFileSize && (
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Max File Size: {formatFileSize(plan.maxFileSize)}
                        </span>
                      </div>
                    )}

                    {plan.maxFiles && (
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Max Files: {plan.maxFiles.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Additional Features from JSON */}
                    {features.prioritySupport && (
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Priority Support</span>
                      </div>
                    )}
                    {features.customDomain && (
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Custom Domain</span>
                      </div>
                    )}
                    {features.apiAccess && (
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">API Access</span>
                      </div>
                    )}
                    {features.advancedAnalytics && (
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Advanced Analytics</span>
                      </div>
                    )}
                    {features.noWatermark && (
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">No Watermark</span>
                      </div>
                    )}
                  </div>

                  {/* Subscribe Button */}
                  <Button
                    className={`w-full ${
                      plan.isPopular
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan || isPending}
                    isLoading={isPending}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : isPending
                      ? 'Subscribing...'
                      : `Subscribe${plan.billingPeriod === 'lifetime' ? ' Now' : ''}`}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <CreditCard className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No plans available</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please contact support to set up subscription plans
            </p>
          </div>
        )}

        {/* Subscription History */}
        {subscriptions.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Subscription History</h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Auto Renew
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {subscriptions.map((subscription: any) => (
                    <tr key={subscription.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {subscription.plan?.name || 'Unknown Plan'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            subscription.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : subscription.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {subscription.endDate
                          ? new Date(subscription.endDate).toLocaleDateString()
                          : 'Lifetime'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {subscription.autoRenew ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400" />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        {subscription.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelSubscription(subscription.id)}
                            disabled={cancelSubscription.isPending}
                          >
                            Cancel
                          </Button>
                        )}
                        {subscription.status === 'pending' && (
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">
                            Payment pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">About Subscriptions</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Subscribing to a new plan will automatically cancel your current active subscription</li>
                <li>• Storage limits are updated immediately upon subscription</li>
                <li>• Monthly and yearly plans auto-renew unless cancelled</li>
                <li>• Lifetime plans never expire</li>
                <li>• You can cancel your subscription at any time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

