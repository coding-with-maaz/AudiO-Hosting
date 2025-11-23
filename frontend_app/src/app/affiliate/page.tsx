'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMyAffiliate, useAffiliateStats, useCreateAffiliate, useRequestPayout } from '@/hooks/useAffiliate';
import { Button } from '@/components/ui/Button';
import {
  TrendingUp,
  Users,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
  Share2,
  BarChart3,
  Clock,
  CreditCard,
  AlertCircle,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { formatDate } from '@/utils/format';

export default function AffiliatePage() {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('paypal');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: affiliateData, isLoading: affiliateLoading, refetch: refetchAffiliate } = useMyAffiliate();
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useAffiliateStats();
  const createAffiliate = useCreateAffiliate();
  const requestPayout = useRequestPayout();

  const affiliate = affiliateData?.affiliate;
  const stats = statsData?.stats;
  const affiliateInfo = statsData?.affiliate;

  const hasAffiliate = !!affiliate;

  const handleCreateAffiliate = async () => {
    try {
      await createAffiliate.mutateAsync();
      refetchAffiliate();
      refetchStats();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to create affiliate account');
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      alert('Please enter a valid payout amount');
      return;
    }

    if (affiliateInfo && parseFloat(payoutAmount) < parseFloat(affiliateInfo.minPayout)) {
      alert(`Minimum payout amount is $${affiliateInfo.minPayout}`);
      return;
    }

    if (affiliateInfo && parseFloat(payoutAmount) > parseFloat(affiliateInfo.pendingEarnings)) {
      alert('Insufficient pending earnings');
      return;
    }

    try {
      await requestPayout.mutateAsync({
        amount: parseFloat(payoutAmount),
        payoutMethod,
        payoutDetails: payoutDetails ? JSON.parse(payoutDetails) : {},
      });
      alert('Payout request submitted successfully!');
      setShowPayoutModal(false);
      setPayoutAmount('');
      setPayoutDetails('');
      refetchStats();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to request payout');
    }
  };

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getAffiliateLink = () => {
    if (!affiliate) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/register?affiliate=${affiliate.affiliateCode}`;
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(parseFloat(String(amount)));
  };

  const formatPercentage = (value: number | string) => {
    return `${parseFloat(String(value)).toFixed(2)}%`;
  };

  if (affiliateLoading || statsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading affiliate dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              Affiliate Program
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Earn commissions by referring new users to our platform
            </p>
          </div>
        </div>

        {/* Create Affiliate Account */}
        {!hasAffiliate && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Join Our Affiliate Program
                </h3>
                <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                  Start earning commissions by sharing your unique affiliate link. You'll earn{' '}
                  {affiliateInfo?.commissionRate
                    ? formatPercentage(parseFloat(affiliateInfo.commissionRate) * 100)
                    : '15%'}{' '}
                  commission on every subscription made through your referral.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Track clicks and conversions in real-time
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Get paid via PayPal, Bank Transfer, or Crypto
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Lifetime commissions on recurring subscriptions
                  </li>
                </ul>
              </div>
              <Button
                onClick={handleCreateAffiliate}
                disabled={createAffiliate.isPending}
                isLoading={createAffiliate.isPending}
              >
                Join Now
              </Button>
            </div>
          </div>
        )}

        {/* Affiliate Dashboard */}
        {hasAffiliate && affiliate && (
          <>
            {/* Affiliate Code & Link */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Affiliate Code */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Affiliate Code</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(affiliate.affiliateCode, 'code')}
                  >
                    {copiedCode ? (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <code className="text-2xl font-bold text-gray-900 dark:text-white">
                    {affiliate.affiliateCode}
                  </code>
                </div>
              </div>

              {/* Affiliate Link */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Affiliate Link</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(getAffiliateLink(), 'link')}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <code className="break-all text-sm text-gray-900 dark:text-white">{getAffiliateLink()}</code>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getAffiliateLink(), '_blank')}
                  >
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Open Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Join Audio Hosting Platform',
                          text: 'Check out this amazing audio hosting platform!',
                          url: getAffiliateLink(),
                        });
                      }
                    }}
                  >
                    <Share2 className="mr-1 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Earnings */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earnings</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(stats.totalEarnings || 0)}
                      </p>
                    </div>
                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                      <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Pending Earnings */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Earnings</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(stats.pendingEarnings || 0)}
                      </p>
                    </div>
                    <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/20">
                      <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </div>

                {/* Paid Earnings */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Earnings</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(stats.paidEarnings || 0)}
                      </p>
                    </div>
                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                      <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Total Referrals */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Referrals</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.totalReferrals || 0}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {stats.activeReferrals || 0} active
                      </p>
                    </div>
                    <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                      <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-3">
                {/* Total Clicks */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clicks</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.totalClicks || 0}
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                {/* Total Signups */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Signups</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.totalSignups || 0}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.conversionRate ? formatPercentage(stats.conversionRate) : '0%'}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Payout Section */}
            {stats && parseFloat(stats.pendingEarnings) > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Request Payout</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      You have {formatCurrency(stats.pendingEarnings)} available for payout.
                      {affiliateInfo && (
                        <span className="ml-1">
                          Minimum payout: {formatCurrency(affiliateInfo.minPayout)}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button onClick={() => setShowPayoutModal(true)}>Request Payout</Button>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                      {stats.recentTransactions.map((transaction: any) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(transaction.createdAt)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {transaction.type === 'affiliate_commission' ? 'Commission' : transaction.type}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {transaction.user?.username || 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {transaction.plan?.name || 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                transaction.status === 'completed'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : transaction.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
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
                  <h3 className="font-semibold text-gray-900 dark:text-white">How It Works</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>
                      • Share your unique affiliate link with friends, on social media, or your website
                    </li>
                    <li>
                      • Earn{' '}
                      {affiliateInfo?.commissionRate
                        ? formatPercentage(parseFloat(affiliateInfo.commissionRate) * 100)
                        : '15%'}{' '}
                      commission on every subscription made through your referral
                    </li>
                    <li>• Commissions are tracked automatically and added to your pending earnings</li>
                    <li>
                      • Request payouts when you reach the minimum threshold (
                      {affiliateInfo ? formatCurrency(affiliateInfo.minPayout) : '$50'})
                    </li>
                    <li>• Payouts are processed within 5-7 business days</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Payout Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Request Payout</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={affiliateInfo?.minPayout || 50}
                    max={stats?.pendingEarnings || 0}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder={`Min: ${affiliateInfo ? formatCurrency(affiliateInfo.minPayout) : '$50'}`}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Available: {formatCurrency(stats?.pendingEarnings || 0)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payout Method
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="paypal">PayPal</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="crypto">Cryptocurrency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Details (JSON format)
                  </label>
                  <textarea
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    placeholder='{"email": "your@email.com"} or {"account": "123456789"}'
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowPayoutModal(false);
                      setPayoutAmount('');
                      setPayoutDetails('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleRequestPayout}
                    disabled={requestPayout.isPending}
                    isLoading={requestPayout.isPending}
                  >
                    Submit Request
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

