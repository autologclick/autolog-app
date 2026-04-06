'use client';

import { SkeletonAvatar, SkeletonCard, SkeletonText } from './Skeleton';
import { cn } from '@/lib/cn';

/**
 * DashboardSkeleton - Comprehensive loading skeleton for user dashboard
 * Shows all major sections while content is loading:
 * - Greeting/header area
 * - Vehicle selector
 * - Quick actions grid (responsive: 2x3 mobile, 3x2 desktop)
 * - Upcoming appointments card
 * - AI insights section
 *
 * RTL compatible and matches actual dashboard layout
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in">
      {/* Greeting/Header Section */}
      <div className="space-y-3">
        <div className="skeleton h-8 rounded-lg w-2/3" />
        <div className="skeleton h-4 rounded w-1/2" />
      </div>

      {/* Vehicle Selector Skeleton */}
      <div className="space-y-2">
        <div className="skeleton h-6 rounded w-1/4" />
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
          <SkeletonAvatar size="lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 rounded w-2/3" />
            <div className="skeleton h-3 rounded w-1/2" />
          </div>
          <div className="skeleton h-6 w-6 rounded" />
        </div>
      </div>

      {/* Quick Actions Grid - Responsive 2x3 on mobile, 3x2 on desktop */}
      <div className="space-y-2">
        <div className="skeleton h-6 rounded w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`quick-action-${i}`}
              className="p-4 bg-white rounded-xl border border-slate-200"
            >
              <div className="space-y-3">
                <div className="skeleton h-8 w-8 rounded-lg" />
                <div className="skeleton h-4 rounded w-full" />
                <div className="skeleton h-3 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="space-y-3">
        <div className="skeleton h-6 rounded w-1/3" />
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="space-y-4">
            {/* Appointment card header */}
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 rounded w-2/3" />
                <div className="skeleton h-4 rounded w-1/2" />
              </div>
              <div className="skeleton h-6 w-16 rounded" />
            </div>

            {/* Appointment details */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <div className="skeleton h-4 w-4 rounded" />
                <div className="skeleton h-4 rounded w-1/3" />
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton h-4 w-4 rounded" />
                <div className="skeleton h-4 rounded w-2/5" />
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton h-4 w-4 rounded" />
                <div className="skeleton h-4 rounded w-1/4" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <div className="skeleton h-9 flex-1 rounded-lg" />
              <div className="skeleton h-9 flex-1 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="skeleton h-6 w-6 rounded" />
          <div className="skeleton h-6 rounded w-1/4" />
        </div>

        {/* AI Insights Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={`ai-insight-${i}`}
              className="p-4 bg-white rounded-xl border border-slate-200"
            >
              <div className="space-y-3">
                {/* Insight badge */}
                <div className="flex items-center gap-2">
                  <div className="skeleton h-6 w-16 rounded-full" />
                  <div className="skeleton h-4 w-4 rounded" />
                </div>

                {/* Title and description */}
                <div className="space-y-2">
                  <div className="skeleton h-5 rounded w-4/5" />
                  <SkeletonText lines={2} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="space-y-3 pb-4">
        <div className="skeleton h-6 rounded w-1/3" />
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`stat-${i}`}
              className="p-4 bg-white rounded-xl border border-slate-200"
            >
              <div className="space-y-2">
                <div className="skeleton h-4 rounded w-2/3" />
                <div className="skeleton h-6 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * CompactDashboardSkeleton - Lighter version for quick load previews
 * Minimal structure for faster perception
 */
export function CompactDashboardSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-fade-in">
      {/* Header */}
      <div className="skeleton h-12 rounded-lg w-1/2" />

      {/* Quick grid */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-lg w-full" />
        ))}
      </div>

      {/* Content block */}
      <div className="skeleton h-40 rounded-xl w-full" />
    </div>
  );
}

/**
 * VehicleSelectSkeleton - Loading skeleton for vehicle selection
 * Shows avatar, vehicle name, and plate info
 */
export function VehicleSelectSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
      <SkeletonAvatar size="md" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * QuickActionSkeleton - Loading skeleton for quick action buttons
 * Shows icon placeholder and text
 */
export function QuickActionSkeleton() {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="skeleton h-8 w-8 rounded-lg" />
        <div className="skeleton h-4 rounded w-full" />
        <div className="skeleton h-3 rounded w-4/5" />
      </div>
    </div>
  );
}

/**
 * AppointmentSkeleton - Loading skeleton for appointment cards
 */
export function AppointmentSkeleton() {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 rounded w-2/3" />
            <div className="skeleton h-4 rounded w-1/2" />
          </div>
          <div className="skeleton h-6 w-20 rounded" />
        </div>

        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton h-4 w-4 rounded" />
              <div className="skeleton h-4 rounded w-2/5" />
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <div className="skeleton h-9 flex-1 rounded-lg" />
          <div className="skeleton h-9 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * AIInsightSkeleton - Loading skeleton for AI insights
 */
export function AIInsightSkeleton() {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-4 w-4 rounded" />
        </div>

        <div className="space-y-2">
          <div className="skeleton h-5 rounded w-4/5" />
          <div className="skeleton h-4 rounded w-full" />
          <div className="skeleton h-4 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}
